import { Task, Habit, Message } from "./types";

export interface PresetData {
  tasks: Task[];
  habits: Habit[];
  dailyGoals: { id: string; title: string; completed: boolean }[];
  nudge: {
    title: string;
    message: string;
    actionableStep: string;
    urgencyColor: string;
    motivationalQuote: string;
  };
  messages: Message[];
}

export const DEFAULT_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Organic Chemistry Lab Report",
    description: "Submit final molecular synthesis results with complete error analysis. Feeling extremely anxious about structural formulas.",
    deadline: new Date(Date.now() + 3.5 * 60 * 60 * 1000).toISOString(),
    priority: "critical",
    status: "in_progress",
    category: "Academic",
    estimatedMinutes: 90,
    subtasks: [
      { id: "sub-1", title: "Format the physical observations table", completed: true, estimatedMinutes: 15 },
      { id: "sub-2", title: "Calculate percentage yield of copper synthesis", completed: false, estimatedMinutes: 20 },
      { id: "sub-3", title: "Write the reaction mechanism steps", completed: false, estimatedMinutes: 30 },
      { id: "sub-4", title: "Proofread and export PDF", completed: false, estimatedMinutes: 15 }
    ],
    focusTips: "Minimize distraction using a 25-minute Pomodoro block. Turn off your phone and ignore the outcome — write messy sentences to bypass perfectionism."
  },
  {
    id: "task-2",
    title: "Quarterly Tax Return Filing",
    description: "Submit state tax estimates to avoid late penalties. Bureaucracy is heavy, need to find receipts folder.",
    deadline: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    priority: "imminent",
    status: "pending",
    category: "Finance",
    estimatedMinutes: 60,
    subtasks: [
      { id: "sub-5", title: "Locate digital folder for Q2 invoices", completed: false, estimatedMinutes: 15 },
      { id: "sub-6", title: "Input values to online state portal", completed: false, estimatedMinutes: 30 },
      { id: "sub-7", title: "Save confirmation receipt", completed: false, estimatedMinutes: 15 }
    ]
  },
  {
    id: "task-3",
    title: "Reschedule Dental Surgery Appointment",
    description: "Call clinic before they close at 5 PM today to avoid the $50 cancellation surcharge.",
    deadline: new Date(new Date().setHours(17, 0, 0, 0)).toISOString(),
    priority: "critical",
    status: "pending",
    category: "Health",
    estimatedMinutes: 15,
    subtasks: []
  }
];

export const DEFAULT_HABITS: Habit[] = [
  { id: "habit-1", title: "Stand up and stretch every 45 mins", streak: 3, completedToday: false, category: "Health" },
  { id: "habit-2", title: "Draft 100 words of writing on any project", streak: 8, completedToday: true, category: "Work" },
  { id: "habit-3", title: "Perform 1 minute of Box Breathing", streak: 5, completedToday: false, category: "Health" }
];

export const ATHLETE_CS_PRESET: PresetData = {
  tasks: [
    {
      id: "task-cs-1",
      title: "Java DSA Night Coding: 2 Hrs Graphs & Trees",
      description: "Intense study session (9 PM - 11 PM) focusing on coding graph traversals (BFS, DFS) & recursive depth calculations in Java.",
      deadline: new Date(new Date().setHours(23, 0, 0, 0)).toISOString(), // 11:00 PM tonight
      priority: "critical",
      status: "in_progress",
      category: "Academic/CS",
      estimatedMinutes: 120,
      subtasks: [
        { id: "sub-cs-1", title: "Implement Adjacency List Map in Java", completed: true, estimatedMinutes: 20 },
        { id: "sub-cs-2", title: "Write iterative Queue-based BFS method", completed: false, estimatedMinutes: 35 },
        { id: "sub-cs-3", title: "Write recursive stack-based DFS algorithm", completed: false, estimatedMinutes: 35 },
        { id: "sub-cs-4", title: "Test with disconnected graphs & cycles", completed: false, estimatedMinutes: 30 }
      ],
      focusTips: "Eliminate phone buzz from 9 to 11 PM. Pure dark theme editor. Code step-by-step and write test assertions."
    },
    {
      id: "task-ath-1",
      title: "Evening Gym Session: Heavy Push Workout",
      description: "Dedicated high-intensity weightlifting (6 PM - 8 PM) targeting barbell chest press, overhead press, and tricep progressive overload.",
      deadline: new Date(new Date().setHours(20, 0, 0, 0)).toISOString(), // 8:00 PM tonight
      priority: "critical",
      status: "pending",
      category: "Fitness/Health",
      estimatedMinutes: 120,
      subtasks: [
        { id: "sub-ath-1", title: "10-minute active warm-up & rotator cuff stretch", completed: false, estimatedMinutes: 10 },
        { id: "sub-ath-2", title: "4 sets of Flat Bench Press with progressive load", completed: false, estimatedMinutes: 30 },
        { id: "sub-ath-3", title: "3 sets of Dumbbell Overhead Shoulder Press", completed: false, estimatedMinutes: 25 },
        { id: "sub-ath-4", title: "Tricep extensions and lateral raises supersets", completed: false, estimatedMinutes: 25 },
        { id: "sub-ath-5", title: "Cool-down static stretching", completed: false, estimatedMinutes: 10 }
      ],
      focusTips: "Gym time is sacred. Push hard and stay hydrated. Log your heavy working sets in your logbook."
    },
    {
      id: "task-cs-2",
      title: "Capstone Project: Design Schema Migrations",
      description: "Draft PostgreSQL structural database setup with proper entities and indexing keys for the student platform.",
      deadline: new Date(Date.now() + 28 * 60 * 60 * 1000).toISOString(),
      priority: "imminent",
      status: "pending",
      category: "Academic/CS",
      estimatedMinutes: 90,
      subtasks: [
        { id: "sub-cs-5", title: "Map user profiles and task assignment entities", completed: false, estimatedMinutes: 30 },
        { id: "sub-cs-6", title: "Generate SQL schemas with primary/foreign keys", completed: false, estimatedMinutes: 30 },
        { id: "sub-cs-7", title: "Add btree indices to high-frequency query columns", completed: false, estimatedMinutes: 30 }
      ]
    },
    {
      id: "task-ath-2",
      title: "Gym Nutrition: Prep Pre-workout & Meals",
      description: "High-protein fuel: blend 80g oats, 1 scoop whey, 1 banana, and peanut butter to sustain high energy levels during workout.",
      deadline: new Date(new Date().setHours(17, 15, 0, 0)).toISOString(), // 5:15 PM today
      priority: "imminent",
      status: "pending",
      category: "Fitness/Health",
      estimatedMinutes: 20,
      subtasks: [
        { id: "sub-ath-6", title: "Weigh oats, grind, and blend with whey isolate", completed: false, estimatedMinutes: 8 },
        { id: "sub-ath-7", title: "Pack fitness gear & shaker bottle", completed: false, estimatedMinutes: 7 },
        { id: "sub-ath-8", title: "Hydrate with 500ml of clean water with minerals", completed: false, estimatedMinutes: 5 }
      ]
    }
  ],
  habits: [
    { id: "habit-cs-1", title: "DSA Practice in Java (9:00 PM - 11:00 PM)", streak: 7, completedToday: false, category: "Academic/CS" },
    { id: "habit-ath-1", title: "Evening Gym Workout (6:00 PM - 8:00 PM)", streak: 4, completedToday: false, category: "Fitness/Health" },
    { id: "habit-cs-2", title: "Solve LeetCode Daily Challenge", streak: 12, completedToday: true, category: "Academic/CS" },
    { id: "habit-ath-2", title: "Water Intake: 3.5 Litres target", streak: 9, completedToday: false, category: "Fitness/Health" },
    { id: "habit-cs-3", title: "Git Push / Commits to personal project", streak: 5, completedToday: true, category: "Academic/CS" },
    { id: "habit-cs-4", title: "Read Tech Blog / System Design notes", streak: 3, completedToday: false, category: "Academic/CS" },
    { id: "habit-cs-5", title: "Revise CS Core Subjects (OS/DBMS/CN)", streak: 6, completedToday: false, category: "Academic/CS" },
    { id: "habit-ath-3", title: "Drink post-workout whey shake", streak: 11, completedToday: false, category: "Fitness/Health" },
    { id: "habit-cs-6", title: "Contribute to Open Source / Side project", streak: 2, completedToday: false, category: "Academic/CS" },
    { id: "habit-ath-4", title: "No Screens / Blue light after 11:30 PM", streak: 8, completedToday: false, category: "Health" }
  ],
  dailyGoals: [
    { id: "g-cs-1", title: "Code Queue-based BFS in Java", completed: false },
    { id: "g-ath-1", title: "Exceed 4 sets of 100kg Bench Press", completed: false },
    { id: "g-cs-2", title: "Finish LeetCode Daily Challenge", completed: true }
  ],
  nudge: {
    title: "ATHLETE-CODER SYNC ACTIVE",
    message: "Your schedule is locked. You have an evening weightlifting block at 6 PM to 8 PM, followed by a high-stakes 2-hour DSA coding marathon in Java at 9 PM. Executive function thrives on rhythm — load your shake now and keep the code window ready.",
    actionableStep: "Blend your oats & whey by 5:15 PM so you have optimal glycogen levels for the 6 PM workout session.",
    urgencyColor: "red",
    motivationalQuote: "The resistance is highest right before you start coding or lifting. Crush the first set, and the rest flows."
  },
  messages: [
    {
      id: "msg-preset-1",
      sender: "ai",
      text: "🏋️‍♂️👨‍💻 Athlete-Coder Sync Mode initiated successfully! Your B.Tech Computer Science curriculum and Evening Gym Routine are fully integrated.",
      timestamp: new Date().toLocaleTimeString()
    },
    {
      id: "msg-preset-2",
      sender: "user",
      text: "I want to focus on my 6:00 PM workout and code DSA with Java at night.",
      timestamp: new Date().toLocaleTimeString()
    },
    {
      id: "msg-preset-3",
      sender: "ai",
      text: "Understood. I have locked in your habits! Gym from 6 PM to 8 PM, and DSA in Java from 9 PM to 11 PM. Let's practice recursive DFS traversals with absolute focus tonight. I am right here to help you deconstruct complex Graph problems!",
      timestamp: new Date().toLocaleTimeString()
    }
  ]
};
