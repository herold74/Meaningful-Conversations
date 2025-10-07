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
    *   React 19 (using modern ESM modules and import maps)
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

Follow the steps below to set up and run the application locally.

### 1. Backend Setup

The backend server is required for the frontend to function. Please follow the detailed setup instructions in the backend's README file:

**➡️ [`meaningful-conversations-backend/README.md`](./meaningful-conversations-backend/README.md)**

### 2. Frontend Setup

The frontend is a modern React application that runs directly in the browser without a build step, thanks to import maps.

1.  **Ensure the backend is running** and accessible (typically at `http://localhost:3001`).

2.  **Configure the API endpoint**:
    *   Open the `services/api.ts` file.
    *   Ensure the `EXTERNALLY_HOSTED_BACKEND_URL` constant is either empty or points to your running backend instance. For local development, leaving it empty will cause the app to default to `http://localhost:3001`.

3.  **Serve the frontend**:
    *   From the project's **root directory**, use a simple static file server. The `serve` package is a good option.
    ```bash
    # If you don't have 'serve' installed globally:
    npx serve .

    # If you have it installed globally:
    serve .
    ```

4.  **Open the application**:
    *   Open your browser to the address provided by the static server (e.g., `http://localhost:3000`).

## 🧠 Key Concepts

*   **Life Context File**: A markdown (`.md`) file that serves as your personal journal and the AI's memory. It's structured with headings to store your goals, challenges, and progress. A well-structured file leads to better coaching insights.

*   **Session Flow**:
    1.  **Start**: Create a new Life Context file via a guided questionnaire or upload an existing one.
    2.  **Coach**: Select a coach whose style matches your current needs.
    3.  **Converse**: Chat with your coach via text or voice.
    4.  **Review**: End the session to receive an AI-generated summary, actionable next steps, and proposed updates to your Life Context file.
    5.  **Update**: Review the proposed changes, make manual edits if needed, and save (for registered users) or download your updated file for the next session.

*   **Privacy & E2EE**: Privacy is a core design principle. In guest mode, nothing is stored on the server. For registered users, the Life Context is encrypted *before* it leaves your browser and can only be decrypted by you. **This means if you forget your password, your data is permanently irrecoverable.**

## ☁️ Deployment

*   **Backend**: The backend is designed for deployment on Google Cloud Run with a Cloud SQL instance. See the [backend README](./meaningful-conversations-backend/README.md) for more details.
*   **Frontend**: The frontend is a static application and can be deployed to any static hosting service (e.g., Firebase Hosting, Vercel, Netlify, or Google Cloud Storage).
