# Local Development Setup Guide

Complete guide to set up the Meaningful Conversations project from scratch on your local machine.

## 📋 Prerequisites

### Required Software
- **Node.js** >= 22.0.0 ([Download](https://nodejs.org/))
- **npm** >= 10.x (comes with Node.js)
- **MySQL 8.0+** or **MariaDB 11.2+** ([Download MySQL](https://dev.mysql.com/downloads/) or [Download MariaDB](https://mariadb.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))

### Recommended
- **VS Code** or **Cursor** (with recommended extensions)
- **Postman** or similar API testing tool
- **MySQL Workbench** or **DBeaver** for database management

### Required Accounts & Keys
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/app/apikey))
- **Mistral API Key** (optional, [Get one here](https://console.mistral.ai/))
- **Mailjet Account** for email sending ([Sign up](https://www.mailjet.com/))

---

## 🚀 Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Meaningful-Conversations-Project
```

---

## 🗄️ Step 2: Database Setup

### Option A: Using MySQL

```bash
# Install MySQL (macOS with Homebrew)
brew install mysql
brew services start mysql

# Create database
mysql -u root -p
```

```sql
CREATE DATABASE meaningful_conversations_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mcdev'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON meaningful_conversations_dev.* TO 'mcdev'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Option B: Using MariaDB

```bash
# Install MariaDB (macOS with Homebrew)
brew install mariadb
brew services start mariadb

# Create database (same SQL as above)
mysql -u root -p
# (run the same CREATE DATABASE commands)
```

---

## ⚙️ Step 3: Backend Setup

### 3.1 Install Dependencies

```bash
cd meaningful-conversations-backend
npm install
```

### 3.2 Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
nano .env  # or use your preferred editor
```

**Required Environment Variables:**

```bash
# Database
DATABASE_URL="mysql://mcdev:your_secure_password@localhost:3306/meaningful_conversations_dev"

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET="your-random-jwt-secret-here"

# Google Gemini API
GOOGLE_API_KEY="your-gemini-api-key"
# GOOGLE_GENAI_MODEL is deprecated; model selection is managed via Admin Panel / Database

# Mistral API (optional)
MISTRAL_API_KEY="your-mistral-api-key-if-using"

# Mailjet (for email features)
MAILJET_API_KEY="your-mailjet-api-key"
MAILJET_SECRET_KEY="your-mailjet-secret-key"
MAILJET_SENDER_EMAIL="noreply@yourdomain.com"
# MAILJET_FROM_NAME is deprecated; sender name is configured via BRAND_SENDER_NAME or defaults

# Server Config
PORT=3001
NODE_ENV=development

# TTS Service (optional for local dev)
TTS_SERVICE_URL="http://localhost:5555"

# CORS (allow frontend origin)
ALLOWED_ORIGINS="http://localhost:5173"
```

### 3.3 Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Or for dev (creates migration if schema changed):
npx prisma migrate dev
```

**⚠️ Troubleshooting Migrations?** See [LOCAL-DEV-MIGRATIONS.md](./LOCAL-DEV-MIGRATIONS.md)

### 3.4 Seed Database (Optional)

```bash
# If you have seed data
npx prisma db seed
```

### 3.5 Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

**Backend should now be running on:** `http://localhost:3001`

**Test it:**
```bash
curl http://localhost:3001/api/health
# Expected: {"status":"ok","database":"connected"}
```

---

## 🎨 Step 4: Frontend Setup

### 4.1 Configure Frontend Environment

The frontend uses Vite's environment variable system.

**Branding & White-Labeling:**
You can override the default branding by setting `VITE_BRAND_*` variables. See [WHITE-LABEL-GUIDE.md](./WHITE-LABEL-GUIDE.md) for a full list of options.

```bash
# Create .env.local (optional - defaults work for local dev)
echo "VITE_API_URL=http://localhost:3001" > .env.local
# Example branding override:
echo "VITE_BRAND_APP_NAME=My Local App" >> .env.local
```

**Default values (no .env needed for local dev):**
- API URL: `http://localhost:3001` (auto-detected in development)
- TTS Service: `http://localhost:5555` (optional)

### 4.2 Start Frontend Dev Server

```bash
npm run dev
```

**Frontend should now be running on:** `http://localhost:5173`

Open your browser and navigate to `http://localhost:5173`

---

## 📱 Step 5: Mobile App Setup (iOS/Capacitor) - Optional

To build and run the iOS app, you need a Mac with Xcode installed.

1.  **Initialize Capacitor:**
    ```bash
    npx cap sync
    ```

2.  **Open in Xcode:**
    ```bash
    npx cap open ios
    ```

3.  **Run in Simulator:**
    - Select a simulator (e.g., iPhone 15) in Xcode.
    - Click the "Run" (Play) button.

**Note:** Native features like `native-audio` and `speech-recognition` require the app to be running in the iOS environment (Simulator or Device).

---

## 🔊 Step 6: TTS Service Setup (Optional)

The Text-to-Speech service is optional for local development. The app will fall back to browser TTS if the server isn't available.

### If you want to run TTS locally:

```bash
cd meaningful-conversations-backend/tts-service

# Install dependencies
pip install -r requirements.txt

# Download voice models
python download_voices.py

# Start TTS server
python tts_server.py
```

**TTS Service should now be running on:** `http://localhost:5555`

---

## ✅ Step 7: Verify Setup

### 7.1 Check All Services

| Service | URL | Expected Response |
|---------|-----|-------------------|
| Frontend | http://localhost:5173 | App UI loads |
| Backend Health | http://localhost:3001/api/health | `{"status":"ok","database":"connected"}` |
| TTS (optional) | http://localhost:5555/health | `{"status":"ok"}` |

### 7.2 Test Core Features

1. **Register/Login:**
   - Open http://localhost:5173
   - Register a new account or use Guest Mode
   
2. **Chat with AI:**
   - Select a bot (e.g., "Nobody")
   - Send a test message
   - Verify AI responds

3. **Database Check:**
   ```bash
   mysql -u mcdev -p meaningful_conversations_dev
   ```
   ```sql
   SELECT COUNT(*) FROM user;
   -- Should show at least 1 if you registered
   ```

---

## 🔧 Development Workflow

### Hot Reload is Enabled
- **Frontend**: Changes auto-reload via Vite HMR
- **Backend**: Changes auto-reload via nodemon (if using `npm run dev`)

### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "Prisma.prisma",
    "bradlc.vscode-tailwindcss"
  ]
}
```

### Running Tests

```bash
# Backend tests
cd meaningful-conversations-backend
npm test

# Frontend tests (if configured)
cd ..
npm test
```

---

## 🐛 Troubleshooting

### Backend won't start
- ✅ Check MySQL/MariaDB is running: `brew services list`
- ✅ Verify DATABASE_URL in `.env`
- ✅ Check port 3001 is free: `lsof -i :3001`

### Frontend won't start
- ✅ Check Node version: `node -v` (should be >= 22.0.0)
- ✅ Clear node_modules: `rm -rf node_modules && npm install`
- ✅ Check port 5173 is free: `lsof -i :5173`

### Database connection errors
- ✅ Ping database: `mysql -u mcdev -p -e "SELECT 1;"`
- ✅ Check user permissions
- ✅ See [LOCAL-DEV-MIGRATIONS.md](./LOCAL-DEV-MIGRATIONS.md) for migration issues

### AI not responding
- ✅ Check GOOGLE_GENAI_API_KEY is set correctly
- ✅ Check API quota: https://aistudio.google.com/
- ✅ Check backend logs for errors

### For more issues, see [TROUBLESHOOTING-INDEX.md](./TROUBLESHOOTING-INDEX.md)

---

## 📂 Project Structure

```
Meaningful-Conversations-Project/
├── src/                          # Frontend React app
│   ├── components/              # React components
│   ├── services/                # API clients
│   └── ...
├── meaningful-conversations-backend/
│   ├── routes/                  # Express routes
│   ├── services/                # Business logic
│   ├── prisma/                  # Database schema & migrations
│   │   ├── schema.prisma       # Database schema
│   │   └── migrations/         # Migration history
│   ├── tts-service/            # Python TTS server (optional)
│   └── server.js               # Entry point
├── public/                      # Static assets
├── DOCUMENTATION/              # Project documentation
└── package.json                # Frontend dependencies
```

---

## 🎯 Next Steps

After setup:

1. **Read the docs:**
   - [DOCUMENTATION-STRUCTURE.md](./DOCUMENTATION/DOCUMENTATION-STRUCTURE.md) - Overview of all documentation
   - [deployment.mdc](./.cursor/rules/deployment.mdc) - Deployment workflow
   
2. **Explore features:**
   - Try different bots
   - Create a Life Context file
   - Test voice mode (requires HTTPS or localhost)

3. **Make changes:**
   - See [DOCUMENTATION/VERSION-MANAGEMENT.md](./DOCUMENTATION/VERSION-MANAGEMENT.md) for versioning
   - See [LOCAL-DEV-MIGRATIONS.md](./LOCAL-DEV-MIGRATIONS.md) for database changes

4. **Deploy:**
   - See [DEPLOYMENT-CHECKLIST.md](./DOCUMENTATION/DEPLOYMENT-CHECKLIST.md) for deployment procedures

---

## 🆘 Getting Help

- **Database issues:** [LOCAL-DEV-MIGRATIONS.md](./LOCAL-DEV-MIGRATIONS.md)
- **General troubleshooting:** [TROUBLESHOOTING-INDEX.md](./TROUBLESHOOTING-INDEX.md)
- **Deployment questions:** [DEPLOYMENT-CHECKLIST.md](./DOCUMENTATION/DEPLOYMENT-CHECKLIST.md)
- **Feature documentation:** [DOCUMENTATION-STRUCTURE.md](./DOCUMENTATION/DOCUMENTATION-STRUCTURE.md)

---

**Last Updated:** February 27, 2026
**Tested With:** Node.js 22.x, MySQL 8.0, MariaDB 11.2
