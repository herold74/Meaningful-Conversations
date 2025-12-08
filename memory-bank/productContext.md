# Product Context

## Problem Statement
Personal coaching and self-reflection often lack continuity. Insights gained in one session can be lost or forgotten, and generic AI chatbots lack the long-term context of a user's life, goals, and struggles. Traditional note-taking is passive and doesn't actively inform future interactions.

## The Solution
Meaningful Conversations bridges this gap by creating a "living" document of the user's life—the **Life Context File**. This Markdown file serves two purposes:
1.  **Human-Readable Journal:** A structured record of goals, values, and challenges.
2.  **AI Memory Bank:** A context source that the AI reads before every conversation to provide highly relevant, personalized advice.

## User Experience
The user journey is circular and iterative:
1.  **Context Creation:** Users start by creating a Life Context (via questionnaire) or uploading an existing one.
2.  **Coach Selection:** Users choose a coach persona (e.g., "The Stoic") that fits their current mood or need.
3.  **Conversation:** A real-time dialogue (voice or text) where the AI uses the loaded context to guide the discussion.
4.  **Analysis & Review:** Post-session, the AI generates a summary and **proposes specific updates** to the Life Context file (e.g., adding a new goal, marking a challenge as resolved).
5.  **Commit:** The user reviews and accepts these changes, updating their "memory" for the next session.

## Privacy First
- **Guest Mode:** Zero server data. Everything happens in the browser. The user manages the `.md` file manually.
- **Registered Users:** Data is stored but **End-to-End Encrypted (E2EE)**. The server host cannot read the user's Life Context. Decryption happens only on the client side.

## Gamification Strategy
To encourage the habit of reflection:
- **XP System:** Points for sessions, context updates, and streaks.
- **Achievements:** Badges for milestones (e.g., "Consistency King", "Deep Diver").
- **Visual Feedback:** Progress bars and levels to visualize personal growth.

