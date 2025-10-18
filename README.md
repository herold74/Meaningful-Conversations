# Meaningful Conversations

An application that provides access to several coaching bot characters with different perspectives and coaching styles. Users can create a "life context" file to personalize conversations and update it with new insights after each session.

The fundamental idea of using an .md file to preserve and update information in a structured way using AI was inspired by Chris Lovejoy (https://github.com/chris-lovejoy/personal-ai-coach). This method is very similar to human note-taking during a coaching process, but provides the benefit of creating the summary for the client instantly for further reflections. Meaningful conversations adds the graphical UI, and a reliable non-destructive process of updating the .md file using AI.

Programming was performed entirely using Google AI Studio. Therefore, the application was "composed" using Gemini PRO.

The intellectual achievement of the publisher thus lies in defining and compiling the functions, the user experience and all considerations regarding real-world implementation in compliance with the legal framework and data security requirements relating to the handling of personal data in the coaching process.

According to the rules and regulations of AI Studio his project is licensed under the Apache Licence 2.0

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

This project has two main parts: a **frontend** (the user interface in your browser) and a **backend** (the server that powers it). You need to run both in separate terminals.

### 1. Backend Setup

The backend server is required for the frontend to function. Please follow the detailed setup instructions in the backend's README file to install its dependencies, configure your `.env` file, and set up the database.

**➡️ [`meaningful-conversations-backend/README.md`](./meaningful-conversations-backend/README.md)**

### 2. Frontend Setup

The frontend is a modern React application that runs directly in the browser without a build step.

1.  **Serve the frontend files**:
    *   **Important:** Make sure you are in the project's **root directory** (`Meaningful-Conversations-Project`), *not* the `meaningful-conversations-backend` subfolder.
    *   Use a simple static file server. The `serve` package is a good option.
    ```bash
    # If you don't have 'serve' installed globally:
    npx serve .

    # If you have it installed globally:
    serve .
    ```

2.  **Open the application**:
    *   Your terminal will show a local URL, typically `http://localhost:3000`. Open this in your browser. This is the **frontend** application.

## ⚙️ Development Workflow: Local vs. Cloud

It's important to understand the two ways you will run the backend.

### Local Development (Your Machine)

This is what you do when writing and testing code. You will need **two separate terminals**.

#### **Terminal 1 (Backend):**

1.  Navigate into the backend folder and start the server. This will run on port **3001**.
    ```bash
    cd meaningful-conversations-backend
    npm run dev
    ```

#### **Terminal 2 (Frontend):**

1.  Navigate to the **project root folder** and start the frontend server. This will run on port **3000**.
    ```bash
    # If you are in the backend folder from the previous step, go back up:
    cd ..

    # Now serve the files from the root folder:
    npx serve .
    ```

#### **Testing in Your Browser:**

Open your frontend at `http://localhost:3000`. It will **automatically connect** to your local backend server running on `localhost:3001`.

### Cloud Deployment (Google Cloud Run)

This is what you do when you are ready to publish your changes to a staging or production environment on the internet.

1.  **Package and Deploy**: Follow the instructions in the **[`deployment_guide.md`](./deployment_guide.md)** to build your backend into a container and deploy it to a service like Google Cloud Run.
2.  **Test the Deployed Backend**: To test your local frontend against a deployed "staging" backend, use the `?backend=staging` parameter:
    *   **URL**: `http://localhost:3000/?backend=staging`

> **CRITICAL:** Google Cloud Run assigns a unique URL to each service. Before testing a deployed backend, you **must** find this URL in your Google Cloud dashboard and ensure it matches the hardcoded URL in the `services/api.ts` file. If they do not match, you will get a network connection error.

## 🧠 Key Concepts

*   **Life Context File**: A markdown (`.md`) file that serves as your personal journal and the AI's memory. It's structured with headings to store your goals, challenges, and progress. A well-structured file leads to better coaching insights.

*   **Session Flow**:
    1.  **Start**: Create a new Life Context file via a guided questionnaire or upload an existing one.
    2.  **Coach**: Select a coach whose style matches your current needs.
    3.  **Converse**: Chat with your coach via text or voice.
    4.  **Review**: End the session to receive an AI-generated summary, actionable next steps, and proposed updates to your Life Context file.
    5.  **Update**: Review the proposed changes, make manual edits if needed, and save (for registered users) or download your updated file for the next session.

*   **Privacy & E2EE**: Privacy is a core design principle. In guest mode, nothing is stored on the server. For registered users, the Life Context is encrypted *before* it leaves your browser and can only be decrypted by you. **This means if you forget your password, your data is permanently irrecoverable.**
