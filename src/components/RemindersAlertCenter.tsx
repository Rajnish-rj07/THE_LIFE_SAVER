import React from "react";
import { 
  AlertTriangle, Clock, Activity, ArrowRight, Flame, Sparkles, 
  Check, Play, ArrowUpRight
} from "lucide-react";
import { Task, Habit } from "../types";

interface RemindersAlertCenterProps {
  tasks: Task[];
  habits: Habit[];
  onUpdateTask: (task: Task) => void;
  onToggleHabit: (id: string) => void;
  onNavigateToTab: (tab: "board" | "planner" | "habits" | "chat") => void;
}

interface AlertReminder {
  id: string;
  type: "overdue" | "approaching" | "habit_stagnant" | "recommendation";
  title: string;
  subtitle: string;
  pills: string[];
  actionLabel: string;
  onAction: () => void;
  color: "red" | "amber" | "blue" | "emerald";
  tip: string;
}

export default function RemindersAlertCenter({
  tasks,
  habits,
  onUpdateTask,
  onToggleHabit,
  onNavigateToTab
}: RemindersAlertCenterProps) {

  // Calculate dynamic context-aware reminders
  const getDynamicAlerts = (): AlertReminder[] => {
    const alerts: AlertReminder[] = [];
    const now = Date.now();

    // 1. Check for OVERDUE tasks
    tasks.forEach(t => {
      if (t.status !== "completed") {
        const deadlineTime = new Date(t.deadline).getTime();
        if (deadlineTime < now) {
          alerts.push({
            id: `overdue-${t.id}`,
            type: "overdue",
            title: `OVERDUE: ${t.title.toUpperCase()}`,
            subtitle: `Slipped past your expected resolution boundary. Block the perfectionist paralysis.`,
            pills: [t.category.toUpperCase(), "OVERDUE"],
            actionLabel: "START OPERATION",
            onAction: () => {
              onUpdateTask({ ...t, status: "in_progress" });
              onNavigateToTab("board");
            },
            color: "red",
            tip: "The hardest part is the first 10 seconds. Write a messy line of content or make the call right now to break the deadlock."
          });
        }
      }
    });

    // 2. Check for APPROACHING tasks (next 6 hours)
    tasks.forEach(t => {
      if (t.status !== "completed") {
        const deadlineTime = new Date(t.deadline).getTime();
        const diffMs = deadlineTime - now;
        const sixHoursMs = 6 * 60 * 60 * 1000;
        
        if (diffMs > 0 && diffMs < sixHoursMs) {
          const hoursLeft = Math.ceil(diffMs / (1000 * 60 * 60));
          alerts.push({
            id: `approaching-${t.id}`,
            type: "approaching",
            title: `APPROACHING DEADLINE: ${t.title.toUpperCase()}`,
            subtitle: `Due in less than ${hoursLeft} hours. Time is a finite resource. Let's act before anxiety spikes.`,
            pills: [t.category.toUpperCase(), `${hoursLeft}H REMAINING`],
            actionLabel: "DECONSTRUCT SPRINT",
            onAction: () => {
              onNavigateToTab("planner");
            },
            color: "amber",
            tip: "Anxiety triggers from big steps. Go to 'Deconstruct Sprint' tab and let Gemini break this task into 4 bite-sized subtasks."
          });
        }
      }
    });

    // 3. Check for stagnant habits
    habits.forEach(h => {
      if (!h.completedToday && h.streak > 0) {
        alerts.push({
          id: `habit-${h.id}`,
          type: "habit_stagnant",
          title: `STREAK RISK: ${h.title.toUpperCase()}`,
          subtitle: `Protect your active ${h.streak}-day momentum streak! Re-energize your brain with a quick action.`,
          pills: [h.category.toUpperCase(), `${h.streak}D STREAK`],
          actionLabel: "RESOLVE HABIT",
          onAction: () => {
            onToggleHabit(h.id);
          },
          color: "blue",
          tip: "Habits are lifelines. Ticking off this micro-stretch or breathing block will trigger a dopamine release to clear current task blockages."
        });
      }
    });

    // 4. Default high-level productivity recommendations
    if (alerts.length === 0) {
      alerts.push({
        id: "rec-flow",
        type: "recommendation",
        title: "ALL BOUNDARIES SECURED",
        subtitle: "Your immediate schedule boundaries are protected. Great work managing executive dread.",
        pills: ["SYSTEM LEVEL: GREEN", "FLOW PROTOCOL ACTIVE"],
        actionLabel: "CHAT BRIEFING",
        onAction: () => onNavigateToTab("chat"),
        color: "emerald",
        tip: "Consider discussing your long-term goals or custom routine blockers with Saver Bot to formulate an optimization protocol."
      });
    }

    return alerts.slice(0, 3); // Return at most top 3 critical reminders
  };

  const activeAlerts = getDynamicAlerts();

  return (
    <div className="space-y-3" id="reminders_alert_center_root">
      <div className="flex items-center gap-2 px-1">
        <Activity className="w-4 h-4 text-[#FF4D00] animate-pulse" />
        <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-slate-400">
          CONTEXT-AWARE REMINDER FEED
        </h4>
        <span className="text-[9px] font-mono font-bold bg-white/5 border border-white/10 text-slate-500 px-1.5 py-0.2 rounded shrink-0">
          {activeAlerts.length} PROTOCOLS
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {activeAlerts.map(alert => {
          const borderStyle = {
            red: "border-red-500 hover:border-red-400 shadow-red-500/5",
            amber: "border-amber-500 hover:border-amber-400 shadow-amber-500/5",
            blue: "border-[#FF4D00] hover:border-orange-400 shadow-orange-500/5",
            emerald: "border-emerald-500 hover:border-emerald-400 shadow-emerald-500/5"
          }[alert.color];

          const glowDot = {
            red: "bg-red-500",
            amber: "bg-amber-500",
            blue: "bg-[#FF4D00]",
            emerald: "bg-emerald-500"
          }[alert.color];

          return (
            <div 
              key={alert.id}
              className={`bg-[#0F0F0F] border rounded-2xl p-4.5 flex flex-col justify-between transition-all duration-200 relative group overflow-hidden ${borderStyle}`}
            >
              <div className="space-y-3">
                {/* Header pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${glowDot} animate-pulse shrink-0`} />
                  {alert.pills.map((p, idx) => (
                    <span key={idx} className="text-[8px] font-mono font-bold text-slate-400 uppercase bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                      {p}
                    </span>
                  ))}
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <h5 className="text-[11px] font-black font-syne uppercase tracking-tight text-white line-clamp-1">
                    {alert.title}
                  </h5>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans line-clamp-2">
                    {alert.subtitle}
                  </p>
                </div>

                {/* AI Momemtum tip */}
                <div className="bg-black/45 p-2.5 rounded-lg border border-white/5 text-[10px] text-slate-300 italic font-sans leading-relaxed flex gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF4D00] shrink-0 mt-0.5" />
                  <span>"{alert.tip}"</span>
                </div>
              </div>

              {/* Action trigger button */}
              <button
                onClick={alert.onAction}
                className="w-full mt-3 py-1.5 bg-white/5 border border-white/10 hover:bg-[#FF4D00] hover:border-[#FF4D00] hover:text-black rounded-lg text-[10px] font-mono font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>{alert.actionLabel}</span>
                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
