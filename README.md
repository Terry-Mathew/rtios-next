# rtios-next: The AI Operating System for Your Career

> **Your personal command center for landing elite roles.**
> *Powered by Next.js 16, React 19, Supabase, and Google Gemini Pro.*

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Next.js](https://img.shields.io/badge/Next.js-16.0-black) ![React](https://img.shields.io/badge/React-19.0-blue) ![Supabase](https://img.shields.io/badge/Supabase-Database-green) ![AI](https://img.shields.io/badge/AI-Gemini_Pro-orange)

## 🚀 Overview

**rtios-next** is not just a job tracker—it's an intelligent agent that actively works to get you hired. It replaces the chaos of spreadsheets, notes, and disparate AI tools with a single, cohesive "Career Operating System."

It goes beyond simple tracking by leveraging **Generative AI** to:
1.  **Analyze** your fit for every role.
2.  **Research** company culture and hidden details.
3.  **Prepare** you with elite-level interview coaching.
4.  **Network** for you with hyper-personalized outreach.

## ✨ Key Features

### 🧠 Intelligent Briefing & Research
-   **Deep Company Intel**: Instantly generates a comprehensive dossier on any company (Mission, Values, Recent News, Culture) using live web search capabilities.
-   **Resume Analysis**: Scores your resume against specific job descriptions, highlighting missing keywords and providing actionable advice to beat the ATS.

### 🎙️ Elite Interview Coach (2.0)
-   **Mix & Match Simulation**: Generates interview questions that specifically blend the **Job Description**, **Company Values**, and **Your Connect Resume/Portfolio**.
-   **Structured Prep**: Provides "Strong Sample Answers" in natural, spoken language, broken down into STAR format (Situation, Task, Action, Result).
-   **Evaluation Criteria**: Tells you exactly what the interviewer is scoring for each question.

### 🤝 Strategic Networking
-   **LinkedIn Outreach Generator**: Crafts high-conversion connection requests and follow-ups based on the recipient's role and your unique context.
-   **Cover Letter Engine**: Writes persuasive, non-generic cover letters that weave your specific achievements into the company's current challenges.

### 📋 Career Command Center
-   **Kanban Dashboard**: Visualize your pipeline from "Wishlist" to "Offer".
-   **Centralized Profile**: Manage your Resume, LinkedIn, and Portfolio links in one place, automatically feeding them into every AI workflow.
-   **Job Library**: Track every detail of your applications without the clutter.

---

## 🛠️ Technical Architecture

Built on a modern, robust, and scalable stack designed for performance and developer experience.

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16 (App Router)** | The latest in React frameworks, utilizing Server Components for speed and SEO. |
| **UI Library** | **React 19** | Cutting-edge React features including Actions and useOptimistic. |
| **Styling** | **Tailwind CSS v4** | Utility-first styling with the new optimized engine. |
| **Database** | **Supabase (PostgreSQL)** | Scalable relational database with Row Level Security (RLS) enabled. |
| **State** | **Zustand** | Lightweight, predictable client-side state management. |
| **AI Engine** | **Google Gemini 2.5/Pro** | Multimodal AI models powering the intelligence layer via secure Server Actions. |
| **Icons** | **Lucide React** | Beautiful, consistent icon set. |

---

## 🚦 Getting Started

### Prerequisites
-   Node.js 18+ (LTS recommended)
-   A Supabase Project (Free Tier works great)
-   A Google Cloud Project with Gemini API enabled

### 1. Clone the Repository
```bash
git clone https://github.com/Terry-Mathew/rtios-next.git
cd rtios-next/my-app
```

### 2. Configure Environment
Create a `.env.local` file in the root directory:

```env
# Supabase (Public - Safe for Client-Side)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini API (Server-Side ONLY)
GEMINI_API_KEY=your_gemini_api_key

# Admin Features (Required for Impersonation/Banning)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_pub_key # Alternative to ANON_KEY (v0.8.0+)
```

> **⚠️ Security Warning**:  
> - Never commit `.env.local` to git (already in `.gitignore`)
> - `NEXT_PUBLIC_*` variables are exposed to the browser
> - `GEMINI_API_KEY` stays server-side only (do NOT use `NEXT_PUBLIC_` prefix)

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to launch your Career OS.

---

## 🔒 Security & Best Practices

-   **Server Actions**: All AI interactions happen securely on the server. Your API keys are never exposed to the client.
-   **Row Level Security (RLS)**: Database policies ensure you can only access your own job data.
-   **Type Safety**: Fully typed with TypeScript for reliability and maintainability.

## 🤝 Contributing

We welcome contributions to make this the ultimate career tool!
1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

> **Built with intent.** Helping you land the job you deserve.
