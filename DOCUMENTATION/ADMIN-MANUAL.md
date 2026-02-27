# Administrator Manual - Meaningful Conversations

This document is for administrators only and provides detailed instructions for managing the Meaningful Conversations platform through the Admin Panel.

---

## Table of Contents

1. [Accessing the Admin Panel](#1-accessing-the-admin-panel)
2. [User Management](#2-user-management)
3. [Upgrade Codes Management](#3-upgrade-codes-management)
4. [Support Tickets](#4-support-tickets)
5. [Session Feedback](#5-session-feedback)
6. [Test Runner](#6-test-runner)
7. [API Usage Monitoring](#7-api-usage-monitoring)
8. [Newsletter Management](#8-newsletter-management)
9. [Onboarding & Intent Flow (NEU v1.9.7)](#9-onboarding--intent-flow-neu-v197)
10. [In-App Purchases & RevenueCat (NEU v1.9.7)](#10-in-app-purchases--revenuecat-neu-v197)
11. [Server Administration](#11-server-administration)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Accessing the Admin Panel

### Prerequisites
- You must have an account with admin privileges (`isAdmin: true` in the database)
- Access is only available to logged-in users with the admin flag

### How to Access
1. Log into the application with your admin account
2. Open the menu (☰) in the top-left corner
3. Select **"Admin Panel"** (only visible to admins)

### Admin Panel Overview
The Admin Panel has several tabs, now with a **fully responsive design** optimized for mobile devices:
- **Users** - User management and statistics
- **Codes** - Upgrade code generation and tracking
- **Tickets** - Support ticket management
- **Feedback** - Session ratings and message reports
- **Runner** - Test scenarios for QA testing (Comprehensive Test Suite)
- **API Usage** - AI API cost monitoring

---

## 2. User Management

### User Statistics Dashboard
At the top of the Users tab, you'll see key metrics:
- **Total Users** - Total registered accounts
- **Active Users** - Users who logged in within the last 30 days
- **Premium Users** - Users with premium access (subscriptions or codes)
- **Guest Logins** - Anonymous sessions in the last 7 days (click to expand daily breakdown)

### User Table
The user list displays:
| Column | Description |
|--------|-------------|
| Email | User's email address |
| Roles | `admin`, `developer`, `client`, `premium`, or regular user |
| Created | Account creation date |
| Last Login | Most recent login timestamp |
| Logins | Total number of logins |
| XP | Gamification experience points |

### Sorting and Filtering
- Click column headers to sort (ascending/descending)
- Use the search field to filter by email address

### User Actions

#### Reset Password
1. Click the **key icon** (🔑) next to a user
2. Confirm the action in the warning dialog
3. A new random password will be generated
4. Copy the password and send it to the user securely

⚠️ **Warning**: This action cannot be undone. The user's encrypted data (Life Context, Personality Profile) will be **permanently lost** because it's encrypted with their old password.

#### Toggle Admin Status
- Click the **shield icon** (🛡️) to promote/demote admin privileges
- Admins cannot remove their own admin status

#### Toggle Premium Status
- Click the **star icon** (⭐) to grant/revoke premium access
- Premium users have access to all coaches and features

#### Delete User
- Click the **trash icon** (🗑️) to delete a user account
- This permanently removes the user and all associated data

---

## 3. Upgrade Codes Management

Upgrade codes allow users to unlock premium features without a subscription.

### Code Types

| Code Type | Description | Duration |
|-----------|-------------|----------|
| ACCESS_PASS_1M | Full premium access | 1 month |
| ACCESS_PASS_3M | Full premium access | 3 months |
| ACCESS_PASS_6M | Full premium access | 6 months |
| ACCESS_PASS_12M | Full premium access | 12 months |
| Bot-specific codes | Unlock individual premium coaches | Permanent |

### Creating Single Codes
1. Select the code type from the dropdown
2. Click **"Generate Code"**
3. The code appears in the table and can be copied

### Bulk Code Generation
1. Select the code type
2. Enter the quantity (1-100)
3. Click **"Bulk Generate"**
4. Download the CSV file for distribution

### Code Table
| Column | Description |
|--------|-------------|
| Code | The 8-character redemption code |
| Unlocks | What the code grants access to |
| Created | When the code was generated |
| Usage | Who redeemed it and when (if used) |

### Filtering Codes
- Use the search field to filter by email (for redeemed codes)
- Sort by clicking column headers

### Deleting Codes
- Click the **trash icon** to delete unused codes
- Redeemed codes cannot be deleted

---

## 4. Support Tickets

Users can submit support requests through the app. These appear in the Tickets tab.

### Ticket Information
- **Subject** - User-provided topic
- **Message** - Full ticket content
- **User** - Submitter's email (or "Guest")
- **Status** - Open or Resolved
- **Created** - Submission timestamp

### Managing Tickets
1. Click on a ticket row to expand and view the full message
2. Click **"Mark as Resolved"** when the issue is handled
3. Click **"Reopen"** if further action is needed
4. Click the **trash icon** to delete resolved tickets

---

## 5. Session Feedback

### Session Ratings
Users can rate their coaching sessions (1-5 stars) and provide comments.

| Column | Description |
|--------|-------------|
| Rating | 1-5 star rating |
| Comment | User's feedback text |
| Coach | Which bot was used |
| User | Who submitted (may be anonymous) |
| Date | When feedback was submitted |

### Message Reports
Users can report problematic bot responses. These are critical for quality assurance.

| Column | Description |
|--------|-------------|
| Reason | Why the user flagged the message |
| Coach | Which bot generated the response |
| User | Who reported it |
| Date | When reported |

Click a report row to expand and see:
- **User Prompt** - What the user said
- **Bot Response** - The problematic response

### Actions
- Delete reports after reviewing them using the **trash icon**
- Export feedback data for analysis (if needed)

---

## 6. Test Runner

The Test Runner allows administrators to run QA tests on the coaching bots.

### Test Categories

| Category | Icon | Purpose |
|----------|------|---------|
| Core | 💬 | Basic coaching functionality |
| Session | 📋 | Session flow and analysis |
| Personality | 🧑🏼‍💼 | DPC/DPFL personality integration |
| Safety | 💚 | Crisis detection and safety protocols |
| Bot | 🤖 | Bot-specific behavior validation |

### Running a Test

#### Manual Mode (Legacy)
1. Select a test scenario
2. Choose a bot to test
3. Optionally select a test profile
4. Click **"Run Test Session"** to start a chat session with that scenario

#### Dynamic Test Runner (Recommended)
1. Click **"🧪 Dynamischer Test-Runner"**
2. Select a bot
3. Select a test scenario
4. Configure the test profile:
   - **Use My Profile** - Uses your actual personality profile
   - **Manual Selection** - Choose Riemann, Spiral Dynamics, and/or OCEAN blocks
5. Click **"Start Test"**

### Profile Options

**Riemann Dimensions:**
- 💚 Nähe (Harmonie) - High proximity/connection
- 🔴 Distanz (Rationalität) - High distance/analytical
- 🔵 Dauer (Sicherheit) - High permanence/security
- 🟡 Wechsel (Flexibilität) - High change/flexibility

**Spiral Dynamics:**
- 🟠 Orange (Leistung) - Achievement-oriented
- 🟢 Grün (Gemeinschaft) - Community-oriented

**OCEAN:**
- 📊 Balanced - Average on all dimensions
- 😰 High Neuroticism - Emotionally reactive

### Test Evaluation
After the test runs, you'll see:
- **Conversation History** - Full exchange with timing
- **Telemetry** - DPC injection status, DPFL keywords detected
- **Manual Checks** - Checkboxes to verify expected behaviors
- **Export** - Download test results as JSON for comparison

---

## 7. API Usage Monitoring

Monitor AI API costs and usage patterns.

### Metrics Displayed
- **Total Requests** - Number of API calls
- **Total Tokens** - Input + output tokens used
- **Estimated Cost** - Based on model pricing
- **Usage by Endpoint** - Breakdown by feature (chat, analysis, etc.)
- **Usage by Model** - Which AI models are being used

### Time Period Selection
- Today
- Last 7 days
- Last 30 days
- Custom range

### Cost Optimization
Monitor for:
- Unusual spikes in usage
- High-cost endpoints
- Inefficient model usage

---

## 8. Newsletter Management

The Newsletter panel allows sending bulk emails to users.

### Features
- Send emails to all users or specific segments
- Preview emails before sending
- Track delivery status

### Best Practices
- Test emails with your own address first
- Respect user preferences and GDPR
- Keep unsubscribe links functional

---

## 9. Onboarding & Intent Flow (NEU v1.9.7)

Since v1.9.7, new users are guided through an onboarding flow before reaching the Bot Selection screen.

### Intent Picker
When a user opens the app, they are presented with three options:
- **Kommunikation / Communication** — Routes to Management & Kommunikation section
- **Coaching** — Routes to Coaching section
- **Begleitendes Coaching / Augmented Coaching** — Routes to Exklusiv section (Client-only)

The selected intent determines which section is highlighted in the Bot Selection view (search field + section header pulse briefly).

**Registered users** can disable the Intent Picker from the Burger Menu. The preference is stored in `localStorage` (`intentPickerDisabled`).

**Admin/Developer users** have a special startup preference dropdown in the Admin Panel that allows them to choose their default startup view (`adminStartupPref` in localStorage):
- **Admin Panel** (default)
- **Intent Picker**
- **Bot Selection** (skip to coach selection)

### Gloria Interview (Structured Interviews)
The "Management & Kommunikation" section includes **Gloria Interview**, a specialized bot for conducting structured interviews on specific topics (ideas, projects, decisions).
- **Purpose:** Pure inquiry without coaching advice.
- **Output:** Generates a structured summary and a grammatically smoothed transcript.
- **Export:** Users can download the interview results as a Markdown file.

### Visual Redesign (W4F)
Version 1.9.6 introduced a comprehensive visual redesign ("W4F") featuring:
- **New Color Palette:** 4 shades of blue + amber accent.
- **Typography:** Inter Variable font for improved readability.
- **UI Components:** Rounded cards, elevated shadows, and pill-shaped buttons.
- **Animations:** Smooth page transitions using Framer Motion.

### Name Prompt
- **Guests** are prompted for their first name or a pseudonym. This is stored locally (`guestName` in localStorage) and used to generate a minimal Life Context template. The prompt can be skipped.
- **Registered users** who don't yet have a Life Context are prompted for their name, which is then integrated into an encrypted Life Context.
- Users who already have a Life Context are **not** prompted again.

### OCEAN Onboarding
New registered users without a Personality Profile are offered the OCEAN (Big Five) personality test as part of the onboarding flow, right after the Intent Picker.

### Profile Hint
Premium users who completed OCEAN but not Riemann-Thomann or Spiral Dynamics see a banner prompting them to complete additional personality assessments. The hint offers "Discover now", "Later", and "Don't show again" options. A badge appears in the Burger Menu when the hint is active.

---

## 10. In-App Purchases & RevenueCat (NEU v1.9.7)

### How iOS Purchases Appear in the System

iOS purchases made through StoreKit 2 / RevenueCat are automatically processed:

1. User purchases a subscription in the iOS app
2. RevenueCat verifies the receipt with Apple
3. Our backend receives the purchase event and creates a `Purchase` record
4. User's tier (`isPremium`, `accessExpiresAt`, etc.) is updated in the database

### Viewing Purchase Data

Purchase records appear in the **User Management** section. The Purchase table contains:
- `transactionId` — Apple's unique transaction identifier
- `productId` — App Store Product ID (e.g., `mc.premium.monthly`)
- `customerEmail` — User's email
- `status` — `completed`, `refunded`, etc.
- `platform` — `ios` or `web`

### Platform-Specific Purchase Flows

| Platform | Payment Method | Where |
|----------|---------------|-------|
| **iOS App** | Apple In-App Purchase (StoreKit 2) | `NativePaywall.tsx` |
| **Web Browser** | PayPal + Upgrade Codes | `PaywallView.tsx` |

PayPal links are **hidden** in the iOS app (Apple Guideline 3.1.1).

### Troubleshooting Purchases

- **Sandbox subscriptions** auto-renew at an accelerated rate (monthly → every 5 min). To stop: Settings → App Store → Sandbox Account → Manage Subscriptions.
- **RevenueCat Dashboard**: https://app.revenuecat.com — shows all purchase events, subscriber status, and revenue.
- **Database reset** (if needed): Delete records from `Purchase` table and reset user's `isPremium`, `accessExpiresAt`, `unlockedCoaches` fields.

---

## 11. Server Administration

### Process Management (PM2)
The backend now uses **PM2** in Cluster Mode (2 instances) for improved performance and stability.
- Logs may be prefixed with instance IDs (e.g., `[0]`, `[1]`).
- Automatic restarts are handled if memory usage exceeds 700MB.

### Deployment Commands

**SSH to Server:**
```bash
ssh root@<YOUR_SERVER_IP>
```

**View Container Status:**
```bash
cd /opt/manualmode-staging
podman-compose -f podman-compose-staging.yml ps
```

**View Logs:**
```bash
# All services
podman-compose -f podman-compose-staging.yml logs -f

# Specific service
podman-compose -f podman-compose-staging.yml logs -f backend
```

**Restart Services:**
```bash
podman-compose -f podman-compose-staging.yml restart
```

### Database Access

**Connect to MariaDB:**
```bash
podman exec -it meaningful-conversations-mariadb-staging mysql -u mcuser -p meaningful_conversations
```

### Common Queries

**Check user count:**
```sql
SELECT COUNT(*) FROM User;
```

**Find user by email:**
```sql
SELECT * FROM User WHERE email LIKE '%example%';
```

**Recent sessions:**
```sql
SELECT * FROM Session ORDER BY createdAt DESC LIMIT 10;
```

---

## 12. Troubleshooting

### User Can't Login
1. Check if the user exists in the database
2. Verify email is spelled correctly
3. Reset password if needed (note: encrypted data will be lost)

### Upgrade Code Not Working
1. Verify the code exists and is unused
2. Check the code type matches what the user expects
3. Ensure the code hasn't expired

### Bot Not Responding
1. Check server logs for errors
2. Verify AI API keys are configured
3. Check API usage limits haven't been exceeded

### Session Analysis Failing
1. Check backend logs for timeout errors
2. Verify the AI provider is responding
3. Monitor API usage for rate limiting

### Password Reset Lost Data
This is expected behavior due to end-to-end encryption:
- Life Context is encrypted with user's password
- Personality Profile is encrypted with user's password
- New password = new encryption key = old data unreadable

**Prevention:** Encourage users to keep their passwords secure and enable account recovery options.

---

## Security Notes

- Never share admin credentials
- Use strong, unique passwords
- Log out when leaving the admin panel
- Report any suspicious activity immediately
- Keep deployment access restricted to authorized personnel

---

## Contact

For technical issues beyond this manual, contact the development team.

**Version:** 1.9.9  
**Last Updated:** February 27, 2026
