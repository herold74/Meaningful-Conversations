# Meaningful Conversations

This is an AI-powered coaching application designed to facilitate self-reflection and personal growth. It provides access to several coaching bot characters with different perspectives and coaching styles. Users can upload a "Life Context" file to personalize conversations and update it with new insights after each session.

## Key Features

-   **Multiple AI Coaches**: Choose from a variety of coaches, each with a unique methodology (e.g., Stoicism, CBT, Strategic Thinking).
-   **Personalized Context**: Upload a Markdown (`.md`) file to give your coach long-term memory about your goals and challenges.
-   **Session Analysis**: At the end of a session, the AI analyzes the conversation and proposes updates to your Life Context.
-   **Flexible Data Handling**: Choose your privacy level. **Register an account** for automatic progress saving, or use **Guest Mode** for maximum privacy by manually managing your context file each session.
-   **Gamification**: An XP and achievement system to encourage consistent self-reflection.
-   **Bilingual Support**: Fully functional in both English and German.
-   **Voice Mode**: Engage in spoken conversations with your coach using your browser's built-in text-to-speech and speech-to-text capabilities.
-   **Privacy-Focused**: Guest mode ensures no data is stored persistently by the application. All processing happens in-memory.

---

## Data & Privacy Model

This application offers two distinct modes for managing user data, prioritizing user choice and privacy.

-   **Registered User Mode (Automatic Handling)**:
    -   Users can create an account and log in.
    -   The `lifeContext` file and gamification progress are automatically saved to their profile.
    -   This allows for a seamless experience across multiple sessions and devices without needing to manually handle files.

-   **Guest Mode (Manual Handling & Maximum Privacy)**:
    -   Users can choose to "Continue as Guest" to use the application without creating an account.
    -   In this mode, **no data is stored on any server or in the browser's persistent storage between sessions**.
    -   The user must **upload** their `lifeContext` file at the beginning of each session.
    -   At the end of the session, they must **download** the updated file to save their progress for future use.
    -   This mode ensures that the user has full, exclusive control over their data, which never leaves their possession except for in-memory processing during the active session.

-   **Switching Modes**:
    -   A registered user can log out or restart to start a new session as a guest at any time.
    -   A guest can choose to register or log in from the main authentication screen.

This approach provides flexibility, allowing users to choose between the convenience of an account and the enhanced privacy of manual file management.

---

## Next Steps: Building a Production Backend with MySQL

The current `userService.ts` is a clever simulation using `localStorage`. To move this to a production-ready application, you need a secure backend server. This guide outlines how to build one using a modern stack centered around MySQL.

### Why a Backend is Necessary

1.  **Security**: Your Gemini API key and database credentials must **never** be exposed on the frontend. A backend acts as a secure proxy, keeping secrets safe on the server.
2.  **Secure Authentication**: User passwords must be securely hashed and stored in a database, not plaintext in `localStorage`.
3.  **Data Persistence & Integrity**: `localStorage` is not a real database. A proper database like MySQL provides data integrity, relationships, backups, and scalability.
4.  **Centralized Logic**: Business logic can be centralized, making the application easier to maintain and scale.

### Recommended Technology Stack

-   **Backend Runtime**: **Node.js** - It's fast, efficient, and uses JavaScript/TypeScript, allowing you to use the same language across your entire stack.
-   **Backend Framework**: **Express.js** - A minimal and flexible Node.js framework that is perfect for creating a robust API.
-   **Database**: **MySQL** - A powerful and widely-used open-source relational database.
-   **ORM (Object-Relational Mapper)**: **Prisma** - This is the key that makes database interaction a joy. It provides type-safety, an intuitive query API, and excellent support for MySQL.

---

### Step-by-Step Implementation Guide

#### Step 1: Set Up the Node.js Backend Project

Create a new directory for your backend server, separate from your frontend code.

```bash
# Create and navigate into your new backend directory
mkdir meaningful-conversations-backend
cd meaningful-conversations-backend

# Initialize a Node.js project
npm init -y

# Install core dependencies for your server
npm install express cors dotenv jsonwebtoken bcryptjs

# Install Prisma and its client
npm install prisma @prisma/client --save-dev

# Install the recommended MySQL driver
npm install mysql2

# Initialize Prisma and configure it for MySQL
npx prisma init --datasource-provider mysql
```

#### Step 2: Define and Migrate the Database Schema

1.  **Configure Connection String**: In the newly created `.env` file, set your database connection URL. Prisma generated a template for you.

    ```dotenv
    # .env
    # Example for MySQL
    DATABASE_URL="mysql://<user>:<password>@<host>:<port>/<database_name>"
    ```

2.  **Define Your Data Models**: In the `prisma/schema.prisma` file, define your `User` model. The `datasource` provider should be set to `mysql`.

    ```prisma
    // prisma/schema.prisma
    generator client {
      provider = "prisma-client-js"
    }

    datasource db {
      provider = "mysql"
      url      = env("DATABASE_URL")
    }

    model User {
      id                String    @id @default(cuid())
      email             String    @unique
      passwordHash      String
      isBetaTester      Boolean   @default(false)
      lifeContext       String?   @db.Text
      gamificationState String    @db.Text
      createdAt         DateTime  @default(now())
      updatedAt         DateTime  @updatedAt
    }
    ```
    *Note: We use `@db.Text` to ensure the `lifeContext` and `gamificationState` fields can store long strings without truncation.*

3.  **Run the Migration**: Execute the following command to create a SQL migration file and apply the schema to your MySQL database. Prisma generates the SQL for you.
    ```bash
    npx prisma migrate dev --name init
    ```

#### Step 3: Build the API Endpoints with Express

Now, create the Express server and the API routes to handle the logic that `userService.ts` currently simulates.

**Example: `server.js` (Main Backend File)**
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors()); // Allow requests from your frontend
app.use(express.json()); // Parse JSON bodies

// --- Import and use your routes here ---
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/data', require('./routes/data'));
// app.use('/api/gemini', require('./routes/gemini'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Example: `/routes/auth.js` (User Registration)**
```javascript
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10); // Hash the password

    try {
        const user = await prisma.user.create({
            data: { 
                email, 
                passwordHash, 
                // Use the same initial state as the frontend
                gamificationState: "0;1;0;0;-1;1;0" 
            }
        });
        // Sign and return a JWT for the new session
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(201).json({ token, user: { email: user.email } });
    } catch (error) {
        // Handle cases where the user already exists
        res.status(400).json({ error: "User already exists." });
    }
});

// ... you would also create a /login endpoint here ...

module.exports = router;
```

#### Step 4: Refactor Frontend Services to Use the API

Finally, update the frontend services (`userService.ts` and `geminiService.ts`) to call your new backend API instead of `localStorage`.

**Example: `userService.ts` Refactor**

**BEFORE:**
```typescript
export const saveUserData = (email: string, data: Partial<UserData>) => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (userIndex !== -1) {
        // ... logic to update localStorage ...
        setUsers(users);
    }
};
```

**AFTER:**
```typescript
const API_BASE_URL = 'http://localhost:3001/api'; // Your backend URL

export const saveUserData = async (data: Partial<UserData>) => {
    const token = localStorage.getItem('authToken'); // Get the JWT you saved after login
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/data`, { // Your new endpoint
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Send the token for authentication
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to save user data');
        }
    } catch (error) {
        console.error("Error saving user data:", error);
    }
};
```

You would apply this pattern to `login`, `register`, and all Gemini-related functions, transforming them into `fetch` calls to your secure backend endpoints.

---

### Development Workflow: Running the Full-Stack Application Locally

A common point of confusion is how to manage the different "servers" (the database, the backend, and the frontend).

**Q: Do I need to start the database like the backend server every time before the frontend is tested?**

**A: No, you do not.** The database and the backend server have different lifecycles.

-   **The Database Server (MySQL on Podman):** Think of this as a refrigerator. You plug it in once, and it runs continuously in the background. The `podman run ...` command you used included a `-d` (detached) flag, which makes it run persistently. It will stay running even if you close your terminal, and will often restart automatically when you reboot your computer. You only need to manually start it if it has been explicitly stopped.

-   **The Backend Application Server (Node.js):** Think of this as the chef. The chef only comes to work when you are ready to start coding. You bring the chef in by running `npm start`. The chef needs the refrigerator (the database) to be running to do their job. When you're done, the chef goes home (`Ctrl+C`), but the refrigerator stays on.

#### Daily Workflow Steps

1.  **(Optional) Check if the Database is Running:** Open a terminal and run `podman ps`. If you see `mysql_server_podman` in the list, you're good to go! If not, start it with `podman start mysql_server_podman`. You usually only need to do this after restarting your computer.

2.  **Start the Backend Server:** Open a terminal, navigate to the `meaningful-conversations-backend` directory, and run:
    ```bash
    npm start
    ```
    Leave this terminal running.

3.  **Start the Frontend:** Open the `frontend` project in AI Studio and click the **Run** button.

#### Useful Podman Commands

-   `podman ps`: See all currently running containers.
-   `podman start mysql_server_podman`: Start your existing (stopped) container.
-   `podman stop mysql_server_podman`: Stop the running container.
-   `podman logs mysql_server_podman`: View the logs from the database container if you suspect an issue.

---

### Appendix: `.env` File Content

If you are having trouble creating the `.env` file, copy the entire block below and paste it into a new file named `.env` inside your `meaningful-conversations-backend` directory.

**IMPORTANT:** After pasting, you must replace the placeholder values for `DATABASE_URL` and `API_KEY` with your own personal credentials.

```dotenv
# .env file content starts here

# --- Database Connection ---
# Replace the placeholders <user>, <password>, <host>, <port>, and <database_name>
# with your actual MySQL database credentials.
# The `?allowPublicKeyRetrieval=true` is often necessary for local MySQL 8+ connections.
DATABASE_URL="mysql://<user>:<password>@<host>:<port>/<database_name>?allowPublicKeyRetrieval=true"

# --- Gemini API Key ---
# Paste your API key from Google AI Studio here.
API_KEY=""

# --- JWT Secret for Authentication ---
# This is a randomly generated secret for signing login tokens.
# There is no need to change this value.
JWT_SECRET="a_very_secure_and_random_string_for_jwt_!@#$1234_CHANGE_ME_IF_YOU_WANT_BUT_NO_NEED"

# --- Server Port ---
PORT=3001

# .env file content ends here
```
