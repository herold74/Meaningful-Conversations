# Technology Context

## Development Environment
- **Package Manager:** `npm`
- **Monorepo:** Root holds frontend, `meaningful-conversations-backend` holds backend.
- **Languages:** TypeScript (Frontend), JavaScript (Backend).

## Frontend Stack
- **Build Tool:** Vite
- **Core:** React 18, TypeScript
- **Styling:** Tailwind CSS, PostCSS
- **Routing:** React Router (inferred from standard patterns, to be verified)
- **Crypto:** Native Web Crypto API (SubtleCrypto)
- **Voice:** Native Web Speech API (SpeechRecognition, SpeechSynthesis)
- **Utilities:**
    - `diff`: Text diffing.
    - `ics`: Calendar generation.

## Backend Stack
- **Runtime:** Node.js v22.x
- **Framework:** Express
- **ORM:** Prisma
- **Database:** MySQL
- **AI:** Google Generative AI SDK (`@google/genai`)
- **Auth:** `jsonwebtoken`, `bcrypt` (likely)
- **Email:** `node-mailjet`

## Infrastructure & Deployment
- **Containerization:** Docker / Podman
- **Cloud Provider:** Google Cloud Platform (Cloud Run, Cloud SQL) proposed.
- **CI/CD:** Scripts provided (`deploy-manualmode.sh`, `validate-pwa.sh`).

## External Services
- **Google Gemini:** LLM provider.
- **Mailjet:** Transactional emails (verification, resets).
- **PayPal:** Webhook integration for payments.

## Configuration
- **Frontend:** `.env` files (`VITE_BACKEND_URL_*`).
- **Backend:** `.env` file (`DATABASE_URL`, `API_KEY`, `JWT_SECRET`, etc.).

