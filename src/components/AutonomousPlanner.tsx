import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Check, AlertCircle, Layers, Play, Pause, RotateCcw, 
  Radio, Shield, Volume2, VolumeX, Eye, Flame
} from "lucide-react";
import { Task } from "../types";

interface AutonomousPlannerProps {
  tasks: Task[];
  onApplyBreakdown: (taskId: string, subtasks: { title: string; completed: boolean }[], focusTips: string) => void;
  speakCoachingText: (text: string) => Promise<void>;
  isSpeaking: boolean;
}

export default function AutonomousPlanner({ 
  tasks, 
  onApplyBreakdown,
  speakCoachingText,
  isSpeaking
}: AutonomousPlannerProps) {
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [customTaskTitle, setCustomTaskTitle] = useState("");
  const [customTaskDesc, setCustomTaskDesc] = useState("");
  const [timeAvailable, setTimeAvailable] = useState(60);
  const [isLoading, setIsLoading] = useState(false);

  // Focus Station state
  const [timerDuration, setTimerDuration] = useState(25); // in minutes
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [isVocalGuidanceEnabled, setIsVocalGuidanceEnabled] = useState(true);

  // Autonomous system simulation logs
  const [autonomousLogs, setAutonomousLogs] = useState<string[]>([
    "[SYSTEM INITIALIZED] Autonomous monitoring online. Waiting for active focus session...",
    "[ENVIRONMENT CONFIG] Standard ambient acoustics detected. Noise floor is nominal."
  ]);

  // Ref for the countdown timer interval
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Gemini breakdown result
  const [breakdownResult, setBreakdownResult] = useState<{
    subtasks: { title: string; estimatedMinutes: number }[];
    focusTips: string;
  } | null>(null);

  // Handle timer countdown
  useEffect(() => {
    if (timerActive) {
      timerIntervalRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            // Timer finished
            setTimerActive(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            triggerAutonomousAlert("Sprint completed! Phenomenal discipline. Take a 5-minute pause protocol.");
            return 0;
          }

          // Emit periodic simulation logs
          if (prev === 24 * 60 || prev === 20 * 60 || prev === 15 * 60 || prev === 10 * 60 || prev === 5 * 60) {
            const min = Math.round(prev / 60);
            appendAutoLog(`[PROTO MONITOR] ${min} minutes remaining. Brainwave focus alignment stands at 94%. Keep the perfectionist dread silenced.`);
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerActive]);

  const handleStartTimer = () => {
    if (!timerActive) {
      setTimerActive(true);
      appendAutoLog("[AUTONOMOUS EXECUTION] Sprint timer activated. Monitoring eye strain and cognitive fatigue.");
      if (isVocalGuidanceEnabled) {
        speakCoachingText("Autonomous focus protocol locked. Clear all desktop clutter, mute your notifications, and commit to just 5 minutes of focused momentum. You can do this.");
      }
    } else {
      setTimerActive(false);
      appendAutoLog("[AUTONOMOUS EXECUTION] Sprint paused. Flow state temporarily suspended.");
    }
  };

  const handleResetTimer = () => {
    setTimerActive(false);
    setSecondsRemaining(timerDuration * 60);
    appendAutoLog(`[AUTONOMOUS EXECUTION] Focus interval reset to ${timerDuration} minutes.`);
  };

  const handleDurationChange = (mins: number) => {
    setTimerDuration(mins);
    setSecondsRemaining(mins * 60);
    setTimerActive(false);
    appendAutoLog(`[AUTONOMOUS EXECUTION] Sprint boundary set to ${mins} minutes.`);
  };

  const triggerAutonomousAlert = (message: string) => {
    appendAutoLog(`[ALERT RECON] ${message.toUpperCase()}`);
    if (isVocalGuidanceEnabled) {
      speakCoachingText(message);
    }
  };

  const appendAutoLog = (log: string) => {
    const time = new Date().toLocaleTimeString();
    setAutonomousLogs(prev => [`[${time}] ${log}`, ...prev.slice(0, 19)]);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    let titleToQuery = customTaskTitle;
    let descToQuery = customTaskDesc;

    if (selectedTaskId) {
      const matched = tasks.find(t => t.id === selectedTaskId);
      if (matched) {
        titleToQuery = matched.title;
        descToQuery = matched.description;
      }
    }

    if (!titleToQuery.trim()) return;

    setIsLoading(true);
    setBreakdownResult(null);
    appendAutoLog(`[GEMINI REQUEST] Generating pain-free timeline for "${titleToQuery.toUpperCase()}"...`);

    try {
      const res = await fetch("/api/gemini/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: titleToQuery,
          taskDescription: descToQuery,
          timeAvailableMinutes: timeAvailable
        })
      });

      if (!res.ok) throw new Error("Breakdown generation failed");
      const data = await res.json();
      setBreakdownResult(data);
      appendAutoLog(`[GEMINI COMPLETE] Deconstructed into ${data.subtasks?.length || 4} milestones successfully.`);
      
      if (isVocalGuidanceEnabled && data.focusTips) {
        speakCoachingText(`I have parsed your stress parameters and deconstructed the task. My recommendation is: ${data.focusTips}`);
      }
    } catch (err) {
      console.warn("Autonomous planner deconstruct failed:", err);
      // Fallback result
      const fallbackResult = {
        subtasks: [
          { title: `Initialize basic outline or outline workspace for ${titleToQuery}`, estimatedMinutes: Math.round(timeAvailable * 0.15) },
          { title: "Draft draft content. Force yourself to write poorly and ignore accuracy — build speed", estimatedMinutes: Math.round(timeAvailable * 0.45) },
          { title: "Check mechanism logic or factual parameters. Resolve formatting inaccuracies", estimatedMinutes: Math.round(timeAvailable * 0.3) },
          { title: "Review with final checklist and export/save final sprint document", estimatedMinutes: Math.round(timeAvailable * 0.1) }
        ],
        focusTips: "Procrastination is often just anxiety disguised as perfectionism. Commit to only 3 minutes on step 1. You are allowed to stop if you get too frustrated, but start!"
      };
      setBreakdownResult(fallbackResult);
      appendAutoLog("[GEMINI FALLBACK] Deconstructed into standard micro-milestones.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!breakdownResult) return;

    const formattedSubtasks = breakdownResult.subtasks.map(s => ({
      title: s.title,
      completed: false
    }));

    if (selectedTaskId) {
      onApplyBreakdown(selectedTaskId, formattedSubtasks, breakdownResult.focusTips);
      setBreakdownResult(null);
      setSelectedTaskId("");
      setCustomTaskTitle("");
      setCustomTaskDesc("");
      appendAutoLog("[SYSTEM] Successfully injected milestones directly into your Operations Board card.");
    } else {
      alert("Please select or match an existing active Lifeline task from your board to apply this breakdown directly.");
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m} : ${s}`;
  };

  const appropriateTasks = tasks.filter(t => t.status !== "completed");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="autonomous_planner_container">
      
      {/* Left Column: AI Milestone Deconstruct Planner */}
      <div className="bg-[#0F0F0F] rounded-2xl border border-white/10 p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-black font-syne text-white tracking-tight uppercase flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#FF4D00]" />
            AI MILESTONE DECONSTRUCT PLANNER
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Paralyzed by a mammoth task? Let Gemini split it into painless, manageable micro-commitments with tailored focus hacks.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          {/* Task Selection */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              DECONSTRUCT AN ACTIVE LIFELINE
            </label>
            <select
              value={selectedTaskId}
              onChange={e => {
                setSelectedTaskId(e.target.value);
                if (e.target.value) {
                  setCustomTaskTitle("");
                  setCustomTaskDesc("");
                }
              }}
              className="w-full text-xs px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF4D00] cursor-pointer"
              id="planner_task_select"
            >
              <option value="">-- OR DECONSTRUCT A CUSTOM DIRECTIVE --</option>
              {appropriateTasks.map(t => (
                <option key={t.id} value={t.id}>{t.title.toUpperCase()} ({t.category.toUpperCase()})</option>
              ))}
            </select>
          </div>

          {!selectedTaskId && (
            <div className="space-y-3 p-4 bg-[#0A0A0A] rounded-xl border border-white/10">
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  CUSTOM PROJECT TITLE
                </label>
                <input
                  type="text"
                  value={customTaskTitle}
                  onChange={e => setCustomTaskTitle(e.target.value)}
                  placeholder="e.g., Study for Organic Chemistry Midterm"
                  className="w-full text-xs px-3 py-1.5 bg-[#0F0F0F] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF4D00]"
                  id="custom_task_title"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  CONTEXT / STRESS FACTORS
                </label>
                <input
                  type="text"
                  value={customTaskDesc}
                  onChange={e => setCustomTaskDesc(e.target.value)}
                  placeholder="e.g., Massive exam in 2 days. Feeling highly anxious."
                  className="w-full text-xs px-3 py-1.5 bg-[#0F0F0F] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF4D00]"
                  id="custom_task_desc"
                />
              </div>
            </div>
          )}

          {/* Time available slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              <span>AVAILABLE SPRINT TIME BLOCK</span>
              <span className="text-[#FF4D00] font-mono font-bold bg-[#FF4D00]/10 border border-[#FF4D00]/30 px-2 py-0.5 rounded">
                {timeAvailable} MINUTES
              </span>
            </div>
            <input
              type="range"
              min={15}
              max={240}
              step={15}
              value={timeAvailable}
              onChange={e => setTimeAvailable(Number(e.target.value))}
              className="w-full accent-[#FF4D00] cursor-ew-resize"
              id="planner_time_range"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>15 MIN SPRINT</span>
              <span>4 HOUR DEEP WORK BLOCK</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || (!selectedTaskId && !customTaskTitle.trim())}
            className="w-full py-2.5 bg-[#FF4D00] hover:bg-orange-600 disabled:opacity-40 text-black font-mono font-bold text-xs uppercase rounded-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            id="generate_breakdown_btn"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isLoading ? "CONSULTING SAVER BOT..." : "DECONSTRUCT WITH GEMINI AI"}
          </button>
        </form>

        {/* Breakdown results */}
        {breakdownResult && (
          <div className="border border-white/10 bg-[#0A0A0A] p-5 rounded-2xl space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h4 className="text-xs font-black font-syne text-white uppercase tracking-tight">RECOMMENDED MICRO-TIMELINE</h4>
                <p className="text-[9px] text-slate-500 mt-0.5 font-mono uppercase">DECOMPOSED INTO {breakdownResult.subtasks.length} INTERVALS</p>
              </div>
              <span className="text-[10px] font-mono bg-[#FF4D00] text-black px-2 py-0.5 rounded font-bold uppercase">
                {breakdownResult.subtasks.reduce((sum, s) => sum + s.estimatedMinutes, 0)} MIN SPRINT
              </span>
            </div>

            <div className="space-y-2.5">
              {breakdownResult.subtasks.map((sub, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-[#0F0F0F] p-2.5 rounded-xl border border-white/10">
                  <span className="w-5 h-5 rounded-full bg-[#FF4D00]/10 border border-[#FF4D00]/30 text-[9px] font-mono font-bold flex items-center justify-center text-[#FF4D00] shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-slate-200 flex-1 leading-relaxed font-sans">{sub.title}</p>
                  <span className="text-[9px] font-mono text-slate-400 shrink-0">⏱️ {sub.estimatedMinutes}M</span>
                </div>
              ))}
            </div>

            <div className="bg-[#0F0F0F] border-l-2 border-[#FF4D00] p-4 rounded-r-xl space-y-1">
              <h5 className="text-[9px] font-mono font-bold text-[#FF4D00] uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                SUSTAINED MOMENTUM BLUEPRINT
              </h5>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "{breakdownResult.focusTips}"
              </p>
            </div>

            {selectedTaskId ? (
              <button
                onClick={handleApply}
                className="w-full py-2 bg-[#FF4D00] text-black hover:bg-orange-600 active:scale-[0.99] font-mono font-bold text-xs uppercase rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                id="apply_breakdown_to_task_btn"
              >
                <Check className="w-3.5 h-3.5" />
                INJECT BLUEPRINT INTO ACTIVE LIFELINE
              </button>
            ) : (
              <div className="p-3 bg-white/5 rounded-lg text-center text-[10px] font-mono uppercase tracking-wider text-slate-400 border border-white/5">
                💡 Convert your custom text above into an active Lifeline Task first to integrate this breakdown timeline perfectly.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column: Autonomous Focus Station & Live Voice Coach */}
      <div className="bg-[#0F0F0F] rounded-2xl border border-white/10 p-6 shadow-sm flex flex-col justify-between space-y-6" id="autonomous_focus_station">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-sm font-black font-syne text-white tracking-tight uppercase flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#FF4D00] animate-pulse" />
                AUTONOMOUS FLOW RUNNER
              </h3>
              <p className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">
                Live behavioral timer monitoring workflow execution
              </p>
            </div>

            {/* Vocal Guidance Toggle */}
            <button
              onClick={() => {
                setIsVocalGuidanceEnabled(!isVocalGuidanceEnabled);
                appendAutoLog(`[SYSTEM] Vocal Guidance ${!isVocalGuidanceEnabled ? "ENABLED" : "DISABLED"}`);
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isVocalGuidanceEnabled 
                  ? "bg-[#FF4D00]/10 border-[#FF4D00] text-[#FF4D00]" 
                  : "bg-[#0A0A0A] border-white/10 text-slate-500"
              }`}
              title={isVocalGuidanceEnabled ? "Disable Vocal Coaching" : "Enable Vocal Coaching"}
              type="button"
            >
              {isVocalGuidanceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* Large Countdown timer */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
            {/* Ambient Background Wave effect */}
            {timerActive && (
              <div className="absolute inset-0 bg-radial-gradient from-[#FF4D00]/5 to-transparent pointer-events-none animate-pulse duration-1000" />
            )}

            <div className="text-5xl md:text-6xl font-black font-mono tracking-tighter text-white">
              {formatTime(secondsRemaining)}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {[15, 25, 45, 60].map(mins => (
                <button
                  key={mins}
                  onClick={() => handleDurationChange(mins)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase border cursor-pointer transition-all ${
                    timerDuration === mins
                      ? "bg-[#FF4D00] border-[#FF4D00] text-black font-bold"
                      : "bg-[#0F0F0F] border-white/10 text-slate-400 hover:text-white"
                  }`}
                  disabled={timerActive}
                >
                  {mins} MINS
                </button>
              ))}
            </div>

            {/* Timer controls */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleStartTimer}
                className="px-6 py-2 bg-white text-black hover:bg-slate-200 active:scale-95 transition-all text-xs font-mono font-bold uppercase rounded-xl flex items-center gap-2 cursor-pointer"
              >
                {timerActive ? (
                  <>
                    <Pause className="w-4 h-4" />
                    PAUSE FLOW
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    ACTIVATE FLOW
                  </>
                )}
              </button>

              <button
                onClick={handleResetTimer}
                className="p-2 bg-white/5 border border-white/10 hover:border-white text-slate-400 hover:text-white active:scale-95 transition-all rounded-xl cursor-pointer"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Real-Time Live Activity Event Ticker */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              AUTONOMOUS ASSISTANT LOGS
            </span>
            <span className="text-[8px] font-mono text-emerald-400 uppercase">ACTIVE</span>
          </div>

          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4 font-mono text-[10px] space-y-1.5 max-h-[140px] overflow-y-auto h-[140px] flex flex-col-reverse divide-y divide-white/5">
            {autonomousLogs.map((log, index) => {
              const isSystem = log.includes("[SYSTEM") || log.includes("[PROTO");
              const isAlert = log.includes("[ALERT") || log.includes("[ALERT");
              const isRequest = log.includes("[GEMINI");
              
              let textColor = "text-slate-400";
              if (isSystem) textColor = "text-sky-400";
              if (isAlert) textColor = "text-[#FF4D00] font-bold";
              if (isRequest) textColor = "text-amber-400";

              return (
                <div key={index} className={`py-1.5 leading-relaxed break-all ${textColor}`}>
                  {log}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-[10px] text-slate-400 leading-relaxed font-sans">
          🔥 <b>SUGGESTION:</b> Sticking with a sprint builds cognitive momentum. Click "Listen Spoken Schedule" or start the timer to begin.
        </div>
      </div>
    </div>
  );
}
