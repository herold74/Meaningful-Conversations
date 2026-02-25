# Meaningful Conversations

**Meaningful Conversations** is an AI-powered platform designed to support personal growth, structured thinking, and communication analysis. Unlike generic chat assistants, it offers three distinct, purpose-built use cases to address specific user needs:

## 🎯 Three Core Use Cases

### 1. AI Coaching & Personal Growth (The Core)
**Problem:** People often need continuous, personalized guidance for self-reflection, mental fitness, and problem-solving, but human coaching is expensive and not always available when needed. Generic AI chatbots lack context and long-term memory of the user's life.

**Solution:** A "Life Context" system that serves as the AI's long-term memory, combined with specialized coaching personas.
*   **Life Context:** A structured Markdown file that evolves with every session, tracking goals, challenges, and background.
*   **Specialized Coaches:** Distinct personas for different needs—from **Max** (Ambitious/Goal-Oriented) and **Ava** (Strategic) to **Rob** (Mental Fitness) and **Chloe** (Structured Reflection).
*   **Adaptive Coaching:** Uses personality profiles (OCEAN, Riemann-Thomann, Spiral Dynamics) to tailor the coaching style to the user.

### 2. Structured Interviewing (Gloria Interview)
**Problem:** Users often have raw ideas, project concepts, or complex decisions they need to structure. They don't need advice or coaching; they need a neutral sounding board to help them extract, organize, and clarify their own thoughts.

**Solution:** A dedicated **Interview Mode** where the AI acts strictly as a professional interviewer.
*   **Pure Inquiry:** The AI asks structured, deepening questions without offering advice, judgment, or coaching.
*   **Output-Focused:** The goal is to produce a clean, grammatically smoothed transcript and a structured summary of the user's own ideas.
*   **Versatile:** Ideal for brainstorming, project planning, journaling, or preparing for difficult conversations.

### 3. Communication Analysis (Transcript Evaluation)
**Problem:** It is difficult to objectively evaluate one's own communication skills, identify blind spots, or check if a conversation actually achieved its intended goal.

**Solution:** An **Evidence-Based Evaluation Tool** for analyzing existing conversation transcripts.
*   **Upload & Analyze:** Users upload transcripts (text or SRT) of real-world conversations.
*   **Objective Feedback:** The AI evaluates the interaction against stated goals, behavioral patterns, and (if available) the user's personality profile.
*   **Actionable Insights:** Provides a detailed report with scores, blind spot identification, and concrete next steps.

---

The fundamental idea of using an .md file to preserve and update information in a structured way using AI was inspired by Chris Lovejoy (https://github.com/chris-lovejoy/personal-ai-coach). This method is very similar to human note-taking during a coaching process, but provides the benefit of creating the summary for the client instantly for further reflections. Meaningful conversations adds the graphical UI, and a reliable non-destructive process of updating the .md file using AI.

Programming was performed entirely using Google AI Studio. Therefore, the application was "composed" using Gemini-PRO.

The intellectual achievement of the publisher thus lies in defining and compiling the functions, the user experience and all considerations regarding real-world implementation in compliance with the legal framework and data security requirements relating to the handling of personal data in the coaching process.

According to the rules and regulations of AI Studio this project is licensed under the Apache Licence 2.0

## 🎨 Branding / White-Label

This project supports full white-label rebranding via environment variables — no code changes required. All UI text, emails, PDFs, calendar events, and API routing read brand values from `VITE_BRAND_*` (frontend) and `BRAND_*` (backend) env vars. If no variables are set, the app uses its original "Meaningful Conversations / manualmode.at" branding.

**➡️ [WHITE-LABEL-GUIDE.md](./DOCUMENTATION/WHITE-LABEL-GUIDE.md)** — Complete variable reference and deployment checklist

> **Note:** The name "Meaningful Conversations", associated logos, and the "manualmode.at" brand identity are trademarks and are **not** covered by the Apache 2.0 license. See the [NOTICE](./NOTICE) file for details.

## ✨ Core Features

*   **Multiple AI Coaches**: Choose from 7 distinct AI coaches:
    - **Nobody** - Efficient problem-solving with GPS framework
    - **Max** - Ambitious, goal-oriented coaching
    - **Ava** - Empathetic, supportive guidance
    - **Kenji** - Mindful, Zen-inspired reflection
    - **Chloe** - Structured Reflection & Reframing
    - **Rob** - Mental Fitness & Resilience focus
    - **G-Interviewer** - Structured reflection interviews
*   **Transcript Evaluation** (Client-only): AI-powered analysis of conversation transcripts with personality-aware insights and PDF export.
    - **➡️ [User Guide (DE)](./DOCUMENTATION/TRANSCRIPT-EVALUATION-USER-GUIDE.md)** | **[User Guide (EN)](./DOCUMENTATION/TRANSCRIPT-EVALUATION-USER-GUIDE-EN.md)**
*   **Persistent Memory**: A "Life Context" file (`.md`) acts as the AI's long-term memory for personalized conversations.
*   **Personality Profile & Adaptive Coaching**:
    - Complete personality surveys (Riemann-Thomann, Big Five/OCEAN, Spiral Dynamics)
    - DPC (Dynamic Prompt Composition) - Profile-informed coaching
    - DPFL (Dynamic Prompt & Feedback Learning) - Adaptive learning from sessions
    - **Personality Simulator**: Test runner to simulate client interactions with different personality profiles for QA.
*   **Voice & Text Chat**: 
    - Text input with Markdown rendering
    - Voice input via Web Speech API
    - High-quality TTS output (Server voices: Thorsten, Amy, Ryan)
    - Local TTS fallback for all platforms
*   **End-to-End Encryption**: Life Context and personality profiles are encrypted client-side. Only you can decrypt your data.
*   **Automated Context Updates**: AI proposes updates to your Life Context after each session.
*   **Calendar Integration**: Export actionable next steps as .ics calendar events.
*   **Gamification**: XP, levels, streaks, and achievements for regular self-reflection.
*   **Seasonal Themes**: Automatic visual themes (Spring blossoms, Summer butterflies, Autumn leaves, Winter snowflakes).
*   **Guest Mode**: Full functionality without account. Data stays in your browser.
*   **Safety & Comfort**: "Comfort Check" feature to ensure emotional safety during intense sessions.
*   **Multi-language Support**: English and German.

## 🛠️ Technology Stack

*   **Frontend**:
    *   React 18 & Vite 7
    *   TypeScript
    *   Tailwind CSS
    *   Web Speech API for voice input/output
    *   Web Crypto API for End-to-End Encryption (E2EE)
    *   html2pdf.js for PDF export
    *   ICS library for calendar events
*   **Backend**:
    *   Node.js & Express.js
    *   Prisma ORM with MariaDB
    *   JSON Web Tokens (JWT) for authentication
    *   Google Gemini API (`@google/genai`) for AI coaching
*   **TTS Service**:
    *   Piper TTS (Python/Flask container)
    *   High-quality neural voices
    *   Automatic fallback to Web Speech API
*   **Infrastructure**:
    *   Podman containerization
    *   Nginx reverse proxy
    *   Dual environment (Staging/Production)

## 📂 Project Structure

This is a monorepo-style project containing both the frontend and the backend server.

*   `/` (root): Contains the frontend React application source code.
*   `/meaningful-conversations-backend`: Contains the backend Node.js server application.

## 🚀 Getting Started

This project consists of a frontend application (this directory) and a backend server (`/meaningful-conversations-backend`).

### Quick Start Guide

**➡️ New to the project?** Follow the complete setup guide:
- **[LOCAL-DEV-SETUP.md](./DOCUMENTATION/LOCAL-DEV-SETUP.md)** - Complete setup from scratch (recommended!)

### Backend Setup

The backend server is required for the frontend to function. Please follow the detailed setup instructions in the backend's README file to get it running.

**➡️ [`meaningful-conversations-backend/README.md`](./meaningful-conversations-backend/README.md)**

### Database Migrations

If you're working with database changes, see the migration guide:

**➡️ [LOCAL-DEV-MIGRATIONS.md](./DOCUMENTATION/LOCAL-DEV-MIGRATIONS.md)** - Prisma migration workflow & troubleshooting

### Frontend Setup

The frontend is a Vite-powered React application.

1.  **Configure Environment:** Create a `.env` file in the project root by copying the `.env.example` file. This file contains the URLs for the different backend environments. For most local development, you won't need to change the default values.

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:3000`.

4.  **Build for Production:**
    ```bash
    npm run build
    ```

#### Backend Connection

The frontend determines which backend to connect to based on the `.env` file and a URL parameter.

*   **Default Behavior:** By default (`http://localhost:3000`), the frontend connects to the live **staging** backend defined by `VITE_BACKEND_URL_STAGING` in your `.env` file. This is useful for working on the UI without running a local backend.
*   `?backend=local`: Use this (`http://localhost:3000?backend=local`) to connect to your local backend server, using the URL from `VITE_BACKEND_URL_LOCAL`.
*   `?backend=production`: Use this to connect to the production backend, using the URL from `VITE_BACKEND_URL_PRODUCTION`.

## 🧠 Key Concepts

*   **Life Context File**: A markdown (`.md`) file that serves as your personal journal and the AI's memory. It's structured with headings to store your goals, challenges, and progress. A well-structured file leads to better coaching insights.

*   **Session Flow**:
    1.  **Start**: Create a new Life Context file via a guided questionnaire or upload an existing one.
    2.  **Coach**: Select a coach whose style matches your current needs.
    3.  **Converse**: Chat with your coach via text or voice.
    4.  **Review**: End the session to receive an AI-generated summary, actionable next steps, and proposed updates to your Life Context file.
    5.  **Update**: Review the proposed changes, make manual edits if needed, and save (for registered users) or download your updated file for the next session.

*   **Privacy & E2EE**: Privacy is a core design principle. In guest mode, nothing is stored on the server. For registered users, the Life Context is encrypted *before* it leaves your browser and can only be decrypted by you. **This means if you forget your password, your data is permanently irrecoverable.**
