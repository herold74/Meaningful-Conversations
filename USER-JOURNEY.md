# User Journey - Meaningful Conversations

This document outlines the complete user experience through the Meaningful Conversations application.

---

## 🎯 Overview

Meaningful Conversations provides AI-powered coaching through multiple specialized AI coaches, each with unique perspectives. Users maintain a "Life Context" file that serves as the AI's memory across sessions.

---

## 📱 User Journey Flow

### 1. **Landing Page** 
*First impression and authentication choice*

**Key Elements:**
- Welcome message and app description
- Three clear options:
  - 🔐 **Login** - For returning users
  - ✨ **Register** - Create a new account
  - 👤 **Continue as Guest** - Try without registration

**User Decision Point:**
- **Guest**: Data stays local, manual file management
- **Registered**: Cloud sync, automatic encryption, cross-device access

**Screenshot Checklist:**
- [ ] Full landing page view
- [ ] Mobile responsive view

---

### 2. **Registration Flow** (For New Users)
*Creating an account with E2E encryption*

**Steps:**
1. Enter email and password
2. Accept terms and privacy policy
3. Receive verification email
4. Click activation link
5. Account activated - ready to use

**Key Security Feature:**
- Password is used to generate encryption key
- **Important**: Lost password = lost data (by design)

**Screenshot Checklist:**
- [ ] Registration form
- [ ] Email verification pending screen
- [ ] Email verification success

---

### 3. **Login Flow** (For Returning Users)
*Secure authentication*

**Steps:**
1. Enter email and password
2. System authenticates and decrypts stored Life Context
3. Redirected to session preparation

**Additional Features:**
- Forgot password option
- Password reset flow

**Screenshot Checklist:**
- [ ] Login screen
- [ ] Forgot password screen
- [ ] Password reset confirmation

---

### 4. **Life Context Setup**
*The AI's memory foundation*

**Two Paths:**

#### Path A: Upload Existing File
- User has a `.md` file from previous session
- Drag & drop or click to upload
- Preview before starting

#### Path B: Create New File
**Option 1: Guided Interview**
- Interactive questionnaire covering:
  - Core profile (age, location, life stage)
  - Life domains (relationships, career, health, etc.)
  - Current challenges and goals
- AI generates structured Life Context file

**Option 2: Start from Template**
- Empty structured template provided
- User fills in manually
- Can edit anytime

**Screenshot Checklist:**
- [ ] Life Context choice screen
- [ ] File upload interface with drag & drop
- [ ] File preview
- [ ] Questionnaire start screen
- [ ] Sample questionnaire question
- [ ] Generated Life Context preview

---

### 5. **Bot Selection**
*Choosing your AI coach*

**Available Coaches:**
- 🧘 **Stoic Guide** - Resilience and acceptance
- 🧠 **CBT Coach** - Cognitive behavioral techniques
- ♟️ **Strategic Thinker** - Problem-solving and planning
- 💭 **Socratic Questioner** - Deep inquiry
- 🎭 **Compassionate Listener** - Empathy and validation
- 🔬 **Systems Analyst** - Patterns and interconnections

**Display:**
- Coach name and tagline
- Brief description of approach
- Access level indicator (Guest/Registered/Premium)
- Visual icon for each coach

**Screenshot Checklist:**
- [ ] Bot selection grid (desktop)
- [ ] Bot selection scroll (mobile)
- [ ] Individual bot card detail
- [ ] Premium bot with lock icon (if guest)

---

### 6. **Chat Session**
*The core coaching experience*

**Interface Elements:**

**Header:**
- Coach name and avatar
- Session timer
- Voice/Text mode toggle
- Settings menu
- End session button

**Chat Area:**
- Message history
- User messages (right, blue)
- AI responses (left, white/gray)
- Smooth scroll
- Timestamp indicators

**Input Area:**
- Text input box
- Send button
- Voice mode button (with animation when active)
- Character counter (if any limits)

**Voice Mode:**
- 🎤 Push-to-talk or continuous listening
- Visual feedback (waveform animation)
- Speech-to-text preview
- Text-to-speech for AI responses
- Voice selection (multiple options)

**Screenshot Checklist:**
- [ ] Initial greeting from AI coach
- [ ] Active conversation (3-4 exchanges)
- [ ] Voice mode active with visual indicator
- [ ] Voice selection modal
- [ ] Long conversation with scroll
- [ ] Mobile view of chat
- [ ] Landscape mode (mobile)

---

### 7. **Session Review**
*AI-generated insights and updates*

**Triggered When:** User clicks "End Session"

**Analysis Sections:**

**1. Session Summary**
- 2-4 sentence overview
- Key insights discovered
- Written in second person ("You realized...")

**2. Life Context Updates**
- AI-proposed changes to your Life Context file
- Structured as:
  - **Type**: Append, Replace Section, Create Headline
  - **Location**: Which section to modify
  - **Content**: The new/updated text
- User can:
  - ✅ Accept individual updates
  - ✏️ Edit before accepting
  - ❌ Reject updates
  - 👁️ Preview final document

**3. Next Steps**
- Concrete, actionable items
- Each with specific deadline
- User can add to calendar/reminders

**4. Blockage Analysis** (Optional)
- Visual gauge showing openness vs. blockage
- Brief explanation
- Suggestions for moving forward

**Diff Viewer:**
- Side-by-side comparison:
  - **Left**: Current Life Context
  - **Right**: Proposed changes (highlighted)
- Color coding:
  - 🟢 Green = Additions
  - 🔴 Red = Deletions
  - 🟡 Yellow = Modifications

**Screenshot Checklist:**
- [ ] Session summary screen
- [ ] Life Context updates list
- [ ] Individual update card (expanded)
- [ ] Diff viewer - side by side comparison
- [ ] Next steps with deadlines
- [ ] Blockage score gauge
- [ ] Edit update modal
- [ ] Final preview before saving

---

### 8. **Life Context Management**
*Your evolving personal document*

**For Registered Users:**
- Automatically saved (encrypted)
- View current version anytime
- Manual edit option
- Version history (future feature)
- Download as `.md` file

**For Guests:**
- Download after each session
- Must upload for next session
- No cloud storage

**Screenshot Checklist:**
- [ ] Life Context view/edit screen
- [ ] Download modal
- [ ] Save confirmation

---

### 9. **Gamification & Progress**
*Motivation through achievement*

**Gamification Bar** (Always visible at top)
- Current XP / Next Level XP
- Visual progress bar
- Level indicator
- Streak counter (🔥 fire icon)

**XP Sources:**
- Complete a session: +50 XP
- Update Life Context: +25 XP
- 7-day streak: +100 XP bonus
- First session with each coach: +30 XP

**Achievements View:**
- Grid of achievement cards
- 🔒 Locked (gray)
- ✅ Unlocked (colored + animation)
- Categories:
  - Frequency (sessions completed)
  - Consistency (streaks)
  - Exploration (tried all coaches)
  - Depth (long sessions)
  - Growth (Life Context updates)

**Achievement Examples:**
- 🎯 "First Steps" - Complete your first session
- 🔥 "Week Warrior" - 7-day streak
- 🎓 "Wise Counsel" - Try all 6 coaches
- 📈 "Growth Mindset" - 10 context updates
- 💎 "Veteran" - 50 sessions completed

**Screenshot Checklist:**
- [ ] Gamification bar at various XP levels
- [ ] Level up animation/notification
- [ ] Achievements grid overview
- [ ] Individual achievement card (locked)
- [ ] Individual achievement card (unlocked)
- [ ] Streak counter with fire icon
- [ ] XP gain notification

---

### 10. **User Profile & Settings**
*Personalization and preferences*

**Profile Information:**
- Email (registered users)
- Account creation date
- Last login
- Total sessions
- Current level & XP
- Active streaks

**Settings:**
- 🌐 Language (English/German)
- 🎨 Theme (Light/Dark)
- 🔊 Voice Preferences
  - Voice selection (multiple options)
  - Speech rate
  - Auto-play toggle
- 🔐 Security
  - Change password
  - Delete account (with warning)
- 📥 Data Management
  - Download all data
  - Export Life Context
  - View API usage (admin only)

**Screenshot Checklist:**
- [ ] Profile overview
- [ ] Settings menu
- [ ] Language selection
- [ ] Theme toggle (light mode)
- [ ] Theme toggle (dark mode)
- [ ] Voice settings
- [ ] Change password screen
- [ ] Delete account warning

---

### 11. **Admin Console** (Admin Users Only)
*System management and analytics*

**Tabs:**

**1. User Management**
- List all users
- Search and filter
- User details:
  - Email, registration date
  - Login count, last login
  - XP and level
  - Account status
- Actions:
  - Reset password
  - Grant beta tester status
  - Toggle admin rights
  - Delete user

**2. Upgrade Codes**
- Generate codes for premium coaches
- View code usage
- Deactivate codes
- Sort by date/usage

**3. Support Tickets**
- View user-reported issues
- Status: Open/In Progress/Resolved
- Priority levels
- Response interface

**4. Ratings & Feedback**
- Session ratings (1-5 stars)
- Written feedback
- Filter by coach
- Average ratings per coach
- Sentiment analysis

**5. Session Simulator**
- Test scenarios
- Run analysis without affecting user data
- Verify AI functionality

**6. API Usage** ⭐ *NEW*
- **Summary Cards:**
  - 💰 Total cost (period)
  - 📊 API calls (success/failure)
  - ⚡ Total tokens (input/output split)
  - 🕐 Avg response time
  
- **Cost Projections:**
  - 📈 Monthly forecast (based on 7-day avg)
  - Daily averages
  
- **Breakdown Tables:**
  - By Model (Flash vs Pro)
  - By Endpoint (chat, analyze, format)
  - By Bot (which coaches cost most)
  - Top 10 users by cost
  
- **Daily Usage Trend:**
  - Day-by-day breakdown
  - Scrollable history

- **Time Range Selector:**
  - Last 7/30/90 days
  - Custom date range

**Screenshot Checklist:**
- [ ] Admin console - Users tab
- [ ] User detail view
- [ ] Reset password confirmation
- [ ] Upgrade codes tab
- [ ] Generate code interface
- [ ] Support tickets tab
- [ ] Ratings & feedback tab with stats
- [ ] Session simulator
- [ ] **API Usage - Summary cards**
- [ ] **API Usage - Cost projections alert**
- [ ] **API Usage - Model breakdown table**
- [ ] **API Usage - Endpoint breakdown table**
- [ ] **API Usage - Top users table**
- [ ] **API Usage - Daily trend table**
- [ ] **API Usage - Time range selector**

---

### 12. **Mobile Responsive Views**
*Optimized for all devices*

**Key Responsive Features:**
- Collapsible navigation menu (burger menu)
- Stack layout on narrow screens
- Touch-optimized buttons
- Swipe gestures
- Bottom navigation bar (mobile)
- Responsive font sizes
- Optimized chat interface

**Screenshot Checklist:**
- [ ] Mobile landing page
- [ ] Mobile bot selection
- [ ] Mobile chat interface
- [ ] Mobile session review
- [ ] Mobile achievements
- [ ] Burger menu expanded
- [ ] Tablet view (intermediate size)

---

### 13. **Special Screens**

**About Page:**
- App description
- Feature highlights
- Technology stack
- Credits

**FAQ:**
- Common questions
- Expandable answers
- Search functionality

**User Guide:**
- Step-by-step tutorials
- Tips for effective use
- Best practices

**Terms & Privacy:**
- Legal information
- Data handling
- User rights
- GDPR compliance

**Screenshot Checklist:**
- [ ] About page
- [ ] FAQ (collapsed)
- [ ] FAQ (one expanded)
- [ ] User guide
- [ ] Terms of service
- [ ] Privacy policy

---

## 🎨 Design System Highlights

**Color Palette:**
- Primary: Blue accent
- Secondary: Purple for highlights
- Success: Green
- Warning: Orange/Yellow
- Error: Red
- Neutrals: Gray scale

**Typography:**
- Clean, readable fonts
- Proper hierarchy
- Responsive sizes

**Icons:**
- Feather icons throughout
- Consistent style
- Semantic meaning

**Animations:**
- Smooth transitions
- Loading spinners
- Success confirmations
- Level-up celebrations

---

## 📊 Key User Flows Summary

### Guest User Journey:
`Landing → Continue as Guest → Create/Upload Context → Select Coach → Chat → Review → Download File → Exit`

### New Registered User Journey:
`Landing → Register → Verify Email → Create/Upload Context → Select Coach → Chat → Review → Auto-Save → Dashboard`

### Returning User Journey:
`Landing → Login → Dashboard → Select Coach (or Continue Session) → Chat → Review → Auto-Save → Dashboard`

### Admin User Journey:
`Landing → Login → Admin Console → [Manage Users / View Analytics / Monitor API Usage] → Return to App`

---

## 🎯 Critical Moments to Capture

### High-Impact Screens:
1. ✨ First bot greeting (sets tone)
2. 💡 Session summary with insights (value demonstration)
3. 📝 Diff viewer showing changes (core feature)
4. 🎉 Achievement unlock (motivation)
5. 📊 Admin API usage dashboard (business intelligence)

### Error States:
- No internet connection
- Login failed
- Session timeout
- File upload error
- API error

### Empty States:
- No achievements yet
- No session history
- First time setup

---

## 📸 How to Capture These Screenshots

1. **Run the application locally:**
   ```bash
   npm run dev
   ```

2. **For backend features (admin, etc.):**
   ```bash
   cd meaningful-conversations-backend
   npm start
   ```

3. **Access at:**
   - Frontend: `http://localhost:5173`
   - With staging backend: `http://localhost:5173/?backend=staging`

4. **Capture screenshots:**
   - **Mac**: `Cmd + Shift + 4` (select area) or `Cmd + Shift + 3` (full screen)
   - **Windows**: `Win + Shift + S`
   - **Chrome DevTools**: Device toolbar for mobile views (`Cmd/Ctrl + Shift + M`)

5. **Recommended sizes:**
   - Desktop: 1920x1080 or 1440x900
   - Tablet: 768x1024 (iPad)
   - Mobile: 375x667 (iPhone) or 360x740 (Android)

6. **Save to:**
   ```
   /screenshots/
   ├── 01-landing/
   ├── 02-auth/
   ├── 03-context-setup/
   ├── 04-bot-selection/
   ├── 05-chat/
   ├── 06-session-review/
   ├── 07-achievements/
   ├── 08-admin/
   └── 09-mobile/
   ```

---

## 🚀 Next Steps

After capturing screenshots:
1. Create `/screenshots` directory
2. Organize images by section
3. Update `README.md` with screenshot gallery
4. Add to GitHub repository
5. Use in documentation, presentations, and marketing

---

**Last Updated**: November 6, 2024
**Version**: 1.0 with API Usage Tracking

