# Project Brief: Meaningful Conversations

## Overview
"Meaningful Conversations" is an AI-powered platform designed to support personal growth, structured thinking, and communication analysis. It features a unique "Life Context" system where user data and conversation history are stored in a portable Markdown (`.md`) file, acting as the AI's long-term memory.

## Core Value Proposition
- **Personalized Coaching:** AI coaches with distinct personalities (e.g., Stoic, Strategic) adapt to the user's specific life context.
- **Data Sovereignty & Privacy:** The core data structure is a user-controlled text file. For registered users, this data is End-to-End Encrypted (E2EE).
- **Continuous Growth:** The system analyzes conversations to propose updates to the Life Context file, tracking progress and insights over time.

## 🎯 Three Core Use Cases

### 1. AI Coaching & Personal Growth
- **Goal:** Provide continuous, personalized guidance for self-reflection and problem-solving.
- **Mechanism:** Specialized coaching personas (Sam, Gabrielle, Max, Ava, Kenji, Chloe, Mike, Rob, Victor, Bekky, Dan, …) use the "Life Context" file to maintain long-term memory and adapt to the user's personality profile (OCEAN, Riemann-Thomann). **Bekky** = strukturiertes Gedanken-Audit (produktseitig Abdeckung „stressige Überzeugungen“).

### 2. Structured Interviewing (Gloria Interview)
- **Goal:** Help users structure raw ideas, project concepts, or decisions without offering advice.
- **Mechanism:** A dedicated interviewer bot asks deepening questions to extract and organize thoughts, producing a clean transcript and summary.

### 3. Communication Analysis (Transcript Evaluation)
- **Goal:** Objectively evaluate communication skills and identify blind spots.
- **Mechanism:** Users upload existing transcripts for AI analysis against goals and behavioral patterns, receiving an evidence-based evaluation report.

## Key Features
- **Multiple AI Personas:** Varied coaching styles and interview modes.
- **Life Context File:** A structured `.md` file acting as the knowledge base.
- **Automated Updates:** AI-suggested modifications to the context file after sessions.
- **Voice & Text Interface:** Hands-free voice mode via Web Speech API.
- **Gamification:** XP, levels, and achievements to encourage consistency.
- **Calendar Integration:** Export actionable steps to ICS format.
- **Guest Mode:** Full functionality without server-side storage for maximum privacy.

## Tech Stack High-Level
- **Frontend:** React 19, Vite 8, TypeScript, Tailwind CSS, Capacitor (iOS).
- **Backend:** Node.js 22, Express 5, Prisma 7, MariaDB.
- **AI:** Google GenAI + Mistral SDK (Classic/Practice); Piper TTS container.
- **Release line:** **Staging + local `main` → 2.7.0** (ab 2026-11-17). **Production / iOS live → 2.6.0** until explicit prod release. **3.0.0** = PR #31 feature branch (separate from 2.7.0 line).
