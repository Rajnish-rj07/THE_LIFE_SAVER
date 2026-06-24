import React, { useState } from "react";
import { 
  Calendar as CalendarIcon, Download, RefreshCw, Plus, Clock, 
  ChevronLeft, ChevronRight, CheckCircle2, Circle, Check
} from "lucide-react";
import { Task } from "../types";

interface CalendarViewProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
}

export default function CalendarView({ tasks, onUpdateTask }: CalendarViewProps) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [selectedTaskToSchedule, setSelectedTaskToSchedule] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Get start of the current week based on offset
  const getWeekDays = () => {
    const days = [];
    const today = new Date();
    // Start of week (Sunday)
    const sunday = new Date(today.setDate(today.getDate() - today.getDay() + (currentWeekOffset * 7)));
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Tasks due on a specific day
  const getTasksForDay = (day: Date) => {
    const dayString = day.toISOString().split("T")[0];
    return tasks.filter(t => {
      // Check deadline date
      const deadlineDate = t.deadline.split("T")[0];
      return deadlineDate === dayString;
    });
  };

  // Generate real standard iCalendar (.ics) file
  const handleExportICS = (task: Task) => {
    const title = task.title;
    const description = task.description || "No context provided.";
    const deadlineDate = new Date(task.deadline);
    // Start is 1 hour before deadline or estimatedMinutes before
    const durationMin = task.estimatedMinutes || 60;
    const startDate = new Date(deadlineDate.getTime() - durationMin * 60 * 1000);
    
    const formatDateToICS = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Last-Minute Life Saver//Productivity App//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${task.id}@lifesaver.ai`,
      `DTSTAMP:${formatDateToICS(new Date())}`,
      `DTSTART:${formatDateToICS(startDate)}`,
      `DTEND:${formatDateToICS(deadlineDate)}`,
      `SUMMARY:${title.replace(/,/g, "\\,")}`,
      `DESCRIPTION:${description.replace(/,/g, "\\,").replace(/\n/g, "\\n")}`,
      "STATUS:CONFIRMED",
      "SEQUENCE:0",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title.toLowerCase().replace(/\s+/g, "_")}_sprint.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger simulated sync with Google Calendar API
  const handleGoogleCalendarSync = () => {
    setSyncLoading(true);
    setSyncSuccess(false);
    setTimeout(() => {
      setSyncLoading(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 4000);
    }, 1800);
  };

  const activeWeekTasks = tasks.filter(t => {
    const tTime = new Date(t.deadline).getTime();
    const firstDay = weekDays[0].getTime();
    const lastDay = weekDays[6].getTime() + 24 * 60 * 60 * 1000;
    return tTime >= firstDay && tTime <= lastDay;
  });

  const unscheduledTasks = tasks.filter(t => t.status !== "completed");

  const handleDaySlotClick = (day: Date, hour: number) => {
    if (!selectedTaskToSchedule) return;
    
    const matchedTask = tasks.find(t => t.id === selectedTaskToSchedule);
    if (matchedTask) {
      // Set new deadline to this day & hour
      const targetDate = new Date(day);
      targetDate.setHours(hour, 0, 0, 0);
      
      onUpdateTask({
        ...matchedTask,
        deadline: targetDate.toISOString()
      });
      setSelectedTaskToSchedule(null);
    }
  };

  return (
    <div className="bg-[#0F0F0F] rounded-2xl border border-white/10 p-6 shadow-sm space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1">
          <h3 className="text-base font-black font-syne text-white tracking-tight uppercase flex items-center gap-2">
            <CalendarIcon className="text-[#FF4D00] w-4.5 h-4.5" />
            REAL-TIME CALENDAR INTEGRATION
          </h3>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">
            Visualize scheduled operations & export standard standard .ics lifelines
          </p>
        </div>

        {/* Sync Action Button */}
        <button
          onClick={handleGoogleCalendarSync}
          disabled={syncLoading}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all border cursor-pointer ${
            syncSuccess 
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-[#FF4D00] text-black border-[#FF4D00] hover:bg-orange-600"
          }`}
          id="sync_gcal_btn"
        >
          {syncLoading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : syncSuccess ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {syncLoading ? "SYNCING..." : syncSuccess ? "GOOGLE CALENDAR SYNCED!" : "SYNC GOOGLE CALENDAR"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column: Scheduling Planner helper */}
        <div className="space-y-4">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4 space-y-3">
            <h4 className="text-[10px] font-mono font-bold text-[#FF4D00] uppercase tracking-widest">
              SCHEDULING ASSISTANCE
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Select an active Lifeline task below, then **click any time cell** on the calendar to schedule or reschedule it.
            </p>

            {unscheduledTasks.length === 0 ? (
              <p className="text-[11px] text-emerald-400 font-mono uppercase">
                ✓ ALL LIFELINES SCHEDULED
              </p>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {unscheduledTasks.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTaskToSchedule(selectedTaskToSchedule === t.id ? null : t.id)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs font-mono uppercase transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      selectedTaskToSchedule === t.id
                        ? "bg-[#FF4D00]/20 border-[#FF4D00] text-white font-bold"
                        : "bg-[#0F0F0F] border-white/10 text-slate-300 hover:border-white/20"
                    }`}
                  >
                    <span className="truncate">{t.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded text-slate-400 shrink-0">
                      ⏱️ {t.estimatedMinutes || 30}M
                    </span>
                  </button>
                ))}
              </div>
            )}
            {selectedTaskToSchedule && (
              <div className="text-[10px] text-[#FF4D00] font-mono uppercase animate-pulse">
                ⚡ CLICK A CALENDAR DAY SLOT TO PLACE
              </div>
            )}
          </div>

          {/* Active calendar task index */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4 space-y-3">
            <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              ICAL SPRINT EXPORTS
            </h4>
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic font-sans">No tasks available to export.</p>
              ) : (
                tasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 bg-[#0F0F0F] border border-white/10 rounded-lg text-xs gap-2">
                    <div className="truncate min-w-0 pr-1">
                      <p className="font-bold text-white uppercase truncate text-[11px] font-mono">{t.title}</p>
                      <span className="text-[9px] text-slate-500 font-mono block">
                        DUE: {new Date(t.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleExportICS(t)}
                      className="p-1.5 bg-white/5 border border-white/10 hover:border-[#FF4D00] hover:text-[#FF4D00] text-slate-400 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Export standard iCal Invite"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column: Weekly Calendar View */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentWeekOffset(prev => prev - 1)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentWeekOffset(0)}
                className="px-2 py-1 text-[10px] font-mono font-bold uppercase rounded hover:bg-white/5 text-slate-300"
              >
                TODAY
              </button>
              <button
                onClick={() => setCurrentWeekOffset(prev => prev + 1)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs font-mono font-bold text-white uppercase">
              {weekDays[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} - {weekDays[6].toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>

          {/* Interactive Days Agenda Grid */}
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, idx) => {
              const dayTasks = getTasksForDay(day);
              const isToday = new Date().toDateString() === day.toDateString();
              const dayName = day.toLocaleDateString(undefined, { weekday: "short" });
              const dateNumber = day.getDate();

              return (
                <div 
                  key={idx} 
                  className={`min-h-[220px] rounded-xl border flex flex-col p-2.5 transition-colors relative ${
                    isToday 
                      ? "bg-white/[0.03] border-[#FF4D00]/50 shadow-sm" 
                      : "bg-[#0A0A0A] border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Day Header */}
                  <div className="text-center pb-2 border-b border-white/5">
                    <span className="text-[9px] text-slate-500 font-mono uppercase block">{dayName}</span>
                    <span className={`text-sm font-black mt-0.5 block ${isToday ? "text-[#FF4D00]" : "text-white"}`}>
                      {dateNumber}
                    </span>
                  </div>

                  {/* Cell Tasks List */}
                  <div className="flex-1 overflow-y-auto space-y-1.5 pt-2 font-mono text-[9px]">
                    {dayTasks.length === 0 ? (
                      <button
                        onClick={() => handleDaySlotClick(day, 12)}
                        className={`w-full h-full flex flex-col items-center justify-center border border-dashed border-white/5 rounded-lg text-slate-600 hover:border-[#FF4D00]/30 hover:text-[#FF4D00] py-4 transition-all text-center ${
                          selectedTaskToSchedule ? "cursor-pointer animate-pulse border-[#FF4D00]/40 text-[#FF4D00]" : "cursor-default"
                        }`}
                      >
                        {selectedTaskToSchedule ? "+" : ""}
                      </button>
                    ) : (
                      dayTasks.map(t => (
                        <div 
                          key={t.id} 
                          onClick={() => handleExportICS(t)}
                          className={`p-2 rounded-lg border text-left cursor-pointer transition-all hover:bg-white/[0.04] group relative ${
                            t.status === "completed"
                              ? "bg-white/5 border-white/5 text-slate-500"
                              : t.priority === "critical"
                                ? "bg-[#FF4D00]/10 border-[#FF4D00]/30 text-white font-bold"
                                : "bg-white/5 border-white/10 text-slate-200"
                          }`}
                          title={`Click to download .ics invite`}
                        >
                          <div className="truncate pr-4 font-sans font-bold uppercase">{t.title}</div>
                          <div className="text-[8px] text-slate-400 mt-0.5">
                            ⏱️ {new Date(t.deadline).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                          </div>
                          
                          <Download className="w-2.5 h-2.5 text-slate-500 group-hover:text-[#FF4D00] absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between gap-3 text-[10px] font-mono uppercase text-slate-400">
            <span>💡 Click on any scheduled calendar event above to download its <b>.ics</b> invite directly.</span>
            <span>WEEK OFFSET: {currentWeekOffset}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
