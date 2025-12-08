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
2.  **Decrypt:** Client decrypts data locally.
3.  **Chat:** Client sends current context + user message to Backend.
4.  **Process:** Backend augments prompt with context -> Sends to Gemini -> Returns response.
5.  **Update:** Gemini proposes context changes -> Frontend diffs changes -> User approves -> Client encrypts new state -> Sends to Backend (or downloads file).

