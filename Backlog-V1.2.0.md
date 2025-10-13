# Product Backlog - V1.2.0

This document outlines the features and user stories planned for the v1.2.0 release of the Meaningful Conversations application.

---

## Epic: Bot Profile Management in Admin UI

**As an** Administrator,
**I want** to create, edit, and manage AI coach profiles (bots) directly from a dedicated section within the Admin Console,
**So that** I can dynamically update coach personas, add new coaches, and modify system prompts without requiring code changes or a new application deployment.

### User Stories

---

#### Story 1: Data Model & Migration

**As a** Developer,
**I want** to migrate bot definitions from the static `constants.js` file to a new `Bot` table in the database,
**So that** coach profiles can be stored, retrieved, and managed dynamically.

**Acceptance Criteria:**
*   A new `Bot` model is defined in the `prisma/schema.prisma` file.
*   The model includes fields for `id`, `name`, `description` (EN/DE), `avatar`, `style` (EN/DE), `accessTier`, `systemPrompt` (EN/DE), and an `isActive` boolean flag.
*   A one-time data migration script is created and executed to transfer all existing bot definitions from `constants.js` into the new `Bot` table.
*   After successful migration, the `constants.js` file is removed from the backend codebase.

---

#### Story 2: Update Public API Endpoints

**As a** Developer,
**I want** to refactor the existing public API endpoints to source bot data from the database,
**So that** the user-facing application seamlessly uses the new dynamic bot profiles.

**Acceptance Criteria:**
*   The `GET /api/bots` endpoint is updated to query the `Bot` table instead of reading from the constants file.
*   This endpoint continues to **exclude** the sensitive `systemPrompt` fields from its public response.
*   The `POST /api/gemini/chat/send-message` endpoint is updated to retrieve the correct `systemPrompt` for the selected bot from the database at the start of a session.
*   The end-user experience in the main application (bot selection, chat) remains unchanged and fully functional.

---

#### Story 3: Implement Secure Admin CRUD Endpoints

**As an** Administrator,
**I want** a set of secure backend API endpoints to perform Create, Read, Update, and Delete (CRUD) operations on bot profiles,
**So that** I have the necessary server-side functionality to manage the bots from the Admin Console.

**Acceptance Criteria:**
*   A new route file is created for `/api/admin/bots`.
*   All endpoints within this new route are protected by the `adminAuthMiddleware` to ensure only administrators can access them.
*   `GET /api/admin/bots`: An endpoint is created that returns a **complete list of all bots**, including their sensitive `systemPrompt` data for editing purposes.
*   `POST /api/admin/bots`: An endpoint is created to add a new bot to the database.
*   `PUT /api/admin/bots/:id`: An endpoint is created to update an existing bot by its ID.
*   `DELETE /api/admin/bots/:id`: An endpoint is created to delete a bot by its ID.

---

#### Story 4: Build Bot Management UI in Admin Console

**As an** Administrator,
**I want** a "Bot Management" section in the Admin Console that displays all available bots,
**So that** I can get an overview and initiate management actions like creating, editing, or deleting a coach.

**Acceptance Criteria:**
*   A new "Bot Management" tab is added to the `AdminView` component.
*   This tab fetches data from the `GET /api/admin/bots` endpoint and displays the bots in a list or table.
*   The table shows key information for each bot, such as Name, Access Tier, and Active Status.
*   Each bot in the table has an "Edit" button and a "Delete" button.
*   A prominent "Create New Bot" button is available on the page.

---

#### Story 5: Build Bot Editor Form

**As an** Administrator,
**I want** a comprehensive form to create a new bot or edit an existing one,
**So that** I can modify all attributes of a coach, including their detailed system prompts.

**Acceptance Criteria:**
*   Clicking the "Create New Bot" or an "Edit" button opens a form view or modal.
*   The form contains input fields for all bot properties: name, descriptions (EN/DE), avatar URL, styles (EN/DE), access tier (`select` dropdown), and an `isActive` toggle/checkbox.
*   The form includes two large `<textarea>` elements for the English and German system prompts to accommodate long text.
*   When editing, the form is pre-populated with the data of the selected bot.
*   Submitting the form triggers the correct API call (`POST` for create, `PUT` for update).
*   After a successful submission, the user is returned to the main bot list, which reflects the changes.
*   The "Delete" button functionality includes a confirmation dialog (e.g., "Are you sure you want to delete this bot?") to prevent accidental data loss.

---

## Epic: Flexible Context Templates

**As a** User,
**I want** to work with different types of documents beyond the standard "Life Context" file, such as project plans, status reports, or creative briefs,
**So that** I can leverage the AI discussion and analysis for a wider range of professional and personal use cases.

### User Stories

---

#### Story 6: Introduce Document Type Selection

**As a** User,
**I want** to choose the type of document I'm working with when I start a new session, or have the system adapt to the structure of a file I upload,
**So that** the coaching and analysis are relevant to the specific context of my work (e.g., project management vs. personal growth).

**Acceptance Criteria:**
*   The landing page is updated to either offer a choice of templates (e.g., "Life Context", "Project Kick-off", "Weekly Status Report") or a more generic "Upload Document" option.
*   The questionnaire flow is presented as the way to create a new "Life Context" document but is no longer the only path to starting a session.
*   The system can accept an arbitrary Markdown file and use its existing headlines for the session review process.
*   The backend `analyzeSession` prompt is made more generic. It should be able to analyze a conversation against *any* provided context document and propose updates based on the document's existing structure, rather than assuming fixed sections like "Goals" or "Challenges".
*   The `SessionReview` component dynamically displays the headlines from the uploaded document, not a hardcoded list.
