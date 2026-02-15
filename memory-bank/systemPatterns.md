# System Patterns

## Architecture Overview
The project follows a **Monorepo** structure containing a Single Page Application (SPA) frontend and a RESTful API backend.

### Frontend (`/`)
- **Framework:** React 18 with Vite.
- **Language:** TypeScript.
- **State Management:** React Context (Localization, likely Auth/User state).
- **Styling:** Tailwind CSS.
- **Key Libraries:**
    - `react-markdown`: For rendering the Life Context and chat.
    - `diff`: For visualizing proposed changes to the Life Context.
    - Web Speech API: For TTS and STT.
    - Web Crypto API: For client-side E2EE.

### Backend (`/meaningful-conversations-backend`)
- **Runtime:** Node.js.
- **Framework:** Express.js.
- **Database:** MySQL (accessed via Prisma ORM).
- **Authentication:** JWT (JSON Web Tokens).
- **AI Integration:** Google Gemini API (`@google/genai`).
- **External Services:** Mailjet (Email), PayPal (Payments/Donations).

## Key Technical Decisions

### 1. The Life Context File (`.md`)
- **Decision:** Use a plain text Markdown file as the primary data store for user context.
- **Reasoning:** Portability, human-readability, and ease of editing. It avoids complex database schemas for variable user data and allows users to own their data fully.
- **Implementation:** The frontend parses this file. For registered users, it's encrypted and stored as a blob/text in the DB.

### 2. End-to-End Encryption (E2EE)
- **Decision:** Client-side encryption for Life Context.
- **Reasoning:** Privacy is paramount. Even the platform admins should not see the user's personal reflections.
- **Mechanism:** AES-GCM encryption using a key derived from the user's password (PBKDF2).

### 3. AI Proxying
- **Decision:** Backend proxies all calls to Google Gemini.
- **Reasoning:** Hides the API key from the client. Allows for rate limiting and usage tracking. Enforces policy (e.g., context injection).

### 4. Hybrid Storage (Guest vs. Registered)
- **Guest:** LocalStorage / In-memory. File download/upload required for persistence.
- **Registered:** MySQL database stores the encrypted blob. Syncs across devices.

## Data Flow
1.  **Load:** Frontend fetches encrypted data (Registered) or reads file input (Guest).
2.  **Decrypt:** Client decrypts Life Context and Personality Profile locally.
3.  **Chat:** Client sends context + personality profile + user message to Backend.
4.  **Process:** Backend builds dynamic prompt (DPC/DPFL) -> Sends to Gemini -> Returns response.
5.  **TTS:** Response is spoken via Server TTS (Piper) or Local TTS (Web Speech API fallback).
6.  **Update:** AI proposes context changes -> Frontend shows diff -> User approves -> Client encrypts -> Backend stores.
7.  **DPFL (Optional):** Session behavior logged -> Profile refinement suggestions -> User approves adjustments.

### 8. Backend Scaling & Process Management
- **Decision:** Use PM2 for Node.js process management.
- **Reasoning:** Node.js is single-threaded. PM2 allows utilizing multi-core systems via "Cluster Mode" without changing code. It also provides automatic restarts on crash.
- **Implementation:** `ecosystem.config.js` defines 2 instances. Docker container runs `pm2-runtime`.

## Key Technical Decisions (Recent)

### 5. Hybrid TTS Architecture
- **Decision:** Separate TTS container with Piper, plus local Web Speech API fallback.
- **Reasoning:** High-quality server voices for desktop, reliable local fallback for mobile/iOS.
- **Implementation:** TTS container on port 8082, frontend auto-detects availability.

### 6. iOS Audio Handling
- **Decision:** Force local TTS on iOS, play silent audio after mic use.
- **Reasoning:** iOS autoplay restrictions prevent server TTS; "playAndRecord" mode degrades quality.
- **Implementation:** Silent WAV playback, MediaSession management in ChatView.tsx.

### 7. Personality Profile E2EE
- **Decision:** Encrypt personality data with same key as Life Context.
- **Reasoning:** Same privacy guarantees for sensitive psychological data.
- **Implementation:** Client-side encryption in personalityEncryption.ts.

### 9. Reproducible Docker Builds
- **Decision:** Use `npm ci` in all Dockerfiles, never `npm install`.
- **Reasoning:** `npm install` can resolve semver ranges to newer versions than tested locally. A breaking validation change in express-rate-limit (`^8.2.1` resolved to a newer 8.x) crashed the staging backend with `ERR_ERL_KEY_GEN_IPV6`. `npm ci` strictly follows `package-lock.json`.
- **Implementation:** All Dockerfiles use `npm ci`. Lockfiles are committed and are the source of truth for production builds. Local development continues to use `npm install` for flexibility.

### 10. Bot Type Distinction: Coaches vs. Interviewers
- **Decision:** Separate bot types with different end-session flows and UI treatment.
- **Reasoning:** Coaching bots (Nobody, Max, Ava, Kenji, Chloe, Rob) produce session analyses with Life Context updates. Interview bots (Gloria Life Context, Gloria Interview) produce specialized outputs (Life Context file or interview transcript). Each type needs a distinct post-session view.
- **Implementation:**
  - `handleEndSession` in `App.tsx` checks `selectedBot.id` and routes to the appropriate view.
  - `gloria-life-context`: Hidden from bot selection, routes to `sessionReview` with generated Life Context.
  - `gloria-interview`: Visible in bot selection (registered tier), routes to `interviewTranscript` view with AI-generated summary + corrected transcript.
  - Interview bots have no DPC/DPFL integration — coaching badge suppressed in `BotSelection.tsx`.
  - Bot IDs use clear prefixes (`gloria-life-context`, `gloria-interview`) to prevent confusion during future changes.

### 11. Tiered User Access Control
- **Decision:** Six-tier role system: Guest, Registered, Premium, Client, Admin, Developer.
- **Reasoning:** Fine-grained access control for different feature sets and pricing tiers. Developer role separates test infrastructure access from general admin capabilities.
- **Implementation:** Boolean flags on User model (`isPremium`, `isClient`, `isAdmin`, `isDeveloper`). Server-side enforcement in route handlers. Frontend gating via `currentUser` flags. Access matrix documented in `DOCUMENTATION/USER-ACCESS-MATRIX.md`.

