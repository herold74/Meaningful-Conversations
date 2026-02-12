# Meaningful Conversations - Feature List

This document provides a complete, alphabetically sorted list of all features available in the application.

---

### About Page
Displays information about the app's philosophy, mission, and how it works.

### Achievements
A gamification feature where users earn badges for reaching milestones like completing a certain number of sessions or maintaining a streak.

### Admin Console
A secure dashboard for administrators to manage users (activate, toggle roles), generate and view upgrade codes, and review support tickets and user feedback.

### AI Coach Selection
Allows users to choose from a variety of AI coaches, each with a distinct personality, coaching style (e.g., Stoic, Reflective, Strategic), and access tier.

### Authentication
A complete system for user registration, login, and secure session management. Includes email verification for new accounts and password reset functionality.

### Automatic Context Updates
After each session, the AI analyzes the conversation and proposes structured updates (append, replace) to the user's Life Context file.

### Burger Menu
A collapsible side navigation menu providing access to settings, informational pages (like FAQ, About), and user actions (Logout, Start Over).

### Chat Interface
The primary screen for real-time text and voice interaction with the selected AI coach.

### Dark/Light Theme
A user-configurable setting to switch the application's appearance between a light and a dark mode for visual comfort.

### Data Backup/Download
Enables users to download a complete copy of their Life Context file, including gamification data, for backup or offline use.

### Delete Account
A feature for registered users to permanently and securely delete their account and all associated data from the server.

### Disclaimer & Terms
Provides users with essential legal information, including the Terms of Service and a disclaimer regarding the app's non-professional advice.

### End-to-End Encryption (E2EE)
For registered users, the Life Context file is encrypted on the user's device before being sent to the server, ensuring only the user can decrypt and read their data.

### FAQ Page
An informational page that answers frequently asked questions about the app's features, data privacy, and coaching concepts.

### Feedback System
Allows users to rate sessions on a 1-5 star scale and provide written feedback. Users can also report specific problematic AI messages directly from the chat.

### Formatting Help
An in-app guide that explains how to use Markdown syntax (headings, bold, lists) to effectively structure the Life Context file.

### Gamification System
Engages users with a system of experience points (XP), levels, and daily streaks to encourage regular self-reflection sessions.

### Guest Mode
Allows users to access a selection of coaches and core features without creating an account. All data is processed locally in the browser.

### Life Context Creation (Interview)
A conversational onboarding option where a guide bot (Gloria) interviews the user to automatically generate their initial Life Context file.

### Life Context Creation (Questionnaire)
A structured form that guides new users through a series of questions to build their initial Life Context file.

### Life Context Management
The app's core concept of using a persistent Markdown (`.md`) file as the AI's memory, which users can upload, view, edit, and update.

### Multi-language Support
The user interface and AI coach interactions are fully available in both English and German, with a toggle for language preference.

### Password Management
Provides secure functionality for registered users to change their current password or request a password reset via email if forgotten.

### Paywall & Access Passes
A system designed for future monetization that manages user access based on an expiration date, which can be extended by redeeming access codes.

### PII Warning
A mandatory warning screen shown after generating a new Life Context file, advising the user to review and remove any sensitive personal information.

### Session Review & Analysis
A comprehensive post-session dashboard that presents an AI-generated summary of insights, actionable next steps, and a "diff" view of proposed changes to the Life Context file.

### Solution Blockage Analysis
An experimental feature for premium users where the AI identifies and explains potential psychological blockages (e.g., self-reproach) based on the conversation.

### Speech-to-Text (Dictation)
An accessibility and convenience feature in the chat that allows users to dictate their messages using their device's microphone instead of typing.

### Text-to-Speech (Voice Output)
Allows users to have the AI coach's responses read aloud, with playback controls for pausing, resuming, and repeating.

### Upgrade Code Redemption
A feature allowing users to enter a code to unlock premium features, specific coaches, or extend their account access.

### User Guide
An in-app "First Steps" guide that provides a detailed walkthrough of the application's entire workflow, from getting started to session review.

### Voice Mode
A dedicated, hands-free conversational interface that combines speech-to-text and text-to-speech for a more natural, fluid dialogue experience.

### Voice Selection
A customization feature that allows users to choose and preview different system voices for the AI coach's text-to-speech output.

---

## Feature Backlog & Research Findings

This section captures research insights, enhancement ideas, and architectural improvements identified during development. Items here are not yet planned for implementation but represent validated directions for future work.

### Spiral Dynamics: 2nd-Tier Coaching Modality

**Source:** Review of [spiraldynamics-integral.de](https://spiraldynamics-integral.de/) (CHE D·A·CH) and analysis of current DPC strategy implementation.

**Background:**
Spiral Dynamics theory distinguishes two fundamentally different tiers of value systems:
- **1st Tier** (Beige through Green): Each level believes its worldview is the only correct one and tends to reject others.
- **2nd Tier** (Yellow, Turquoise): These levels can see the value and necessity of ALL previous levels. They hold a systemic, integrative meta-perspective.

**Current Implementation:**
The DPC strategy merger (`dpcStrategies.js`, `dpcStrategyMerger.js`) treats all 8 SD levels with the same structural pattern — a `high` and `low` strategy for each, merged by rank weight (1.0 primary, 0.7 secondary). The coaching bot always speaks *within* the user's dominant value system.

For a Yellow-dominant profile, the bot currently receives:
- Language: "systemic, integrative, perspective-rich"
- Tone: "curious, flexible, complexity-affirming"
- Approach: "Offer multiple perspectives. Encourage systems thinking and embracing complexity."

**Enhancement Opportunity:**
A 2nd-tier dominant person can handle — and actually *prefers* — **cross-level meta-reflection**. For example: *"I notice your systems-thinking side wants to map out all possibilities, but maybe your Orange drive for results is what's actually needed right now."* This kind of coaching would be powerful for genuine 2nd-tier profiles but confusing for 1st-tier users.

**Proposed Changes:**
1. **Tier detection** in the strategy merger: Add a `tier` property based on whether Yellow or Turquoise rank in the top 2 dominant levels.
2. **Meta-reflective coaching mode** for 2nd-tier profiles: Allow the coaching prompt to explicitly reference multiple value systems and invite the user to hold paradoxes, rather than speaking from a single value system's perspective.
3. **Transition zone awareness** (high Green with emerging Yellow): This is where coaching matters most — Green's relativism becomes paralyzing, but 2nd-tier integration hasn't yet emerged. A specific strategy for this transition could be highly impactful.

**Caveats:**
- SD scores are derived from PVQ-21 (Schwartz values mapping), not a native SD assessment. Detecting genuine 2nd-tier development from mapped scores has limited accuracy.
- True 2nd-tier assessment typically requires more nuanced instruments or clinical observation.
- Implementation should be conservative — only activate meta-reflective mode when 2nd-tier scores are clearly dominant, not marginal.

**References:**
- Graves, C.W. (1970). *Levels of Existence: An Open System Theory of Values*
- Beck, D.E. & Cowan, C.C. (1996). *Spiral Dynamics: Mastering Values, Leadership, and Change*
- [spiraldynamics-integral.de](https://spiraldynamics-integral.de/) — German-language SDi platform (CHE D·A·CH)
- Laloux, F. (2014). *Reinventing Organizations* (builds on SDi framework)

**Priority:** Low (research/exploration phase)
**Complexity:** Medium — requires changes to `dpcStrategies.js`, `dpcStrategyMerger.js`, and `dynamicPromptController.js`
**Dependencies:** None (additive enhancement to existing DPC system)
