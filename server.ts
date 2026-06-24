import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { db } from "./src/db/index";
import { users } from "./src/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthRequest } from "./src/middleware/auth";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

app.post("/api/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.uid, req.user.uid));
    
    if (existingUser.length === 0) {
      // Create user
      await db.insert(users).values({
        uid: req.user.uid,
        email: req.user.email || "",
      });
      return res.json({ message: "User profile created", isNew: true });
    }
    
    res.json({ message: "User profile exists", isNew: false });
  } catch (err) {
    console.error("Profile sync error:", err);
    res.status(500).json({ error: "Failed to sync profile" });
  }
});

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;
let last429Timestamp = 0;
let last429ApiKey = "";
const QUOTA_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes cache/cooldown for quota warnings

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined in the environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Safe wrapper around generateContent that retries with fallback models if the first one fails
async function generateContentWithFallback(
  params: {
    model?: string;
    contents: any;
    config?: any;
  }
) {
  const isCurrentlyBlocked = (Date.now() - last429Timestamp) < QUOTA_COOLDOWN_MS && last429ApiKey === (process.env.GEMINI_API_KEY || "");
  if (isCurrentlyBlocked) {
    console.warn("[AI Client] Quota block is active. Skipping model queries to prevent log flooding.");
    throw new Error("QUOTA_EXCEEDED: API Key is currently rate limited.");
  }

  const modelsToTry = [
    params.model || "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite"
  ];

  let lastError: any = null;
  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[AI Client] Querying model: ${model} (Attempt ${attempt}/2)`);
        const ai = getAIClient();
        const response = await ai.models.generateContent({
          ...params,
          model,
        });
        return response;
      } catch (err: any) {
        lastError = err;

        // Smart check for quota/rate limit error (429 / RESOURCE_EXHAUSTED)
        const errStr = ((err.message || "") + " " + JSON.stringify(err)).toLowerCase();
        const isQuotaExceeded = errStr.includes("quota") || errStr.includes("resource_exhausted") || errStr.includes("429");

        if (isQuotaExceeded) {
          console.warn(`[AI Client] Quota exceeded for model ${model}. Skipping further attempts for this model.`);
          last429Timestamp = Date.now();
          last429ApiKey = process.env.GEMINI_API_KEY || "";
          break; // Break current attempts loop, fall through to next model immediately
        }

        console.warn(`[AI Client] Model ${model} attempt ${attempt} failed:`, err.message || err);

        if (attempt === 1) {
          const delay = 500;
          console.log(`[AI Client] Retrying ${model} after ${delay}ms...`);
          await sleep(delay);
        }
      }
    }
  }
  throw lastError;
}

// 1. Get Proactive Coach Nudges
app.post("/api/gemini/nudge", async (req, res) => {
  const { tasks, habits } = req.body;
  try {
    const prompt = `Based on the following tasks and daily habits, act as a supportive, empathetic, and highly active productivity companion. 
Identify the most critical task or trend (e.g., upcoming deadlines, low habit completion) and generate a supportive "Proactive Nudge".
Acknowledge the stress levels, provide an actionable micro-step (something that takes less than 5 minutes to start), choose a dynamic urgency level, and give an encouraging quote.

Tasks: ${JSON.stringify(tasks)}
Habits: ${JSON.stringify(habits)}

Generate the nudge matching the JSON structure schema. Do not use markdown tags outside of the JSON representation.`;

    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Short punchy alert title, e.g., 'Rescue Mode Active' or 'Momentum Builder'."
            },
            message: {
              type: Type.STRING,
              description: "A supportive, 2-sentence empathetic analysis of their current load."
            },
            actionableStep: {
              type: Type.STRING,
              description: "A super easy micro-step of what they should do RIGHT NOW for 2-5 minutes to overcome resistance."
            },
            urgencyColor: {
              type: Type.STRING,
              description: "Urgency color accent based on deadline stress: 'red' (critical), 'yellow' (moderate warning), or 'green' (good progress / warm coaching)."
            },
            motivationalQuote: {
              type: Type.STRING,
              description: "A warm, non-cliché quote or piece of cognitive reframing advice."
            }
          },
          required: ["title", "message", "actionableStep", "urgencyColor", "motivationalQuote"]
        }
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.warn("Error generating nudge (using offline fallback):", error.message || error);
    // Dynamic Fallback based on tasks
    let title = "Self-Rescue Companion";
    let message = "The first step is always the hardest. Pick your highest urgency task, set a timer for 5 minutes, and agree to stop if you want to. Usually, you won't!";
    let actionableStep = "Open your top task and write down exactly one sentence or one bullet point.";
    let urgencyColor = "yellow";
    
    // Check if we have active/incomplete tasks
    const pendingTasks = (tasks || []).filter((t: any) => t.status !== "completed");
    if (pendingTasks.length > 0) {
      // Find critical tasks first, otherwise just the first pending task
      const criticalTask = pendingTasks.find((t: any) => t.priority === "critical") || pendingTasks[0];
      const name = criticalTask.title;
      urgencyColor = criticalTask.priority === "critical" ? "red" : "yellow";
      title = `RESCUE MODE: ${name.toUpperCase()}`;
      message = `I noticed you have "${name}" pending. Passive reminders sometimes add pressure; let's break that pattern with a tiny, risk-free micro-commitment.`;
      actionableStep = `Open your project/editor for "${name}", set a physical timer for exactly 3 minutes, and write just 5 words of draft content.`;
    }

    res.json({
      title,
      message,
      actionableStep,
      urgencyColor,
      motivationalQuote: "Action breeds confidence and courage. If you want to conquer fear, do not sit home and think about it."
    });
  }
});

// 2. Autonomous Task Breakdown
app.post("/api/gemini/breakdown", async (req, res) => {
  try {
    const { taskTitle, taskDescription, timeAvailableMinutes } = req.body;

    const prompt = `Break down the following daunting task into a highly realistic, hour-by-hour or step-by-step action plan.
Task Title: "${taskTitle}"
Description: "${taskDescription || 'No description provided'}"
Estimated Time Available: ${timeAvailableMinutes || 60} minutes

Create 3 to 5 micro-steps that are concrete, bite-sized, and designed to minimize cognitive friction or procrastination.
Also, provide custom "focus tips" specific to this type of work (e.g., Pomodoro, distraction-blocking, or environmental hacks).`;

    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Actionable micro-step description." },
                  estimatedMinutes: { type: Type.INTEGER, description: "Estimated completion time." }
                },
                required: ["title", "estimatedMinutes"]
              }
            },
            focusTips: {
              type: Type.STRING,
              description: "Tailored behavioral tip or environment hack to beat resistance for this task."
            }
          },
          required: ["subtasks", "focusTips"]
        }
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.warn("Error breaking down task (using offline fallback):", error.message || error);
    // Fallback steps
    res.json({
      subtasks: [
        { title: "Define the absolute first physical action (e.g., opening a document)", estimatedMinutes: 5 },
        { title: "Draft a messy, imperfect version of the first section with zero self-editing", estimatedMinutes: 20 },
        { title: "Review the rough draft and flesh out key missing points", estimatedMinutes: 15 },
        { title: "Polishing and final check", estimatedMinutes: 10 }
      ],
      focusTips: "Use the '5-Minute Rule': Commit to working on step 1 for only 5 minutes. If you want to quit after 5 minutes, you have permission to do so. Starting is 90% of the battle."
    });
  }
});

// 3. Smart Task Prioritization Advice
app.post("/api/gemini/prioritize", async (req, res) => {
  const { tasks } = req.body;
  try {
    const prompt = `Analyze this list of tasks and return an intelligent suggestion on which 3 tasks should be prioritized first, along with a psychological justification of why (e.g., Eisenhower Matrix, high anxiety reduction, or quick momentum wins).

Tasks: ${JSON.stringify(tasks)}`;

    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priorities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  taskId: { type: Type.STRING, description: "The ID of the task." },
                  reason: { type: Type.STRING, description: "Empathy-driven psychological reason to tackle this first." }
                },
                required: ["taskId", "reason"]
              }
            },
            generalAdvice: {
              type: Type.STRING,
              description: "Supportive overview of how to sequence the day."
            }
          },
          required: ["priorities", "generalAdvice"]
        }
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.warn("Error prioritizing tasks (using offline fallback):", error.message || error);
    
    // Dynamic fallback prioritizer that operates perfectly offline
    const pendingTasks = (tasks || []).filter((t: any) => t.status !== "completed");
    const priorities: any[] = [];
    
    if (pendingTasks.length > 0) {
      // Sort tasks: critical first, then imminent, then upcoming
      const sorted = [...pendingTasks].sort((a: any, b: any) => {
        const priorityOrder: Record<string, number> = { critical: 1, imminent: 2, upcoming: 3 };
        const orderA = priorityOrder[a.priority] || 3;
        const orderB = priorityOrder[b.priority] || 3;
        if (orderA !== orderB) return orderA - orderB;
        // Fallback to deadline sorting
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });

      // Take top 3
      const top3 = sorted.slice(0, 3);
      top3.forEach((task: any, index: number) => {
        let reason = "An easy momentum builder to stack a quick victory before tackling heavier blocks.";
        if (task.priority === "critical") {
          reason = `Impending critical milestone. Completing a 5-minute slice of "${task.title}" immediately relieves cognitive load.`;
        } else if (task.priority === "imminent") {
          reason = `Highly productive block. Getting "${task.title}" done early builds powerful momentum for the rest of your day.`;
        } else if (index === 0) {
          reason = `Top pick to kickstart your focus. Clear "${task.title}" to trigger a positive dopamine loop.`;
        }
        
        priorities.push({
          taskId: task.id,
          reason
        });
      });
    }

    res.json({
      priorities,
      generalAdvice: priorities.length > 0 
        ? "I have analyzed your workload locally. Start with the top recommended slice below to override resistance. Starting is 90% of the battle!"
        : "Focus on your single most anxiety-inducing task first. Completing it releases a massive wave of dopamine that carries you through the rest of your day."
    });
  }
});

// 4. AI Coach Chat / Companion
app.post("/api/gemini/chat", async (req, res) => {
  const { messages, tasks, habits } = req.body;
  try {
    // Limit previous history to last 10 messages for token hygiene
    const formattedHistory = messages.slice(-10).map((m: any) => `${m.sender.toUpperCase()}: ${m.text}`).join("\n");

    const prompt = `You are "Saver Bot" - an empathetic, witty, and highly proactive productivity savior coach.
Your job is NOT just to act as a chatbot, but to actively help the user overcome anxiety, executive dysfunction, and ADHD-style resistance to starting.
Be conversational, brief (under 3 sentences per response), and action-oriented. Always recommend a concrete tiny step.

User's current task board: ${JSON.stringify(tasks)}
User's habits: ${JSON.stringify(habits)}

Conversation History:
${formattedHistory}

SAVER BOT:`;

    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ text: response.text || "I am right here with you! Let's pick a task and break it down." });
  } catch (error: any) {
    console.warn("Error in AI Coach Chat (using offline fallback):", error.message || error);
    const lastUserMessageObj = messages && messages.length > 0 ? messages[messages.length - 1] : null;
    const lastUserMsg = lastUserMessageObj ? lastUserMessageObj.text.toLowerCase() : "";
    
    let reply = "I'm right here in your corner! Let's take a deep breath, pick a single task from your board, and break it down into tiny steps.";
    
    // Rule-based empathetic matching for key themes
    if (lastUserMsg.includes("hello") || lastUserMsg.includes("hi ") || lastUserMsg.includes("hey")) {
      reply = "Hey! I'm Saver Bot. I'm right here in your corner. Let's look at your board, pick a tiny task, and start together!";
    } else if (lastUserMsg.includes("stuck") || lastUserMsg.includes("procrastinat") || lastUserMsg.includes("start") || lastUserMsg.includes("lazy") || lastUserMsg.includes("hard")) {
      reply = "Executive dysfunction is real, but it's not laziness! It's emotional resistance to friction. Let's try the 2-minute rule: pick one task, open it, and just write one letter. You can stop right after.";
    } else if (lastUserMsg.includes("help") || lastUserMsg.includes("what to do") || lastUserMsg.includes("tips") || lastUserMsg.includes("priorit")) {
      reply = "I recommend running our Smart Prioritizer, or clicking 'Gemini breakdown' on any task to chop it into smaller, non-threatening bite-sized chunks.";
    } else if (lastUserMsg.includes("break") || lastUserMsg.includes("tired") || lastUserMsg.includes("anxious") || lastUserMsg.includes("stress") || lastUserMsg.includes("worry")) {
      reply = "You're doing great. Take a deep, 4-second breath right now... Hold it... and release. No one is perfect. Just doing 1% today is a massive win.";
    } else {
      // Reference a pending task if available
      const pendingTasks = (tasks || []).filter((t: any) => t.status !== "completed");
      if (pendingTasks.length > 0) {
        reply = `I see you have "${pendingTasks[0].title}" on your plate. Want to tackle just 2 minutes of it right now? Starting is the only hard part!`;
      }
    }
    
    res.json({ text: reply });
  }
});

// 5. Text-To-Speech API (for vocal encouragement and spoken schedules)
app.post("/api/gemini/tts", async (req, res) => {
  try {
    const { text, voice } = req.body;

    const isCurrentlyBlocked = (Date.now() - last429Timestamp) < QUOTA_COOLDOWN_MS && last429ApiKey === (process.env.GEMINI_API_KEY || "");
    if (isCurrentlyBlocked) {
      console.warn("[TTS Client] Quota block is active. Skipping TTS generation.");
      throw new Error("QUOTA_EXCEEDED: API Key is currently rate limited.");
    }

    const ai = getAIClient();

    let response: any = null;
    let lastTtsError: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[TTS Client] Generating audio with gemini-3.1-flash-tts-preview (Attempt ${attempt}/3)...`);
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: `Act as an encouraging coach and say clearly: ${text}` }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice || 'Kore' }, // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
              },
            },
          },
        });
        break;
      } catch (err: any) {
        lastTtsError = err;

        // Check for quota/rate limit error (429 / RESOURCE_EXHAUSTED)
        const errStr = ((err.message || "") + " " + JSON.stringify(err)).toLowerCase();
        const isQuotaExceeded = errStr.includes("quota") || errStr.includes("resource_exhausted") || errStr.includes("429");

        if (isQuotaExceeded) {
          console.warn(`[TTS Client] Quota exceeded for TTS. Skipping further retries.`);
          last429Timestamp = Date.now();
          last429ApiKey = process.env.GEMINI_API_KEY || "";
          break; // Break the attempt loop
        }

        console.warn(`[TTS Client] Attempt ${attempt} failed:`, err.message || err);

        if (attempt < 3) {
          await sleep(500);
        }
      }
    }

    if (!response && lastTtsError) {
      throw lastTtsError;
    }

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audio: base64Audio });
    } else {
      res.status(500).json({ error: "No audio generated" });
    }
  } catch (error: any) {
    console.warn("Error generating TTS audio (falling back to browser speaker):", error.message || error);
    res.status(500).json({ error: "TTS service currently unavailable or no API key set up." });
  }
});

// 6. Gemini API Connection & Quota Status
app.get("/api/gemini/status", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  const isCurrentlyBlocked = (Date.now() - last429Timestamp) < QUOTA_COOLDOWN_MS;
  res.json({
    hasKey,
    quotaExceeded: isCurrentlyBlocked,
    cooldownRemainingMs: Math.max(0, QUOTA_COOLDOWN_MS - (Date.now() - last429Timestamp))
  });
});

// Vite Middleware & Static Asset Serving Setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`The Last-Minute Life Saver server is running on http://localhost:${PORT}`);
  });
}

startServer();
