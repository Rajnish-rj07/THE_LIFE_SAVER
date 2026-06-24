import React, { useState, useEffect } from "react";
import Confetti from "./Confetti";
import { 
  Plus, Trash2, CheckCircle2, Circle, Clock, Sparkles, 
  ChevronDown, ChevronUp, Award, AlertCircle, TrendingUp, Activity
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Task, PriorityType } from "../types";

interface TaskBoardProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, "id" | "subtasks" | "status"> & { subtasks: string[] }) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onRunPrioritization: () => Promise<void>;
  priorityRecommendations: { taskId: string; reason: string }[];
  generalAdvice: string;
  isPrioritizing: boolean;
}

export default function TaskBoard({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onRunPrioritization,
  priorityRecommendations,
  generalAdvice,
  isPrioritizing
}: TaskBoardProps) {
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("23:59");
  const [priority, setPriority] = useState<PriorityType>("imminent");
  const [category, setCategory] = useState("Academic");
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [subtaskInputs, setSubtaskInputs] = useState<string[]>([""]);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Trend Chart State & Calculations
  const [chartCategory, setChartCategory] = useState<string>("All");

  const getWeeklyTrendData = () => {
    const data = [];
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split("T")[0];
      const dayName = daysOfWeek[d.getDay()];
      const dayLabel = `${dayName} ${d.getMonth() + 1}/${d.getDate()}`;

      const completedCount = tasks.filter(t => {
        if (t.status !== "completed" || !t.completedAt) return false;
        const completionDate = t.completedAt.split("T")[0];
        const dateMatch = completionDate === dateString;
        const categoryMatch = chartCategory === "All" || t.category === chartCategory;
        return dateMatch && categoryMatch;
      }).length;

      data.push({
        label: dayLabel,
        completed: completedCount,
      });
    }
    return data;
  };

  const trendData = getWeeklyTrendData();

  const totalCompletedThisWeek = tasks.filter(t => {
    if (t.status !== "completed" || !t.completedAt) return false;
    const completionTime = new Date(t.completedAt).getTime();
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const categoryMatch = chartCategory === "All" || t.category === chartCategory;
    return completionTime >= oneWeekAgo && categoryMatch;
  }).length;

  const totalEstimatedMinutesCompleted = tasks.reduce((sum, t) => {
    if (t.status !== "completed" || !t.completedAt) return sum;
    const completionTime = new Date(t.completedAt).getTime();
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const categoryMatch = chartCategory === "All" || t.category === chartCategory;
    if (completionTime >= oneWeekAgo && categoryMatch) {
      return sum + (t.estimatedMinutes || 0);
    }
    return sum;
  }, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0A0A0A] border border-white/10 p-3 rounded-xl shadow-xl font-mono text-[11px] space-y-1">
          <p className="text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-[#FF4D00] font-black">
            RESOLVED: <span className="text-white">{payload[0].value} {payload[0].value === 1 ? "TASK" : "TASKS"}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "in_progress" | "completed">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | PriorityType>("all");

  // Force re-renders every 10 seconds to update countdown timers
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  const handleAddSubtaskField = () => {
    setSubtaskInputs([...subtaskInputs, ""]);
  };

  const handleRemoveSubtaskField = (index: number) => {
    const newFields = subtaskInputs.filter((_, i) => i !== index);
    setSubtaskInputs(newFields.length ? newFields : [""]);
  };

  const handleSubtaskChange = (index: number, val: string) => {
    const newFields = [...subtaskInputs];
    newFields[index] = val;
    setSubtaskInputs(newFields);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadlineDate) return;

    const filteredSubtasks = subtaskInputs.filter(s => s.trim() !== "");
    const deadlineISO = new Date(`${deadlineDate}T${deadlineTime}`).toISOString();

    onAddTask({
      title,
      description,
      deadline: deadlineISO,
      priority,
      category,
      estimatedMinutes,
      subtasks: filteredSubtasks
    });

    // Reset Form
    setTitle("");
    setDescription("");
    setDeadlineDate("");
    setDeadlineTime("23:59");
    setPriority("imminent");
    setCategory("Academic");
    setEstimatedMinutes(60);
    setSubtaskInputs([""]);
    setShowForm(false);
  };

  // Utility to calculate remaining time
  const getRemainingTimeText = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr).getTime();
    const now = new Date().getTime();
    const diff = deadline - now;

    if (diff <= 0) {
      return { text: "OVERDUE!", isOverdue: true, isCritical: true };
    }

    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return { text: `${days}D ${hours}H LEFT`, isOverdue: false, isCritical: false };
    }
    if (hours > 0) {
      return { text: `${hours}H ${minutes}M LEFT`, isOverdue: false, isCritical: hours < 3 };
    }
    return { text: `${minutes}M REMAINING!`, isOverdue: false, isCritical: true };
  };

  const getPriorityBadgeColor = (p: PriorityType) => {
    switch (p) {
      case "critical": return "bg-[#FF4D00]/10 text-[#FF4D00] border border-[#FF4D00]/30";
      case "imminent": return "bg-amber-500/10 text-amber-500 border border-amber-500/30";
      case "upcoming": return "bg-white/10 text-white/75 border border-white/20";
    }
  };

  const toggleTaskStatus = (task: Task) => {
    const nextStatusMap: Record<string, "pending" | "in_progress" | "completed"> = {
      pending: "in_progress",
      in_progress: "completed",
      completed: "pending"
    };
    const nextStatus = nextStatusMap[task.status];
    if (nextStatus === "completed") {
      setConfettiTrigger(prev => prev + 1);
    }
    onUpdateTask({
      ...task,
      status: nextStatus
    });
  };

  const toggleSubtask = (task: Task, subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map(sub => {
      if (sub.id === subtaskId) {
        return { ...sub, completed: !sub.completed };
      }
      return sub;
    });

    onUpdateTask({
      ...task,
      subtasks: updatedSubtasks
    });
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      <Confetti trigger={confettiTrigger} />
      {/* Header Panel with Stats & Gemini Nudge Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0F0F0F] p-6 rounded-2xl border border-white/10">
        <div>
          <h2 className="text-xl font-black font-syne uppercase tracking-tight">Active Operations</h2>
          <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-wider">
            {tasks.filter(t => t.status !== "completed").length} PENDING SPRINT LIFELINES // {tasks.filter(t => t.status === "completed").length} COMPLETED
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onRunPrioritization}
            disabled={isPrioritizing || tasks.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF4D00] hover:bg-orange-600 disabled:opacity-40 text-black text-xs font-mono font-bold uppercase rounded-lg cursor-pointer transition-all shadow"
            id="run_gemini_prioritize_btn"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isPrioritizing ? "PRIORITIZING..." : "PRIORITY ANALYZER"}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-slate-200 text-xs font-mono font-bold uppercase rounded-lg cursor-pointer transition-all"
            id="add_new_task_trigger_btn"
          >
            <Plus className="w-3.5 h-3.5" />
            NEW LIFELINE
          </button>
        </div>
      </div>

      {/* Intelligent AI Priorities Callout */}
      {priorityRecommendations.length > 0 && (
        <div className="bg-[#0F0F0F] border-2 border-[#FF4D00]/60 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FF4D00] animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#FF4D00] font-mono">
              AI SPRINT SEQUENCE DIRECTIVE
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">{generalAdvice}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {priorityRecommendations.map((rec, idx) => {
              const matchedTask = tasks.find(t => t.id === rec.taskId);
              if (!matchedTask) return null;
              return (
                <div key={rec.taskId} className="bg-[#0A0A0A] p-4 rounded-xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-mono font-bold bg-[#FF4D00] text-black px-1.5 py-0.5 rounded uppercase">
                      CRITICAL #{idx + 1}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{matchedTask.category}</span>
                  </div>
                  <h4 className="text-xs font-black text-white truncate uppercase font-syne">{matchedTask.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">{rec.reason}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly Productivity Trend Progress Widget */}
      <div className="bg-[#0F0F0F] rounded-2xl border border-white/10 p-6 space-y-5" id="weekly_trend_visualization_card">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-black font-syne text-white uppercase tracking-tight flex items-center gap-2">
              <TrendingUp className="text-[#FF4D00] w-4 h-4" />
              WEEKLY RESOLUTION VELOCITY
            </h3>
            <p className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">
              Productivity trend showing completed operations across days
            </p>
          </div>

          {/* Trend Category Selection filter */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white/5 border border-white/10 p-1 rounded-lg">
            {["All", "Academic", "Work", "Finance", "Personal", "Health"].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setChartCategory(cat)}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-md transition-all cursor-pointer ${
                  chartCategory === cat 
                    ? "bg-[#FF4D00] text-black" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
          {/* Recharts Area Chart */}
          <div className="lg:col-span-3 h-[200px] w-full relative" id="recharts_trend_container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF4D00" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#FF4D00" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  stroke="#52525b" 
                  fontSize={9} 
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tick={{ fill: "#94a3b8", fontFamily: "JetBrains Mono" }}
                />
                <YAxis 
                  stroke="#52525b" 
                  fontSize={9} 
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tick={{ fill: "#94a3b8", fontFamily: "JetBrains Mono" }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,77,0,0.2)", strokeWidth: 1 }} />
                <Area 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#FF4D00" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCompleted)" 
                  activeDot={{ r: 6, fill: "#FF4D00", stroke: "#fff", strokeWidth: 1.5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Dynamic Brutalist Counters beside the chart */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 space-y-4 h-full flex flex-col justify-center">
            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest block">WEEKLY RESOLVED</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black font-syne text-[#FF4D00]">
                  {totalCompletedThisWeek}
                </span>
                <span className="text-xs text-slate-400 font-mono font-bold uppercase">TASKS</span>
              </div>
            </div>

            <div className="space-y-1 border-t border-white/5 pt-3">
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest block">DEEP WORK SPRINT TIME</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black font-syne text-white">
                  {totalEstimatedMinutesCompleted}
                </span>
                <span className="text-xs text-slate-400 font-mono font-bold uppercase">MINS</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5 text-emerald-400 font-mono text-[10px] uppercase font-bold tracking-wider">
              <Activity className="w-3.5 h-3.5 animate-pulse shrink-0" />
              <span>Sustained Flow Protocol Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Task Creation Drawer Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#0F0F0F] p-6 rounded-2xl border border-white/10 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h3 className="text-xs font-black uppercase font-mono tracking-wider text-white">INITIALIZE EMERGENCY SPRINT CARD</h3>
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              className="text-xs text-slate-400 hover:text-[#FF4D00] font-mono uppercase cursor-pointer"
            >
              [ CANCEL ]
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">TITLE</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Chemistry Lab Report, Flight Check-In"
                className="w-full text-xs px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF4D00]"
                required
                id="task_title_input"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">CATEGORY</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF4D00]"
                id="task_category_select"
              >
                <option value="Academic">ACADEMIC</option>
                <option value="Work">WORK</option>
                <option value="Finance">FINANCE</option>
                <option value="Personal">PERSONAL</option>
                <option value="Health">HEALTH</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">STRESS CONTEXT / DESCRIPTION</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide context or stressor factors causing paralysis..."
              className="w-full text-xs px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF4D00] h-20 resize-none"
              id="task_description_textarea"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">DEADLINE DATE</label>
              <input
                type="date"
                value={deadlineDate}
                onChange={e => setDeadlineDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF4D00]"
                required
                id="task_deadline_date"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">DEADLINE TIME</label>
              <input
                type="time"
                value={deadlineTime}
                onChange={e => setDeadlineTime(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF4D00]"
                id="task_deadline_time"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">URGENCY LEVEL</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as PriorityType)}
                className="w-full text-xs px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF4D00]"
                id="task_priority_select"
              >
                <option value="critical">CRITICAL (ASAP)</option>
                <option value="imminent">IMMINENT (24-48 HOURS)</option>
                <option value="upcoming">UPCOMING (LATER)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">EST. DURATION (MIN)</label>
              <input
                type="number"
                value={estimatedMinutes}
                onChange={e => setEstimatedMinutes(Number(e.target.value))}
                min={5}
                className="w-full text-xs px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF4D00]"
                id="task_duration_input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex justify-between">
              <span>SUBTASKS / SPRINT MILESTONES</span>
              <button 
                type="button" 
                onClick={handleAddSubtaskField}
                className="text-[10px] text-[#FF4D00] hover:underline font-mono cursor-pointer"
              >
                + ADD STEP
              </button>
            </label>
            <div className="space-y-2">
              {subtaskInputs.map((val, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={val}
                    onChange={e => handleSubtaskChange(idx, e.target.value)}
                    placeholder={`Step ${idx + 1}`}
                    className="flex-1 text-xs px-3 py-1.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtaskField(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-[#FF4D00] text-black hover:bg-orange-600 active:scale-[0.99] text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer"
              id="save_task_btn"
            >
              LAUNCH CARD OPERATIONS
            </button>
          </div>
        </form>
      )}

      {/* List Filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 bg-[#0F0F0F] p-4 rounded-xl border border-white/10">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search lifelines, descriptions, tags..."
          className="text-xs px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg focus:outline-none focus:border-[#FF4D00] text-white w-full sm:w-64"
          id="task_search_field"
        />

        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="text-xs px-2.5 py-1.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF4D00] cursor-pointer"
            id="status_filter"
          >
            <option value="all">ALL STATES</option>
            <option value="pending">PENDING</option>
            <option value="in_progress">IN PROGRESS</option>
            <option value="completed">COMPLETED</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as any)}
            className="text-xs px-2.5 py-1.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF4D00] cursor-pointer"
            id="priority_filter"
          >
            <option value="all">ALL URGENCY</option>
            <option value="critical">CRITICAL</option>
            <option value="imminent">IMMINENT</option>
            <option value="upcoming">UPCOMING</option>
          </select>
        </div>
      </div>

      {/* Task Grid & Cards */}
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-[#0F0F0F] rounded-2xl border border-white/10 text-center space-y-3">
          <Award className="w-10 h-10 text-slate-600" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">No Active Operations Matching Criteria</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Everything is currently completed, or filters need adjustment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTasks.map(task => {
            const countdown = getRemainingTimeText(task.deadline);
            const isCompleted = task.status === "completed";
            const isExpanded = expandedTaskId === task.id;

            const totalSubtasks = task.subtasks.length;
            const completedSubtasks = task.subtasks.filter(s => s.completed).length;
            const subtaskPercentage = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

            return (
              <div 
                key={task.id} 
                className={`group bg-[#0F0F0F] rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isCompleted 
                    ? "opacity-50 border-white/5" 
                    : countdown.isCritical 
                      ? "border-2 border-[#FF4D00] shadow-md shadow-[#FF4D00]/10" 
                      : "border-white/10 hover:border-[#FF4D00]/60 hover:shadow-sm"
                }`}
                id={`task_card_${task.id}`}
              >
                {/* Main Card Header */}
                <div className="p-5 flex items-start gap-4 justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button 
                      type="button"
                      onClick={() => toggleTaskStatus(task)}
                      className="mt-0.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      id={`toggle_status_btn_${task.id}`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-[#FF4D00] fill-orange-500/10" />
                      ) : task.status === "in_progress" ? (
                        <div className="w-5 h-5 rounded-full border-2 border-[#FF4D00] border-t-transparent animate-spin" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600 hover:text-[#FF4D00]" />
                      )}
                    </button>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${getPriorityBadgeColor(task.priority)}`}>
                          {task.priority.toUpperCase()}
                        </span>
                        <span className="text-[9px] font-mono text-white bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase font-bold">
                          {task.category}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          ⏱️ {task.estimatedMinutes}M EST.
                        </span>
                      </div>

                      <div className="relative inline-block max-w-full">
                        <h3 className={`text-sm font-black font-syne uppercase text-white truncate transition-colors duration-300 ${isCompleted ? "text-slate-500" : ""}`}>
                          {task.title}
                        </h3>
                        {/* Custom animated strike-through line overlay */}
                        <div 
                          className={`absolute top-1/2 left-0 h-[2px] bg-[#FF4D00] transform -translate-y-1/2 rounded-full transition-all duration-500 ease-out origin-left pointer-events-none`}
                          style={{
                            width: isCompleted ? "100%" : "0%"
                          }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans">
                        {task.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className={`flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
                      isCompleted 
                        ? "bg-[#1A1A1A] text-slate-400" 
                        : countdown.isCritical 
                          ? "bg-[#FF4D00]/15 text-[#FF4D00] animate-pulse border border-[#FF4D00]/30" 
                          : "bg-white/5 text-white border border-white/10"
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      {isCompleted ? "DONE" : countdown.text}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                        title="Subtasks / Details"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                        title="Delete Lifeline"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details / Subtask Checklist Drawer */}
                {isExpanded && (
                  <div className="bg-[#0A0A0A] border-t border-white/10 p-5 space-y-4 animate-in fade-in duration-150">
                    {/* Progress bar for subtasks */}
                    {totalSubtasks > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                          <span>MILESTONE RESOLUTION PROGRESS</span>
                          <span>{completedSubtasks}/{totalSubtasks} STEPS ({subtaskPercentage}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                          <div 
                            className="h-full bg-[#FF4D00] transition-all duration-300 rounded-full" 
                            style={{ width: `${subtaskPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Checkbox itemized list */}
                    {totalSubtasks > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">MILESTONE CHECKLIST</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {task.subtasks.map(sub => (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => toggleSubtask(task, sub.id)}
                              className={`flex items-center gap-2.5 p-3 bg-[#0F0F0F] rounded-lg border text-left text-xs transition-colors hover:bg-white/5 cursor-pointer ${
                                sub.completed 
                                  ? "border-white/5 text-slate-500" 
                                  : "border-white/10 text-slate-200"
                              }`}
                            >
                              {sub.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-[#FF4D00] shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                              )}
                              <div className="relative inline-block max-w-full">
                                <span className={`transition-colors duration-300 ${sub.completed ? "text-slate-500" : ""}`}>{sub.title}</span>
                                {/* Custom animated strike-through line overlay */}
                                <div 
                                  className={`absolute top-1/2 left-0 h-[1.5px] bg-[#FF4D00] transform -translate-y-1/2 rounded-full transition-all duration-300 ease-out origin-left pointer-events-none`}
                                  style={{
                                    width: sub.completed ? "100%" : "0%"
                                  }}
                                />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Focus Tips Callout if available */}
                    {task.focusTips && (
                      <div className="bg-[#0F0F0F] border-l-2 border-[#FF4D00] p-4 rounded-r-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-[#FF4D00] uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Gemini Savior Protocol</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed italic">
                          "{task.focusTips}"
                        </p>
                      </div>
                    )}

                    {/* Schedule status */}
                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-500 pt-2 border-t border-white/5 uppercase">
                      <div>
                        DUE DATE: <span className="text-white font-bold">{new Date(task.deadline).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
