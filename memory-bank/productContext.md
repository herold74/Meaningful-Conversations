# Product Context

## Problem Statement
Personal coaching and self-reflection often lack continuity. Insights gained in one session can be lost or forgotten, and generic AI chatbots lack the long-term context of a user's life, goals, and struggles. Traditional note-taking is passive and doesn't actively inform future interactions.

## The Solution
Meaningful Conversations bridges this gap by creating a "living" document of the user's life—the **Life Context File**. This Markdown file serves two purposes:
1.  **Human-Readable Journal:** A structured record of goals, values, and challenges.
2.  **AI Memory Bank:** A context source that the AI reads before every conversation to provide highly relevant, personalized advice.

## User Experience
The user journey is circular and iterative:
1.  **Context Creation:** Create a Life Context via questionnaire or upload an existing one.
2.  **Personality Profile (Optional):** Complete surveys (Riemann-Thomann, Big Five, Spiral Dynamics) for adaptive coaching.
3.  **Coach Selection:** Choose from 8 bots: 6 coaches (Nobody, Max, Ava, Kenji, Chloe, Rob), Gloria Life Context (onboarding interview), and Gloria Interview (structured topic interviews with transcript export).
4.  **Conversation:** Voice or text dialogue. AI uses Life Context and personality profile for personalized guidance.
5.  **Analysis & Review:** AI generates summary, proposes Life Context updates, and optionally refines personality profile (DPFL mode).
6.  **Commit:** Review and accept changes, export calendar items for action steps.

## Privacy First
- **Guest Mode:** Zero server data. Everything happens in the browser. The user manages the `.md` file manually.
- **Registered Users:** Data is stored but **End-to-End Encrypted (E2EE)**. The server host cannot read the user's Life Context. Decryption happens only on the client side.

## Gamification Strategy
To encourage the habit of reflection:
- **XP System:** Points for sessions, context updates, and streaks.
- **Achievements:** Badges for milestones (e.g., "Consistency King", "Deep Diver").
- **Visual Feedback:** Progress bars and levels to visualize personal growth.

