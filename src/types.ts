export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  estimatedMinutes?: number;
}

export type PriorityType = 'critical' | 'imminent' | 'upcoming';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO String
  priority: PriorityType;
  status: TaskStatus;
  category: string;
  estimatedMinutes: number;
  subtasks: SubTask[];
  scheduledDate?: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:MM
  focusTips?: string;
  isCustomBreakdown?: boolean;
  completedAt?: string; // ISO String
}

export interface Habit {
  id: string;
  title: string;
  streak: number;
  lastCompleted?: string; // YYYY-MM-DD
  completedToday: boolean;
  category: string;
}

export interface ProactiveNudge {
  title: string;
  message: string;
  actionableStep: string;
  urgencyColor: string; // 'red', 'yellow', 'green'
  motivationalQuote: string;
}

export interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export interface DailyGoal {
  id: string;
  title: string;
  completed: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  tasks: Task[];
  habits: Habit[];
  dailyGoals: DailyGoal[];
  messages: Message[];
  nudge: ProactiveNudge | null;
}
