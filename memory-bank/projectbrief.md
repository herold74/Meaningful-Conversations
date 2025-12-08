# Project Brief: Meaningful Conversations

## Overview
"Meaningful Conversations" is an AI-powered coaching application designed to facilitate deep, self-reflective dialogues. It features a unique "Life Context" system where user data and conversation history are stored in a portable Markdown (`.md`) file, acting as the AI's long-term memory.

## Core Value Proposition
- **Personalized Coaching:** AI coaches with distinct personalities (e.g., Stoic, Strategic) adapt to the user's specific life context.
- **Data Sovereignty & Privacy:** The core data structure is a user-controlled text file. For registered users, this data is End-to-End Encrypted (E2EE).
- **Continuous Growth:** The system analyzes conversations to propose updates to the Life Context file, tracking progress and insights over time.

## Key Features
- **Multiple AI Personas:** Varied coaching styles.
- **Life Context File:** A structured `.md` file acting as the knowledge base.
- **Automated Updates:** AI-suggested modifications to the context file after sessions.
- **Voice & Text Interface:** Hands-free voice mode via Web Speech API.
- **Gamification:** XP, levels, and achievements to encourage consistency.
- **Calendar Integration:** Export actionable steps to ICS format.
- **Guest Mode:** Full functionality without server-side storage for maximum privacy.

## Tech Stack High-Level
- **Frontend:** React (Vite), TypeScript, Tailwind CSS.
- **Backend:** Node.js, Express, Prisma, MySQL.
- **AI:** Google Gemini API.

