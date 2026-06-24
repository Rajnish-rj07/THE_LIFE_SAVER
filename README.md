# The Last-Minute Life Saver 🚨⏱️

An emotion-aware, AI-powered productivity savior designed to actively assist users in planning, prioritizing, and defeating chronic procrastination blocks before deadlines are missed.

Built with **React**, **Vite**, **Express**, **Tailwind CSS**, **Cloud SQL (PostgreSQL)**, and powered by the cutting-edge **Google Gemini API** (via `@google/genai` SDK), **Firebase Authentication**, and **Google Workspace Integration**.

---

## 📖 Table of Contents
1. [Submission Details](#-submission-details)
   - [Problem Statement Selected](#problem-statement-selected)
   - [Solution Overview](#solution-overview)
   - [Key Features](#key-features)
   - [Technologies Used](#technologies-used)
   - [Google Technologies Utilized](#google-technologies-utilized)
2. [Application Architecture](#-application-architecture)
3. [File Structure & Documentation](#-file-structure--documentation)
4. [Local Development Guide](#-local-development-guide)
5. [Environment Setup](#-environment-setup)

---

## 📝 Submission Details

Here are the complete details formatted for your project submission or Google Doc:

### Problem Statement Selected
In high-pressure academic and professional environments, traditional productivity tools fail because they ignore the primary human obstacle: **emotional resistance and cognitive friction**. Passive reminder systems, calendar alerts, and sterile list-builders often compound stress rather than easing the transition into action, creating a "database of guilt" that triggers task avoidance, executive dysfunction, and severe procrastination.
The selected problem statement focuses on transforming the planning experience from an source of anxiety into a low-friction, supportive, and active companion that uses emotional alignment and micro-commitments to break through task-initiation blocks.

### Solution Overview
**"The Last-Minute Life Saver"** is an emotion-aware, active companion designed to help users navigate high-stress workloads and immediate deadlines. 
Unlike passive planners, this app takes a proactive, coaching role. When deadline pressure looms, the companion steps in to bypass resistance by breaking daunting tasks into risk-free, non-threatening 5-minute micro-sprints and providing real-time vocal support. By leveraging cognitive reframing and immediate, micro-action, the app shifts the focus from intimidating long-term objectives to rewarding immediate tasks, establishing positive dopamine loops.

### Key Features
* **Autonomous Task Breakdown (Friction Buster):** Dynamically splits complex, high-anxiety tasks into 3 to 5 highly actionable, bite-sized micro-steps of 5-20 minutes, including custom environment hacks (e.g., "Put on noise-canceling headphones") and focus advice.
* **Proactive Coach Nudges (The Urgent Feed):** An active alert center that continuously analyzes tasks, deadlines, and habits to surface supportive, high-priority notifications and direct sprint invitations.
* **Smart Task Prioritization:** Empathy-driven prioritization using cognitive principles (such as the Eisenhower Matrix, high-anxiety reduction, and momentum building) to highlight the top 3 high-impact items from a cluttered board.
* **AI Coach Chat Companion (Saver Bot):** An interactive, empathetic, and witty chat assistant designed to tackle ADHD-style focus resistance, keep you company during tough work sessions, and guide you to immediate action.
* **Vocal Coaching & Multi-modal TTS:** Transforms text-based advice into high-fidelity spoken briefings and vocal encouragement using advanced Gemini text-to-speech models.
* **Google Workspace Integration:** Real-time synchronization of active Google Tasks and Google Calendar primary events.

### Technologies Used
* **Frontend:** React 18, Vite, Tailwind CSS, Lucide React icons, and Framer Motion layout animations.
* **Backend:** Node.js, Express, `tsx` (TypeScript Execute), and `esbuild` for bundled standalone compilations.
* **Database & Persistence:** Cloud SQL (PostgreSQL), Drizzle ORM (Object-Relational Mapping), and Firebase Firestore for robust, multi-workspace cloud persistence.

### Google Technologies Utilized
* **Google Gemini API (via modern `@google/genai` SDK):**
  - `gemini-3.5-flash`: Powers highly structured JSON generation for Proactive Nudges, Autonomous Task Breakdowns, and Intelligent Workload Prioritization.
  - `gemini-3.1-flash-tts-preview`: Renders advanced multi-modal Text-to-Speech vocal coaching, allowing the app to read spoken schedules in custom supportive prebuilt voices (*Kore*, *Puck*, *Zephyr*).
* **Firebase Authentication:** Secure Google Sign-In and token management for workspace verification.
* **Google Workspace API:** Seamlessly synchronizes active Google Tasks and Google Calendar primary events directly with user profiles.
* **Google Cloud SQL:** High-performance, scale-to-zero serverless PostgreSQL database hosting relational user workspace and task tables.

---

## 🏗️ Application Architecture

The application is structured as a **full-stack Express + Vite** app running as a single cohesive unit:

```
+-------------------------------------------------------------+
|                        BROWSER (Client)                     |
|  - React 18 / Vite SPA                                      |
|  - Tailwind CSS / Brutalist Dashboard Design                |
|  - Google Sign-In via Firebase Auth                         |
|  - Audio Player for Vocal Coaching                          |
+------------------------------+------------------------------+
                               |
                        HTTP / JSON API
                               |
+------------------------------v------------------------------+
|                         BACKEND SERVER                      |
|  - Node.js & Express (server.ts)                            |
|  - Drizzle ORM connecting to Cloud SQL (PostgreSQL)         |
|  - Google Workspace API Client (Tasks / Calendar Sync)       |
|  - Google GenAI SDK Proxy (API Key Security)                |
+------------------------------+------------------------------+
                               |
       +-----------------------+-----------------------+
       |                                               |
+------v------+                                 +------v------+
|  Google AI  |                                 | Cloud SQL / |
|  Gemini API |                                 |  Firestore  |
+-------------+                                 +-------------+
```

---

## 📁 File Structure & Documentation

### Core Backend Files
* **`/server.ts`**: The main Express backend server entry point.
  - Express routes proxying Gemini requests (keeping `GEMINI_API_KEY` secure on the server side).
  - Handles Google Workspace OAuth credentials exchange and performs token-authorized queries to Google Calendar (`/api/workspace/sync/calendar`) and Google Tasks (`/api/workspace/sync/tasks`).
  - Sets up the production-ready Vite static assets server.
* **`/src/db/`**: Database configuration and schemas using Drizzle ORM connecting to Cloud SQL PostgreSQL.

### Core Frontend Files
* **`/src/App.tsx`**: Main UI coordinate panel coordinating tabs, layout, and OAuth state.
* **`/src/components/AutonomousPlanner.tsx`**: Interactive task breakdown component that queries Gemini to partition intimidating assignments into 5-minute actionable micro-steps.
* **`/src/components/TaskBoard.tsx`**: A gorgeous, brutalist-style interactive task board for tracking, categorizing, and prioritizing workloads.
* **`/src/components/CalendarView.tsx`**: Synchronized display showing imported Google Calendar events alongside task deadlines.
* **`/src/components/RemindersAlertCenter.tsx`**: Responsive proactive coaching alert feed supplying stress mitigation tips.
* **`/src/components/Confetti.tsx`**: Micro-interaction reward system to celebrate completion of tasks and micro-steps, triggering immediate positive feedback.

---

## 🚀 Local Development Guide

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
1. Clone the repository.
2. Install the dependencies:
   ```bash
   npm install
   ```

### Running the App
- **Development Mode:** Runs the client and server concurrently with instant reload support:
  ```bash
  npm run dev
  ```
  The application will be accessible at `http://localhost:3000`.

- **Production Build:** Bundles static client files via Vite and compiles the TypeScript server into a optimized, self-contained CommonJS file using `esbuild`:
  ```bash
  npm run build
  npm start
  ```

---

## ⚙️ Environment Setup

To run the application locally, create a `.env` file in the root directory and define the following variables:

```env
# Google Gemini API Key (Required for task breakdowns & vocal coach)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Web App Configuration (Required for Google Sign-In)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Database Connection (Optional if running in local storage fallback)
DATABASE_URL=postgresql://user:password@host:port/database
```
