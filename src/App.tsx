import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Play, Volume2, Flame, AlertCircle, Compass, 
  Clock, Plus, Trash2, CheckCircle2, Circle, Send, VolumeX, Check, RefreshCw,
  Calendar, Mic, MicOff, Bell, Target, Award, ShieldAlert, UserCheck, LogOut, LogIn
} from "lucide-react";
import { Task, Habit, ProactiveNudge, Message, Workspace, DailyGoal } from "./types";
import { DEFAULT_TASKS, DEFAULT_HABITS, ATHLETE_CS_PRESET } from "./presets";
import TaskBoard from "./components/TaskBoard";
import AutonomousPlanner from "./components/AutonomousPlanner";
import CalendarView from "./components/CalendarView";
import RemindersAlertCenter from "./components/RemindersAlertCenter";
import { initAuth, googleSignIn, logout, getAccessToken } from "./lib/firebase";
import { User } from "firebase/auth";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setUser(user);
        setToken(token);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        
        // Sync profile to backend
        try {
          const idToken = await result.user.getIdToken();
          await fetch('/api/profile', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });
        } catch (err) {
          console.warn("Failed to sync profile:", err);
        }

        // Clear workspace when signing in as requested
        handleClearWorkspace();
      }
    } catch (err) {
      console.error("Login failed:", err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setNeedsAuth(true);
  };

  // Load workspace lists or generate them
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const saved = localStorage.getItem("lifesaver_workspaces");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to parse workspaces", e);
      }
    }

    // Migration / Compatibility Check:
    const oldTasks = localStorage.getItem("lifesaver_tasks");
    const oldHabits = localStorage.getItem("lifesaver_habits");
    const oldGoals = localStorage.getItem("lifesaver_daily_goals");
    const oldChat = localStorage.getItem("lifesaver_chat");

    if (oldTasks || oldHabits || oldGoals || oldChat) {
      const migratedWorkspace: Workspace = {
        id: "active_migrated",
        name: "My Active Workspace",
        tasks: oldTasks ? JSON.parse(oldTasks) : ATHLETE_CS_PRESET.tasks,
        habits: oldHabits ? JSON.parse(oldHabits) : ATHLETE_CS_PRESET.habits,
        dailyGoals: oldGoals ? JSON.parse(oldGoals) : ATHLETE_CS_PRESET.dailyGoals,
        messages: oldChat ? JSON.parse(oldChat) : ATHLETE_CS_PRESET.messages,
        nudge: ATHLETE_CS_PRESET.nudge
      };

      return [
        migratedWorkspace,
        {
          id: "athlete_cs",
          name: "CS Athlete Sync (Preset)",
          tasks: ATHLETE_CS_PRESET.tasks,
          habits: ATHLETE_CS_PRESET.habits,
          dailyGoals: ATHLETE_CS_PRESET.dailyGoals,
          messages: ATHLETE_CS_PRESET.messages,
          nudge: ATHLETE_CS_PRESET.nudge
        },
        {
          id: "academic",
          name: "Academic Default (Preset)",
          tasks: DEFAULT_TASKS,
          habits: DEFAULT_HABITS,
          dailyGoals: [
            { id: "g-1", title: "Complete 1 High-Anxiety Chemistry subtask", completed: false },
            { id: "g-2", title: "Review dental reschedule SURGERY card", completed: false },
            { id: "g-3", title: "Complete Stand & Stretch routine 3 times", completed: false }
          ],
          messages: [
            {
              id: "msg-init",
              sender: "ai",
              text: "🚨 Operation Save-Your-Day is online! I'm your active productivity savior. Let's conquer the anxiety block. Tell me, what single thing is stressing you out the absolute most right now?",
              timestamp: new Date().toLocaleTimeString()
            }
          ],
          nudge: {
            title: "EMERGENCY BUFFER ACTIVATED",
            message: "You have highly impending deadlines approaching. Standard passive reminders fail because starting is the real battle. We need immediate micro-commitments.",
            actionableStep: "Pick your highest urgency card. Open it, set a physical timer for exactly 3 minutes, and write just 5 messy draft words.",
            urgencyColor: "red",
            motivationalQuote: "To do anything else is a distraction. Give yourself permission to fail, as long as you start today."
          }
        }
      ];
    }

    // Default templates
    return [
      {
        id: "athlete_cs",
        name: "CS Athlete Sync",
        tasks: ATHLETE_CS_PRESET.tasks,
        habits: ATHLETE_CS_PRESET.habits,
        dailyGoals: ATHLETE_CS_PRESET.dailyGoals,
        messages: ATHLETE_CS_PRESET.messages,
        nudge: ATHLETE_CS_PRESET.nudge
      },
      {
        id: "academic",
        name: "Academic Default",
        tasks: DEFAULT_TASKS,
        habits: DEFAULT_HABITS,
        dailyGoals: [
          { id: "g-1", title: "Complete 1 High-Anxiety Chemistry subtask", completed: false },
          { id: "g-2", title: "Review dental reschedule SURGERY card", completed: false },
          { id: "g-3", title: "Complete Stand & Stretch routine 3 times", completed: false }
        ],
        messages: [
          {
            id: "msg-init",
            sender: "ai",
            text: "🚨 Operation Save-Your-Day is online! I'm your active productivity savior. Let's conquer the anxiety block. Tell me, what single thing is stressing you out the absolute most right now?",
            timestamp: new Date().toLocaleTimeString()
          }
        ],
        nudge: {
          title: "EMERGENCY BUFFER ACTIVATED",
          message: "You have highly impending deadlines approaching. Standard passive reminders fail because starting is the real battle. We need immediate micro-commitments.",
          actionableStep: "Pick your highest urgency card. Open it, set a physical timer for exactly 3 minutes, and write just 5 messy draft words.",
          urgencyColor: "red",
          motivationalQuote: "To do anything else is a distraction. Give yourself permission to fail, as long as you start today."
        }
      }
    ];
  });

  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>(() => {
    return localStorage.getItem("lifesaver_current_workspace_id") || "athlete_cs";
  });

  const activeWorkspace = workspaces.find(ws => ws.id === currentWorkspaceId) || workspaces[0] || {
    id: "athlete_cs",
    name: "CS Athlete Sync",
    tasks: ATHLETE_CS_PRESET.tasks,
    habits: ATHLETE_CS_PRESET.habits,
    dailyGoals: ATHLETE_CS_PRESET.dailyGoals,
    messages: ATHLETE_CS_PRESET.messages,
    nudge: ATHLETE_CS_PRESET.nudge
  };

  const [tasks, setTasks] = useState<Task[]>(() => activeWorkspace.tasks);
  const [habits, setHabits] = useState<Habit[]>(() => activeWorkspace.habits);
  const [messages, setMessages] = useState<Message[]>(() => activeWorkspace.messages);
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>(() => activeWorkspace.dailyGoals);
  const [nudge, setNudge] = useState<ProactiveNudge | null>(() => activeWorkspace.nudge);

  const [activeTab, setActiveTab] = useState<"board" | "planner" | "calendar" | "habits" | "chat">("board");
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Voice Assistance state
  const [isListening, setIsListening] = useState(false);
  const [autoReadout, setAutoReadout] = useState(false);

  // Sync state back to workspaces array safely
  useEffect(() => {
    setWorkspaces(prev => {
      const existing = prev.find(ws => ws.id === currentWorkspaceId);
      if (!existing) return prev; // Avoid overwriting during deletion or switching transitions

      // Skip updating if values are already equal to prevent infinite loops and stale overwrites
      if (
        existing.tasks === tasks &&
        existing.habits === habits &&
        existing.dailyGoals === dailyGoals &&
        existing.messages === messages &&
        existing.nudge === nudge
      ) {
        return prev;
      }

      return prev.map(ws => {
        if (ws.id === currentWorkspaceId) {
          return {
            ...ws,
            tasks,
            habits,
            dailyGoals,
            messages,
            nudge
          };
        }
        return ws;
      });
    });
  }, [tasks, habits, dailyGoals, messages, nudge, currentWorkspaceId]);

  // Persist workspaces to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("lifesaver_workspaces", JSON.stringify(workspaces));
  }, [workspaces]);

  useEffect(() => {
    localStorage.setItem("lifesaver_current_workspace_id", currentWorkspaceId);
  }, [currentWorkspaceId]);

  // Keep standalone backups to keep external parts happy
  useEffect(() => {
    localStorage.setItem("lifesaver_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("lifesaver_habits", JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem("lifesaver_chat", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("lifesaver_daily_goals", JSON.stringify(dailyGoals));
  }, [dailyGoals]);

  // Live ticking clock state for UTC Emergency Monitor & other locations (e.g., IST/India)
  const [systemTime, setSystemTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleGoal = (id: string) => {
    setDailyGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.target as any).elements.goalTitle;
    const title = input.value.trim();
    if (!title) return;
    setDailyGoals(prev => [...prev, { id: `g-${Date.now()}`, title, completed: false }]);
    input.value = "";
  };

  const handleDeleteGoal = (id: string) => {
    setDailyGoals(prev => prev.filter(g => g.id !== id));
  };

  // Voice recording transcriber using Web Speech API
  const handleStartVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser environment. Try using Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Proactive Coaching Nudge state
  const [isLoadingNudge, setIsLoadingNudge] = useState(false);
  const [showGlobalTime, setShowGlobalTime] = useState(false);

  // AI prioritization advice
  const [priorityRecommendations, setPriorityRecommendations] = useState<{ taskId: string; reason: string }[]>([]);
  const [generalAdvice, setGeneralAdvice] = useState("");
  const [isPrioritizing, setIsPrioritizing] = useState(false);

  // TTS Voice coaching
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsErrorMessage, setTtsErrorMessage] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // AI Connection & Quota status
  const [aiStatus, setAiStatus] = useState<{ hasKey: boolean; quotaExceeded: boolean } | null>(null);

  const checkAiStatus = async () => {
    try {
      const res = await fetch("/api/gemini/status");
      if (res.ok) {
        const data = await res.json();
        setAiStatus(data);
      }
    } catch (err) {
      console.warn("Failed checking AI status:", err);
    }
  };

  useEffect(() => {
    checkAiStatus();
    const interval = setInterval(checkAiStatus, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, []);

  // Load Proactive Nudge on mount & when tasks change significantly
  useEffect(() => {
    fetchNudge();
  }, []);

  const handleLoadPreset = (presetType: "athlete_cs" | "academic" | "clear") => {
    if (presetType === "athlete_cs") {
      setTasks(ATHLETE_CS_PRESET.tasks);
      setHabits(ATHLETE_CS_PRESET.habits);
      setDailyGoals(ATHLETE_CS_PRESET.dailyGoals);
      setNudge(ATHLETE_CS_PRESET.nudge);
      setMessages(ATHLETE_CS_PRESET.messages);
    } else if (presetType === "academic") {
      setTasks(DEFAULT_TASKS);
      setHabits(DEFAULT_HABITS);
      const defaultGoals = [
        { id: "g-1", title: "Complete 1 High-Anxiety Chemistry subtask", completed: false },
        { id: "g-2", title: "Review dental reschedule SURGERY card", completed: false },
        { id: "g-3", title: "Complete Stand & Stretch routine 3 times", completed: false }
      ];
      setDailyGoals(defaultGoals);
      setMessages([
        {
          id: "msg-init",
          sender: "ai",
          text: "🚨 Operation Save-Your-Day is online! I'm your active productivity savior. Let's conquer the anxiety block. Tell me, what single thing is stressing you out the absolute most right now?",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      setNudge({
        title: "EMERGENCY BUFFER ACTIVATED",
        message: "You have highly impending deadlines approaching. Standard passive reminders fail because starting is the real battle. We need immediate micro-commitments.",
        actionableStep: "Pick your highest urgency card. Open it, set a physical timer for exactly 3 minutes, and write just 5 messy draft words.",
        urgencyColor: "red",
        motivationalQuote: "To do anything else is a distraction. Give yourself permission to fail, as long as you start today."
      });
    } else if (presetType === "clear") {
      setTasks([]);
      setHabits([]);
      setDailyGoals([]);
      setNudge({
        title: "BLANK CANVAS READY",
        message: "Everything has been wiped clean. There are no tasks, no habits, and no distractions. This is your chance to start fresh with high intention.",
        actionableStep: "Create your very first task or habit using the buttons below to begin mapping your day.",
        urgencyColor: "yellow",
        motivationalQuote: "The secret of getting ahead is getting started."
      });
      setMessages([
        {
          id: "msg-clear",
          sender: "ai",
          text: "🧹 All systems cleared! Your workspace is a blank slate. What is your top focus right now? Write a task or start tracking a habit.",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }
  };

  const handleSwitchWorkspace = (targetId: string) => {
    const target = workspaces.find(ws => ws.id === targetId);
    if (target) {
      setCurrentWorkspaceId(targetId);
      setTasks(target.tasks);
      setHabits(target.habits);
      setDailyGoals(target.dailyGoals);
      setMessages(target.messages);
      setNudge(target.nudge);
    }
  };

  const handleCreateWorkspace = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const newId = `ws-${Date.now()}`;
    const newWorkspace: Workspace = {
      id: newId,
      name: trimmedName,
      tasks: [],
      habits: [],
      dailyGoals: [],
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: "ai",
          text: `🧹 Welcome to your brand new workspace: "${trimmedName}"! This is a completely blank canvas for your active focus. Create your tasks and habits to map out your routine.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ],
      nudge: {
        title: "FRESH FOCUS ARCHITECTURE",
        message: "This is a clean, distraction-free cockpit. Design your life's rhythms without any historic anxiety carrying over.",
        actionableStep: "Create a critical task to establish a baseline focus.",
        urgencyColor: "yellow",
        motivationalQuote: "Clean slate, clean mind. Step by step, we build momentum."
      }
    };

    setWorkspaces(prev => [...prev, newWorkspace]);
    setCurrentWorkspaceId(newId);
    setTasks(newWorkspace.tasks);
    setHabits(newWorkspace.habits);
    setDailyGoals(newWorkspace.dailyGoals);
    setMessages(newWorkspace.messages);
    setNudge(newWorkspace.nudge);
  };

  const handleClearWorkspace = () => {
    setTasks([]);
    setHabits([]);
    setDailyGoals([]);
    setNudge({
      title: "BLANK CANVAS READY",
      message: "Everything has been wiped clean in this workspace. There are no tasks, no habits, and no distractions. This is your chance to start fresh with high intention.",
      actionableStep: "Create your very first task or habit to begin mapping your day.",
      urgencyColor: "yellow",
      motivationalQuote: "The secret of getting ahead is getting started."
    });
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: "ai",
        text: "🧹 This workspace has been cleared to a pristine blank slate. What is your top focus right now?",
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  const handleDeleteWorkspace = (id: string) => {
    if (workspaces.length <= 1) {
      alert("You must keep at least one active workspace!");
      return;
    }

    const updated = workspaces.filter(ws => ws.id !== id);
    setWorkspaces(updated);

    if (currentWorkspaceId === id) {
      const fallback = updated[0];
      setCurrentWorkspaceId(fallback.id);
      setTasks(fallback.tasks);
      setHabits(fallback.habits);
      setDailyGoals(fallback.dailyGoals);
      setMessages(fallback.messages);
      setNudge(fallback.nudge);
    }
  };

  const fetchNudge = async () => {
    setIsLoadingNudge(true);
    try {
      const res = await fetch("/api/gemini/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, habits })
      });
      if (!res.ok) throw new Error("Failed to load nudge");
      const data = await res.json();
      setNudge(data);
    } catch (err) {
      console.warn("Nudge fetch failed:", err);
      checkAiStatus();
      // Hardcoded fallback that adheres to design principles
      setNudge({
        title: "EMERGENCY BUFFER ACTIVATED",
        message: "You have highly impending deadlines approaching. Standard passive reminders fail because starting is the real battle. We need immediate micro-commitments.",
        actionableStep: "Pick your highest urgency card. Open it, set a physical timer for exactly 3 minutes, and write just 5 messy draft words.",
        urgencyColor: "red",
        motivationalQuote: "To do anything else is a distraction. Give yourself permission to fail, as long as you start today."
      });
    } finally {
      setIsLoadingNudge(false);
    }
  };

  const handleSyncGoogleWorkspace = async () => {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        alert("Please sign in first to sync data.");
        return;
      }

      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        sender: "ai",
        text: "🔄 Initiating sync with Google Workspace (Tasks, Calendar, Docs)...",
        timestamp: new Date().toLocaleTimeString()
      }]);
      setActiveTab("chat");

      // We'll fetch from the Google APIs using the access token
      // 1. Fetch Tasks
      const tasksRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const tasksData = await tasksRes.json();
      
      let importedTasksCount = 0;
      if (tasksData.items && tasksData.items.length > 0) {
        const firstListId = tasksData.items[0].id;
        const taskItemsRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${firstListId}/tasks`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const taskItemsData = await taskItemsRes.json();
        
        if (taskItemsData.items) {
          const newTasks: Task[] = taskItemsData.items.map((t: any, i: number) => ({
            id: `g-task-${Date.now()}-${i}`,
            title: t.title,
            description: t.notes || "",
            status: t.status === "completed" ? "completed" : "pending",
            subtasks: [],
            dueDate: t.due ? new Date(t.due).toLocaleDateString() : undefined,
            category: "Google Tasks"
          }));
          setTasks(prev => [...newTasks, ...prev]);
          importedTasksCount = newTasks.length;
        }
      }

      // 2. Fetch Calendar Events
      const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=5&singleEvents=true&orderBy=startTime`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const calData = await calRes.json();
      
      let importedEventsCount = 0;
      if (calData.items) {
        const newGoals: DailyGoal[] = calData.items.map((e: any, i: number) => ({
          id: `g-cal-${Date.now()}-${i}`,
          title: `Event: ${e.summary}`,
          completed: false
        }));
        setDailyGoals(prev => [...newGoals, ...prev]);
        importedEventsCount = newGoals.length;
      }

      setMessages(prev => [...prev, {
        id: `msg-${Date.now() + 1}`,
        sender: "ai",
        text: `✅ Sync Complete. Imported ${importedTasksCount} Tasks and ${importedEventsCount} Calendar Events into your workspace.`,
        timestamp: new Date().toLocaleTimeString()
      }]);

    } catch (error) {
      console.error("Sync error:", error);
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        sender: "ai",
        text: "❌ Failed to sync Google Workspace data. Please check your permissions and try again.",
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  const handleRunPrioritization = async () => {
    setIsPrioritizing(true);
    try {
      const res = await fetch("/api/gemini/prioritize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks })
      });
      if (!res.ok) throw new Error("Failed prioritizing");
      const data = await res.json();
      setPriorityRecommendations(data.priorities || []);
      setGeneralAdvice(data.generalAdvice || "");
    } catch (err) {
      console.warn("Prioritization fetch failed:", err);
      checkAiStatus();
      setGeneralAdvice("Focus purely on your single most anxiety-inducing item first. Completing it unlocks flow for the rest.");
    } finally {
      setIsPrioritizing(false);
    }
  };

  const handleAddTask = (newTaskData: Omit<Task, "id" | "subtasks" | "status"> & { subtasks: string[] }) => {
    const subtasks: any[] = newTaskData.subtasks.map((title, i) => ({
      id: `sub-${Date.now()}-${i}`,
      title,
      completed: false
    }));

    const finalTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}`,
      status: "pending",
      subtasks
    };

    setTasks(prev => [finalTask, ...prev]);
    // Refresh nudge
    setTimeout(() => fetchNudge(), 1000);
  };

  const handleUpdateTask = (updated: Task) => {
    setTasks(prev => prev.map(t => {
      if (t.id === updated.id) {
        const withDate = { ...updated };
        if (updated.status === "completed" && t.status !== "completed") {
          withDate.completedAt = new Date().toISOString();
        } else if (updated.status !== "completed") {
          delete withDate.completedAt;
        }
        return withDate;
      }
      return t;
    }));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleApplyBreakdown = (taskId: string, subtasks: { title: string; completed: boolean }[], focusTips: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        // Format subtasks with unique IDs
        const formatted = subtasks.map((s, idx) => ({
          id: `sub-applied-${Date.now()}-${idx}`,
          title: s.title,
          completed: s.completed,
          estimatedMinutes: 15
        }));
        return {
          ...t,
          subtasks: [...t.subtasks, ...formatted],
          focusTips,
          isCustomBreakdown: true
        };
      }
      return t;
    }));
    setActiveTab("board");
  };

  // Chat message submission
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: chatInput,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          tasks,
          habits
        })
      });

      if (!res.ok) throw new Error("Chat failed");
      const data = await res.json();

      const aiMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: "ai",
        text: data.text,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, aiMsg]);
      if (autoReadout) {
        speakCoachingText(data.text);
      }
    } catch (err) {
      console.warn("Coach chat fetch failed:", err);
      checkAiStatus();
      setMessages(prev => [...prev, {
        id: `msg-${Date.now() + 1}`,
        sender: "ai",
        text: "I'm experiencing an offline block but I'm still fully in your corner! Pick your highest priority task and commit to just 5 minutes.",
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // TTS Spoken Voice support
  const speakCoachingText = async (text: string) => {
    if (isSpeaking) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    setTtsErrorMessage("");
    setIsSpeaking(true);

    try {
      const response = await fetch("/api/gemini/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "Kore" }),
      });

      if (!response.ok) {
        throw new Error("Voice service error.");
      }

      const data = await response.json();
      if (data.audio) {
        const audioUrl = `data:audio/mp3;base64,${data.audio}`;
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
        } else {
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          audio.play();
          audio.onended = () => setIsSpeaking(false);
        }
      } else {
        throw new Error("No audio payload found.");
      }
    } catch (err: any) {
      console.warn("Gemini TTS service failed, falling back to browser SpeechSynthesis", err);
      if ("speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);
          const voices = window.speechSynthesis.getVoices();
          const friendlyVoice = voices.find(v => v.lang.startsWith("en-")) || voices[0];
          if (friendlyVoice) {
            utterance.voice = friendlyVoice;
          }
          window.speechSynthesis.speak(utterance);
        } catch (speechErr) {
          console.warn("Native SpeechSynthesis failed:", speechErr);
          setTtsErrorMessage("Voice synthesis currently unavailable.");
          setIsSpeaking(false);
        }
      } else {
        setTtsErrorMessage("Spoken system failed to generate.");
        setIsSpeaking(false);
      }
    }
  };

  // Habit toggling
  const handleToggleHabit = (id: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const nextCompleted = !h.completedToday;
        return {
          ...h,
          completedToday: nextCompleted,
          streak: nextCompleted ? h.streak + 1 : Math.max(0, h.streak - 1),
          lastCompleted: nextCompleted ? new Date().toISOString().split("T")[0] : h.lastCompleted
        };
      }
      return h;
    }));
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    const habitTitleInput = (e.target as any).elements.habitTitle;
    const title = habitTitleInput.value.trim();
    if (!title) return;

    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      title,
      streak: 0,
      completedToday: false,
      category: "Personal"
    };

    setHabits(prev => [...prev, newHabit]);
    habitTitleInput.value = "";
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  return (
    <div className="min-h-full bg-[#0A0A0A] text-white flex flex-col relative select-none">
      {/* Brutalist Aesthetic Grid Guides in Background */}
      <div className="absolute inset-0 pointer-events-none grid grid-cols-4 border-b border-white/5 h-full opacity-30">
        <div className="border-r border-white/5 h-full"></div>
        <div className="border-r border-white/5 h-full"></div>
        <div className="border-r border-white/5 h-full"></div>
        <div></div>
      </div>

      {/* Top Banner & Metadata Info */}
      <header className="relative z-10 border-b border-white/10 px-6 py-8 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#0E0E0E]">
        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#FF4D00] font-bold">
            DESIGN PRACTICE / PROACTIVE EMERGENCY ENGINE
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase font-syne leading-none">
            LAST-MINUTE <span className="text-stroke-white text-transparent">LIFE SAVER</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xl font-sans tracking-wide">
            AN EMOTION-AWARE AI PRODUCTIVITY COMPANION DESTROYING THE ANXIETY BLOCK THROUGH BRUTALIST ALIGNMENT, AUTONOMOUS MICRO-BREAKDOWNS, AND LIVE VOCAL SAVIOR DIRECTIVES.
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full md:w-auto md:min-w-[340px]">
          {/* Auth Button */}
          {user ? (
            <div className="flex items-center justify-between bg-[#121212] border border-white/10 p-3 rounded-xl shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FF4D00]/20 flex items-center justify-center border border-[#FF4D00]/50">
                  <span className="text-xs font-bold text-[#FF4D00]">{user.displayName?.charAt(0) || user.email?.charAt(0)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold font-mono text-white">{user.displayName}</span>
                  <span className="text-[9px] font-mono text-slate-400">{user.email}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 bg-rose-900/20 text-rose-400 hover:bg-rose-900/40 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-2 bg-[#FF4D00] text-black hover:bg-orange-600 font-mono text-xs font-black px-4 py-3 rounded-xl cursor-pointer transition-all uppercase"
            >
              {isLoggingIn ? "Authenticating..." : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In with Google
                </>
              )}
            </button>
          )}

          {/* Dynamic Urgent Stress Indicator Clock */}
          <div className="flex flex-col bg-white/5 p-4 rounded-xl border border-white/10 w-full" id="utc_emergency_monitor_widget">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FF4D00]">
                <Clock className="w-4 h-4 animate-spin-slow" />
                <span>GLOBAL ALIGNMENT ENGINE</span>
              </div>
              <button
                onClick={() => setShowGlobalTime(!showGlobalTime)}
                className="text-[9px] font-mono bg-white/5 hover:bg-white/10 text-slate-400 px-2 py-0.5 rounded uppercase cursor-pointer border border-white/5"
              >
                {showGlobalTime ? "Hide World Clocks" : "Show World Clocks"}
              </button>
            </div>

          {/* Grid of Timezones */}
          <div className="grid grid-cols-2 gap-2 text-left">
            {/* India Zone */}
            <div className="p-2 bg-black/40 border border-[#FF4D00]/20 rounded-lg flex flex-col col-span-2 sm:col-span-1">
              <span className="text-[9px] font-mono text-sky-400 font-black uppercase">INDIA (IST)</span>
              <span className="text-sm font-bold font-mono text-white mt-0.5">
                {systemTime.toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
              </span>
            </div>

            {/* UTC Zone */}
            <div className="p-2 bg-black/40 border border-white/5 rounded-lg flex flex-col col-span-2 sm:col-span-1">
              <span className="text-[9px] font-mono text-[#FF4D00] font-black uppercase">GLOBAL UTC</span>
              <span className="text-sm font-bold font-mono text-white mt-0.5">
                {systemTime.toISOString().substring(11, 19)} Z
              </span>
            </div>

            {showGlobalTime && (
              <>
                {/* London Zone */}
                <div className="p-2 bg-black/40 border border-white/5 rounded-lg flex flex-col">
                  <span className="text-[9px] font-mono text-emerald-400 font-black uppercase">LONDON (BST)</span>
                  <span className="text-xs font-bold font-mono text-slate-300 mt-0.5">
                    {systemTime.toLocaleTimeString("en-US", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                  </span>
                </div>

                {/* Tokyo Zone */}
                <div className="p-2 bg-black/40 border border-white/5 rounded-lg flex flex-col">
                  <span className="text-[9px] font-mono text-pink-400 font-black uppercase">TOKYO (JST)</span>
                  <span className="text-xs font-bold font-mono text-slate-300 mt-0.5">
                    {systemTime.toLocaleTimeString("en-US", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                  </span>
                </div>

                {/* California Zone */}
                <div className="p-2 bg-black/40 border border-white/5 rounded-lg flex flex-col col-span-2">
                  <span className="text-[9px] font-mono text-amber-400 font-black uppercase">PACIFIC (PDT)</span>
                  <span className="text-xs font-bold font-mono text-slate-300 mt-0.5">
                    {systemTime.toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="mt-2 text-center border-t border-white/5 pt-2 flex items-center justify-between text-[9px] text-slate-400 font-mono uppercase">
            <span>🚨 {tasks.filter(t => t.priority === "critical" && t.status !== "completed").length} CRITICAL BLOCKS DETECTED</span>
            <span className="text-[8px] px-1 bg-white/5 text-emerald-400 rounded">LIVE</span>
          </div>
          </div>
        </div>
      </header>

      {/* Proactive AI Coach Nudge - Hero Callout */}
      {nudge && (
        <section className="relative z-10 px-6 py-6 md:px-12 bg-[#0F0F0F] border-b border-white/10">
          <div className={`border-l-4 ${
            nudge.urgencyColor === "red" ? "border-[#FF4D00]" : "border-amber-400"
          } pl-5 py-2 space-y-3`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-[#FF4D00] text-black px-2 py-0.5 rounded uppercase">
                  SAVIOR BROADCAST: {nudge.title}
                </span>
                <span className="text-xs text-slate-400 italic">"{nudge.motivationalQuote}"</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => speakCoachingText(`${nudge.title}. ${nudge.message}. Immediate step to take: ${nudge.actionableStep}`)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#FF4D00] text-black hover:bg-orange-600 active:scale-[0.98] text-[11px] font-mono font-bold rounded uppercase cursor-pointer transition-all"
                  id="tts_speak_btn"
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  {isSpeaking ? "Pause Briefing" : "Listen Spoken Schedule"}
                </button>
                <button
                  onClick={fetchNudge}
                  className="p-1.5 bg-white/5 border border-white/10 rounded text-slate-400 hover:text-white cursor-pointer"
                  title="Recalculate Stress Nudge"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-xs md:text-sm text-slate-200 leading-relaxed max-w-4xl">
              {nudge.message}
            </p>

            <div className="bg-white/5 p-3 rounded border border-white/10 flex items-center gap-3 max-w-3xl">
              <span className="text-xs font-mono font-bold text-[#FF4D00] uppercase shrink-0">IMMEDIATE SPRINT STEP:</span>
              <p className="text-xs text-[#FF4D00] font-sans font-semibold">
                {nudge.actionableStep}
              </p>
            </div>
            {ttsErrorMessage && (
              <p className="text-[10px] text-rose-500 font-mono mt-1">{ttsErrorMessage}</p>
            )}
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col md:flex-row">
        {/* Navigation Sidebar */}
        <nav className="hidden md:block w-64 border-r border-white/10 bg-[#0A0A0A] shrink-0">
          <div className="p-6 space-y-1">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4 font-mono">
              SYSTEM CHANNELS
            </div>

            <button
              onClick={() => setActiveTab("board")}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-mono text-xs uppercase cursor-pointer ${
                activeTab === "board" 
                  ? "bg-[#FF4D00] text-black font-bold" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
              id="tab_board_btn"
            >
              <span>01 / Operations Board</span>
              <span className="text-[10px] font-bold font-sans bg-black/10 px-1.5 py-0.5 rounded">
                {tasks.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("planner")}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-mono text-xs uppercase cursor-pointer ${
                activeTab === "planner" 
                  ? "bg-[#FF4D00] text-black font-bold" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
              id="tab_planner_btn"
            >
              <span>02 / Deconstruct Sprint</span>
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            </button>

            <button
              onClick={() => setActiveTab("calendar")}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-mono text-xs uppercase cursor-pointer ${
                activeTab === "calendar" 
                  ? "bg-[#FF4D00] text-black font-bold" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
              id="tab_calendar_btn"
            >
              <span>03 / Weekly Calendar</span>
              <Calendar className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setActiveTab("habits")}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-mono text-xs uppercase cursor-pointer ${
                activeTab === "habits" 
                  ? "bg-[#FF4D00] text-black font-bold" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
              id="tab_habits_btn"
            >
              <span>04 / Habit Lifelines</span>
              <span className="text-[10px] font-bold font-sans bg-black/10 px-1.5 py-0.5 rounded">
                {habits.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("chat")}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-mono text-xs uppercase cursor-pointer ${
                activeTab === "chat" 
                  ? "bg-[#FF4D00] text-black font-bold" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
              id="tab_chat_btn"
            >
              <span>05 / Chat Companion</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          </div>

          <div className="p-6 border-t border-white/10 space-y-3 bg-white/[0.02]">
            <h4 className="text-[10px] uppercase tracking-widest text-[#FF4D00] font-bold font-mono">WORKSPACES</h4>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {workspaces.map(ws => {
                const isActive = ws.id === currentWorkspaceId;
                return (
                  <button
                    key={ws.id}
                    onClick={() => handleSwitchWorkspace(ws.id)}
                    className={`w-full flex items-center justify-between p-2 rounded text-[10px] font-mono uppercase cursor-pointer transition-all text-left ${
                      isActive 
                        ? "bg-[#FF4D00]/15 hover:bg-[#FF4D00]/25 text-[#FF4D00] border border-[#FF4D00]/30" 
                        : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                    }`}
                  >
                    <span className="truncate max-w-[120px] font-bold">{ws.name}</span>
                    <span className="text-[8px] opacity-60 shrink-0 font-sans">({ws.tasks.length}T)</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6 border-t border-white/10 space-y-3">
            <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold font-mono">DAILY SURVIVAL STATS</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 p-3 rounded border border-white/10 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">STREAK</span>
                <span className="text-xl font-black font-syne text-[#FF4D00]">
                  {habits.length > 0 ? habits.reduce((max, h) => Math.max(max, h.streak), 0) : 0}D
                </span>
              </div>
              <div className="bg-white/5 p-3 rounded border border-white/10 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">DONE</span>
                <span className="text-xl font-black font-syne text-white">
                  {tasks.filter(t => t.status === "completed").length}
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* Dynamic Workspace Container */}
        <section className="flex-1 p-6 md:p-8 overflow-y-auto max-w-5xl space-y-8">
          
          {/* AI Status Warning Banner */}
          {aiStatus?.quotaExceeded && (
            <div className="bg-[#FF4D00]/5 border-2 border-[#FF4D00] rounded-2xl p-4 md:p-5 flex items-start gap-3.5 shadow-lg" id="ai_quota_warning_banner">
              <ShieldAlert className="w-5 h-5 text-[#FF4D00] shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1 text-left">
                <h3 className="text-xs font-mono font-black text-[#FF4D00] tracking-wider uppercase">
                  GEMINI FREE TIER QUOTA EXCEEDED (429)
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  The shared developer API key has reached its daily rate limits. 
                  To restore full real-time AI generation (and voice coaching readouts), configure your own personal <strong className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">GEMINI_API_KEY</strong> in the <strong className="text-white">AI Studio Settings menu</strong> (top-right of screen).
                </p>
                <div className="pt-1">
                  <span className="text-[9px] font-mono bg-[#FF4D00]/20 border border-[#FF4D00]/30 px-2 py-0.5 rounded text-white inline-block">
                    ACTIVE FALLBACKS: COMPREHENSIVE LOCAL PRODUCTIVITY ENGINES ENGAGED
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Workspace Quick-Configurator & Profiles */}
          <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-5 md:p-6 space-y-5 shadow-xl" id="workspace_profile_selector_panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3.5">
              <div className="space-y-0.5">
                <h2 className="text-xs font-mono font-bold text-[#FF4D00] uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 animate-pulse" />
                  WORKSPACE ENVIRONMENT CONTROL PANEL
                </h2>
                <p className="text-[11px] text-slate-400 font-sans">
                  Manage independent workspaces, switch focus modes, wipe active data, or create custom productivity cockpits.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono px-2 py-0.5 bg-white/5 border border-white/10 text-[#FF4D00] rounded uppercase shrink-0">
                  Active: {workspaces.find(ws => ws.id === currentWorkspaceId)?.name || "DEFAULT"}
                </span>
              </div>
            </div>

            {/* Quick Create & Switch Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Workspace Selection & Switching List */}
              <div className="lg:col-span-7 space-y-3">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  Switch Active Cockpit ({workspaces.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
                  {workspaces.map(ws => {
                    const isActive = ws.id === currentWorkspaceId;
                    return (
                      <div 
                        key={ws.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isActive 
                            ? "bg-[#FF4D00]/10 border-[#FF4D00] shadow-[#FF4D00]/5" 
                            : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]"
                        }`}
                      >
                        <button
                          onClick={() => handleSwitchWorkspace(ws.id)}
                          className="flex-1 text-left cursor-pointer group"
                        >
                          <span className={`text-xs font-mono font-bold block transition-colors ${isActive ? "text-white" : "text-slate-300 group-hover:text-white"}`}>
                            {ws.name}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono uppercase">
                            {ws.tasks.length} tasks · {ws.habits.length} habits
                          </span>
                        </button>
                        
                        {/* Only allow deleting if there are multiple workspaces */}
                        {workspaces.length > 1 && (
                          <button
                            onClick={() => handleDeleteWorkspace(ws.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-all cursor-pointer"
                            title="Delete Workspace"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Create New Workspace & Action Area */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4 border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-5">
                {/* Custom Creation Form */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Create Custom Workspace
                  </span>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const input = form.elements.namedItem("wsName") as HTMLInputElement;
                      const name = input.value.trim();
                      if (name) {
                        handleCreateWorkspace(name);
                        input.value = "";
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input 
                      type="text" 
                      name="wsName"
                      placeholder="e.g. Exam Prep, Work Routines"
                      required
                      className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D00] font-mono transition-colors"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-[#FF4D00] text-black hover:bg-orange-600 font-mono text-xs font-black rounded-xl cursor-pointer transition-all uppercase shrink-0 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create
                    </button>
                  </form>
                </div>

                {user && (
                  <div className="bg-[#121212] border border-white/10 rounded-xl p-3 flex flex-col gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono font-bold text-sky-400 uppercase tracking-wider block flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        Google Workspace Sync
                      </span>
                      <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                        Import tasks, calendar events, and docs directly into your active workspace.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSyncGoogleWorkspace}
                        className="flex-1 px-3 py-2 bg-[#FF4D00]/10 border border-[#FF4D00]/30 hover:bg-[#FF4D00]/20 text-[#FF4D00] font-mono text-[10px] font-black rounded-xl uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Sync Data
                      </button>
                    </div>
                  </div>
                )}

                {/* Clear Active Workspace Quick Button */}
                <div className="bg-rose-950/10 border border-rose-950/20 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-wider block">
                      Danger Zone
                    </span>
                    <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                      Wipe all tasks, habits, daily goals, and chats in active workspace.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to completely clear the active workspace? This cannot be undone.")) {
                        handleClearWorkspace();
                      }
                    }}
                    className="px-3 py-2 bg-rose-900/15 border border-rose-900/30 hover:bg-rose-900/25 text-rose-400 font-mono text-[10px] font-black rounded-xl uppercase transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    title="Clear Active Workspace"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear Active
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Navigation Top Switcher Bar */}
          <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md pb-4 pt-2 -mx-6 px-6 border-b border-white/5 md:hidden" id="workspace_top_navigation_bar">
            <div className="flex items-center gap-1 bg-[#121212] p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setActiveTab("board")}
                className={`flex-1 text-center py-2 px-1.5 rounded-lg font-mono text-[9px] uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "board" ? "bg-[#FF4D00] text-black font-black" : "text-slate-400 hover:text-white"
                }`}
              >
                Board ({tasks.length})
              </button>
              <button
                onClick={() => setActiveTab("planner")}
                className={`flex-1 text-center py-2 px-1.5 rounded-lg font-mono text-[9px] uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "planner" ? "bg-[#FF4D00] text-black font-black" : "text-slate-400 hover:text-white"
                }`}
              >
                Sprint
              </button>
              <button
                onClick={() => setActiveTab("calendar")}
                className={`flex-1 text-center py-2 px-1.5 rounded-lg font-mono text-[9px] uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "calendar" ? "bg-[#FF4D00] text-black font-black" : "text-slate-400 hover:text-white"
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setActiveTab("habits")}
                className={`flex-1 text-center py-2 px-1.5 rounded-lg font-mono text-[9px] uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "habits" ? "bg-[#FF4D00] text-black font-black" : "text-slate-400 hover:text-white"
                }`}
              >
                Habits ({habits.length})
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 text-center py-2 px-1.5 rounded-lg font-mono text-[9px] uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "chat" ? "bg-[#FF4D00] text-black font-black" : "text-slate-400 hover:text-white"
                }`}
              >
                Coach
              </button>
            </div>
          </div>

          {activeTab === "board" && (
            <div className="space-y-6">
              {/* Context-Aware Reminders center at top of Operations */}
              <RemindersAlertCenter
                tasks={tasks}
                habits={habits}
                onUpdateTask={handleUpdateTask}
                onToggleHabit={handleToggleHabit}
                onNavigateToTab={setActiveTab}
              />
              <TaskBoard
                tasks={tasks}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onRunPrioritization={handleRunPrioritization}
                priorityRecommendations={priorityRecommendations}
                generalAdvice={generalAdvice}
                isPrioritizing={isPrioritizing}
              />
            </div>
          )}

          {activeTab === "planner" && (
            <AutonomousPlanner
              tasks={tasks}
              onApplyBreakdown={handleApplyBreakdown}
              speakCoachingText={speakCoachingText}
              isSpeaking={isSpeaking}
            />
          )}

          {activeTab === "calendar" && (
            <CalendarView 
              tasks={tasks} 
              onUpdateTask={handleUpdateTask} 
            />
          )}

          {activeTab === "habits" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Goals Tracking */}
              <div className="bg-[#0F0F0F] border border-white/10 p-6 rounded-2xl space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white tracking-tight font-syne uppercase flex items-center gap-2">
                    <Target className="text-[#FF4D00] w-4.5 h-4.5" />
                    DAILY SURVIVAL GOALS
                  </h3>
                  <p className="text-xs text-slate-400">
                    High-level focus milestones for today. Complete these to safeguard your evening mental buffer.
                  </p>
                </div>

                <form onSubmit={handleAddGoal} className="flex gap-2">
                  <input
                    type="text"
                    name="goalTitle"
                    placeholder="Create an action-oriented daily goal..."
                    className="flex-1 text-xs px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF4D00]"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#FF4D00] text-black hover:bg-orange-600 font-bold text-xs rounded-lg uppercase cursor-pointer transition-all shrink-0 font-mono"
                  >
                    ADD GOAL
                  </button>
                </form>

                <div className="space-y-2.5 pt-2">
                  {dailyGoals.length === 0 ? (
                    <p className="text-xs text-slate-500 italic font-sans py-4 text-center">No daily goals tracked today. Set one above!</p>
                  ) : (
                    dailyGoals.map(goal => (
                      <div 
                        key={goal.id} 
                        className={`flex items-center justify-between p-3.5 bg-[#0A0A0A] rounded-xl border transition-colors ${
                          goal.completed ? "border-[#FF4D00]/30 opacity-60" : "border-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleGoal(goal.id)}
                            className="text-[#FF4D00] transition-transform active:scale-90 cursor-pointer"
                          >
                            {goal.completed ? (
                              <CheckCircle2 className="w-5 h-5 fill-[#FF4D00] text-black" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-500 hover:text-[#FF4D00]" />
                            )}
                          </button>
                          <p className={`text-xs font-mono uppercase ${goal.completed ? "line-through text-slate-500" : "text-white"}`}>
                            {goal.title}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-500 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Habit Lifelines */}
              <div className="bg-[#0F0F0F] border border-white/10 p-6 rounded-2xl space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white tracking-tight font-syne uppercase flex items-center gap-2">
                    <Flame className="text-[#FF4D00] w-4.5 h-4.5" />
                    HABIT LIFELINES
                  </h3>
                  <p className="text-xs text-slate-400">
                    Build unbreakable momentum. Complete simple tasks that release dopamine and clear brain fog. If you skip, the AI recalibrates.
                  </p>
                </div>

                <form onSubmit={handleAddHabit} className="flex gap-2">
                  <input
                    type="text"
                    name="habitTitle"
                    placeholder="Create a simple, foolproof daily commitment..."
                    className="flex-1 text-xs px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF4D00]"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#FF4D00] text-black hover:bg-orange-600 font-bold text-xs rounded-lg uppercase cursor-pointer transition-all shrink-0 font-mono"
                  >
                    Track Habit
                  </button>
                </form>

                <div className="space-y-3 pt-2">
                  {habits.map(habit => (
                    <div 
                      key={habit.id} 
                      className={`flex items-center justify-between p-4 bg-[#0A0A0A] rounded-xl border transition-colors ${
                        habit.completedToday ? "border-[#FF4D00]/50" : "border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleHabit(habit.id)}
                          className="text-[#FF4D00] transition-transform active:scale-90 cursor-pointer"
                        >
                          {habit.completedToday ? (
                            <CheckCircle2 className="w-5 h-5 fill-[#FF4D00] text-black" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-500 hover:text-[#FF4D00]" />
                          )}
                        </button>
                        <div>
                          <p className={`text-xs font-bold ${habit.completedToday ? "line-through text-slate-500" : "text-white"}`}>
                            {habit.title}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono uppercase bg-white/5 px-2 py-0.5 rounded">
                            {habit.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-1 rounded text-xs font-mono font-bold">
                          <Flame className="w-3.5 h-3.5 animate-pulse" />
                          <span>{habit.streak} DAY STREAK</span>
                        </div>
                        <button
                          onClick={() => handleDeleteHabit(habit.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-500 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "chat" && (
            <div className="space-y-4 bg-[#0F0F0F] border border-white/10 rounded-2xl p-6 flex flex-col h-[550px]">
              <div className="border-b border-white/10 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h3 className="text-sm font-bold uppercase font-mono text-white flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${aiStatus?.quotaExceeded ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-ping"}`} />
                    Saver Bot Consultation
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {aiStatus?.quotaExceeded 
                      ? "Operating with high-speed local cognitive fallbacks due to Gemini API rate-limits."
                      : "Ask Saver Bot how to tackle high stress levels, make quick compromises, or clear executive paralysis."}
                  </p>
                </div>

                {/* Auto Readout speech toggle */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-xl">
                  <label htmlFor="auto_readout_checkbox" className="text-[10px] font-mono font-bold text-slate-400 uppercase select-none cursor-pointer">
                    SPEECH READOUT
                  </label>
                  <input
                    id="auto_readout_checkbox"
                    type="checkbox"
                    checked={autoReadout}
                    onChange={e => setAutoReadout(e.target.checked)}
                    className="w-3.5 h-3.5 accent-[#FF4D00] cursor-pointer"
                  />
                </div>
              </div>

              {aiStatus?.quotaExceeded && (
                <div className="bg-[#FF4D00]/5 border border-[#FF4D00]/30 rounded-xl p-3 text-[10px] text-slate-300 font-mono flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-[#FF4D00] shrink-0" />
                  <span>
                    <strong>QUOTA EXCEEDED FALLBACK ACTIVE:</strong> Saver Bot is operating on advanced local empathetic patterns. To re-enable live Gemini replies and high-fidelity TTS voice, configure your key in Settings.
                  </span>
                </div>
              )}

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 font-sans py-2">
                {messages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-[85%] ${
                      msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === "user" 
                        ? "bg-[#FF4D00] text-black font-semibold rounded-tr-none" 
                        : "bg-white/5 border border-white/10 text-slate-200 rounded-tl-none"
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-mono pl-1">
                    <span className="w-1.5 h-1.5 bg-[#FF4D00] rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-[#FF4D00] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-[#FF4D00] rounded-full animate-bounce [animation-delay:0.4s]" />
                    <span>Analyzing anxiety parameters...</span>
                  </div>
                )}
              </div>

              {/* Send controls */}
              <form onSubmit={handleSendChat} className="flex gap-2 border-t border-white/10 pt-4">
                {/* Voice assistant input microphone trigger */}
                <button
                  type="button"
                  onClick={handleStartVoiceInput}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isListening 
                      ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse" 
                      : "bg-[#0A0A0A] border-white/10 text-slate-400 hover:text-[#FF4D00] hover:border-[#FF4D00]"
                  }`}
                  title="Speak message using voice"
                  id="mic_trigger_btn"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder={isListening ? "Listening to your voice..." : "Tell Saver Bot what's blocking you..."}
                  className="flex-1 text-xs px-3 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-xl focus:outline-none focus:border-[#FF4D00] text-white"
                  id="chat_message_input"
                  disabled={isListening}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading || isListening}
                  className="p-2.5 bg-[#FF4D00] text-black hover:bg-orange-600 disabled:opacity-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  id="send_chat_btn"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </section>
      </main>

      {/* Brutalist Aesthetic Footer */}
      <footer className="border-t border-white/10 p-8 text-center text-[10px] text-slate-500 font-mono bg-[#0A0A0A]">
        THE LAST-MINUTE LIFE SAVER &copy; 2026. DRIVEN BY GOOGLE GEMINI 3.5 FLASH MODELS. ALL SHIELD RESISTANCES STAND AT MAXIMUM EFFICIENCY.
      </footer>
    </div>
  );
}
