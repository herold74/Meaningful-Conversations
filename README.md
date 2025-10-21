# Meaningful Conversations

An application that provides access to several coaching bot characters with different perspectives and coaching styles. Users can create a "life context" file to personalize conversations and update it with new insights after each session.

![A screenshot of the bot selection screen in the Meaningful Conversations app.](https://storage.googleapis.com/aistudio-hosting/project-images/21a50a18-d7b3-4f93-b883-85b4f62136e0/readme-screenshot.png)

## ✨ Core Features

*   **Multiple AI Coaches**: Engage with a variety of AI coaches, each with a unique style (e.g., Stoic, CBT, Strategic Thinking).
*   **Persistent Memory**: Utilize a "Life Context" file (`.md`) that acts as the AI's long-term memory, enabling continuous and personalized conversations over time.
*   **Automated Context Updates**: At the end of each session, the AI analyzes the conversation and proposes updates to your Life Context file, helping you track insights and progress.
*   **Voice & Text Chat**: Interact with your coach via text or a hands-free voice conversation mode.
*   **End-to-End Encryption**: For registered users, your Life Context file is end-to-end encrypted. Only you can decrypt it on your device with your password.
*   **Gamification**: Stay motivated with a system of XP, levels, streaks, and achievements that reward regular self-reflection.
*   **Guest Mode**: Try the app without an account. Your data is processed entirely in your browser and you manage your file manually.
*   **Multi-language Support**: Available in English and German.

## 🛠️ Technology Stack

*   **Frontend**:
    *   React 18 & Vite
    *   TypeScript
    *   Tailwind CSS
    *   Web Speech API for voice features
    *   Web Crypto API for End-to-End Encryption (E2EE)
*   **Backend**:
    *   Node.js & Express.js
    *   Prisma ORM with MySQL
    *   JSON Web Tokens (JWT) for authentication
    *   Google Gemini API (`@google/genai`) for proxied chat and analysis

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