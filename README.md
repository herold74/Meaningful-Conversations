# Meaningful Conversations

An application that provides access to several coaching bot characters with different perspectives and coaching styles. Users can create a "life context" file to personalize conversations and update it with new insights after each session.

The fundamental idea of using an .md file to preserve and update information in a structured way using AI was inspired by Chris Lovejoy (https://github.com/chris-lovejoy/personal-ai-coach). This method is very similar to human note-taking during a coaching process, but provides the benefit of creating the summary for the client instantly for further reflections. Meaningful conversations adds the graphical UI, and a reliable non-destructive process of updating the .md file using AI.

Programming was performed entirely using Google AI Studio. Therefore, the application was "composed" using Gemini-PRO.

The intellectual achievement of the publisher thus lies in defining and compiling the functions, the user experience and all considerations regarding real-world implementation in compliance with the legal framework and data security requirements relating to the handling of personal data in the coaching process.

According to the rules and regulations of AI Studio this project is licensed under the Apache Licence 2.0

## ✨ Core Features

*   **Multiple AI Coaches**: Choose from 7 distinct AI coaches:
    - **Nobody** - Efficient problem-solving with GPS framework
    - **Max** - Ambitious, goal-oriented coaching
    - **Ava** - Empathetic, supportive guidance
    - **Kenji** - Mindful, Zen-inspired reflection
    - **Chloe** - Structured Reflection & Reframing
    - **Rob** - Mental Fitness & Resilience focus
    - **G-Interviewer** - Structured reflection interviews
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

### Backend Setup

The backend server is required for the frontend to function. Please follow the detailed setup instructions in the backend's README file to get it running.

**➡️ [`meaningful-conversations-backend/README.md`](./meaningful-conversations-backend/README.md)**

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
