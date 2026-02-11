# User Types and Feature Access Matrix

This document outlines the different user types within the Meaningful Conversations application and their respective access levels to features, bots, and data storage.

## User Types

1.  **Guest (Gast)**: Unregistered users who can try out the application with limited features. Data is stored locally in the browser.
2.  **Registered User (Registrierter Nutzer)**: Users who have created an account. They benefit from cloud synchronization and E2EE storage but have limited bot access unless they upgrade.
3.  **Premium User (Premium Nutzer)**: Registered users with an active subscription or a redeemed access pass. They have full access to all bots (except Rob & Victor) and advanced features including DPFL.
4.  **Client (Klient)**: Registered users who have been granted access to specific advanced coaches (Rob, Victor) and have full access to all bots and DPFL.
5.  **Admin**: Administrators with access to the backend management panel.
6.  **Developer**: Technical staff with access to debugging tools and the Test Runner.

## Feature Access Matrix

| Feature / Resource | Guest | Registered User | Premium User | Client | Admin | Developer |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Core Functions** | | | | | |
| Chat Interface | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Voice Mode (Web Speech API) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Server TTS (High Quality) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Life Context (Markdown) | ✅ (Local) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) |
| Personality Profile (OCEAN) | ❌ | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) |
| Personality Profile (Riemann & SD) | ❌ | ❌ | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) |
| PEP Solution Blockages (Dr. Bohne) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Narrative Profile (Signature) | ❌ | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) | ✅ (Cloud E2EE) |
| Data Persistence | ⚠️ Browser Storage | ✅ Cloud Database | ✅ Cloud Database | ✅ Cloud Database | ✅ Cloud Database | ✅ Cloud Database |
| Sync across devices | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Coaching Bots** | | | | | |
| **Gloria** (Onboarding) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Max** (Ambitious) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Ava** (Strategic) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Nobody** (GPS/Efficient) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Kenji** (Stoic) | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Chloe** (Structured Reflection) | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Rob** (Mental Fitness) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Victor** (Systemic) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Advanced Features** | | | | | |
| DPC (Dynamic Prompt Composition) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| DPFL (Adaptive Learning) | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Crisis Response (Helplines) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Comfort Check (DPFL) | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Calendar Export (.ics) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| PDF Export (Profile) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gamification (XP, Levels) | ✅ (Local) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Administration** | | | | | |
| Admin Panel Access | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Upgrade Code Generation | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| API Usage Monitoring | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Test Runner | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### Notes on Data Storage

*   **Guest:** All data (Life Context, Chat History, Settings) is stored in the browser's `localStorage`. Clearing browser data results in data loss.
*   **Registered/Premium/Admin:** Life Context and Personality Profiles are encrypted client-side (E2EE) before being sent to the server. The server (and Admins) cannot read this content.

### Notes on Crisis Response

*   **All bots** include a Crisis Detection & Response Protocol in their system prompts. When a user expresses signs of emotional crisis (suicidal thoughts, extreme hopelessness, self-harm), the bot follows a two-step verification process and then provides crisis helpline numbers and a referral to manualmode.at for professional human coaching support. This safety feature is active for **all user types**, including guests.

### Notes on DPFL (Dynamic Prompt & Feedback Learning)

*   DPFL requires a persistent history of session analyses to "learn" and adapt the coaching style. Therefore, it is only fully effective for registered users where this history is securely stored and synchronized.
