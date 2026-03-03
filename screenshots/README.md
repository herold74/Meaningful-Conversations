# Screenshots Directory

This directory contains screenshots documenting the user journey through Meaningful Conversations.

## 📁 Directory Structure

```
screenshots/
├── 01-landing/          # Landing page and first impressions
├── 02-auth/             # Login, registration, password reset
├── 03-context-setup/    # Life Context creation and upload
├── 04-bot-selection/    # Choosing AI coaches
├── 05-chat/             # Chat sessions with AI coaches
├── 06-session-review/   # Analysis, insights, and updates
├── 07-achievements/     # Gamification and progress tracking
├── 08-admin/            # Admin console and API usage dashboard
└── 09-mobile/           # Mobile responsive views
```

## 📸 Screenshot Guidelines

### Naming Convention
Use descriptive names with numbers for ordering:
```
01-feature-description.png
02-feature-description.png
```

Examples:
- `01-landing-page-desktop.png`
- `02-bot-selection-grid.png`
- `03-chat-active-conversation.png`

### Recommended Sizes

**Desktop:**
- 1920x1080 (Full HD)
- 1440x900 (MacBook Pro)

**Tablet:**
- 768x1024 (iPad Portrait)
- 1024x768 (iPad Landscape)

**Mobile:**
- 375x667 (iPhone SE)
- 390x844 (iPhone 12/13/14)
- 360x740 (Android)

### How to Capture

**On Mac:**
```bash
# Selected area
Cmd + Shift + 4

# Full screen
Cmd + Shift + 3

# Window with shadow
Cmd + Shift + 4, then Space
```

**On Windows:**
```bash
# Snipping tool
Win + Shift + S
```

**Chrome DevTools (for responsive views):**
```bash
# Toggle device toolbar
Cmd + Shift + M (Mac)
Ctrl + Shift + M (Windows)
```

## ✅ Screenshot Checklist

See `USER-JOURNEY.md` for a complete checklist of all screenshots needed for comprehensive documentation.

## 🎯 Priority Screenshots

### Must Have (Core Features):
1. Landing page with three options
2. Bot selection grid
3. Active chat conversation
4. Session review with AI insights
5. Diff viewer showing Life Context updates
6. Admin API usage dashboard

### Nice to Have (Enhanced Documentation):
- Various mobile views
- Error states
- Loading states
- Empty states
- All admin console tabs

## 🖼️ Image Optimization

After capturing, optimize images for web:

```bash
# Install ImageMagick (if not already installed)
brew install imagemagick  # Mac
# or
sudo apt install imagemagick  # Linux

# Optimize a single image
convert input.png -quality 85 -strip output.png

# Batch optimize all PNGs in current directory
for img in *.png; do
  convert "$img" -quality 85 -strip "optimized-$img"
done
```

Or use online tools:
- https://tinypng.com/
- https://squoosh.app/

## 📝 Adding to Documentation

Once you have screenshots, update the main README.md:

```markdown
## 📸 Screenshots

### Landing Page
![Landing Page](screenshots/01-landing/01-landing-page-desktop.png)

### AI Coach Selection
![Bot Selection](screenshots/04-bot-selection/01-bot-grid-desktop.png)

### Chat Session
![Chat Session](screenshots/05-chat/01-active-conversation.png)

### Session Review
![Session Review](screenshots/06-session-review/01-summary-and-updates.png)

### Admin Dashboard - API Usage
![API Usage Dashboard](screenshots/08-admin/06-api-usage-summary.png)
```

## 🚀 Quick Start

1. **Start your local development server:**
   ```bash
   npm run dev
   ```

2. **Start the backend:**
   ```bash
   cd meaningful-conversations-backend
   npm start
   ```

3. **Access the app:**
   - Frontend: http://localhost:5173
   - With staging: http://localhost:5173/?backend=staging

4. **Navigate through each screen** in the USER-JOURNEY.md checklist

5. **Capture screenshots** and save them to the appropriate subdirectory

6. **Commit to Git:**
   ```bash
   git add screenshots/
   git commit -m "Add user journey screenshots"
   git push
   ```

## 📊 Current Status (Updated 2026-03-02)

**Devices:** iPad Pro 13" (M5) — App Store required, iPhone 17 Pro Max — App Store required
**Language:** German (DE)
**Modes:** Light Mode + Dark Mode

- [x] 01-landing (5 screenshots)
  - `01-welcome-dark-ipad13-de.png` — Welcome screen: Login/Register/Guest (Dark)
  - `02-landing-template-context-ipad13-de.png` — Landing with template LC + Extend/Interview buttons
  - `03-welcome-dark-iphone-de.png` — Welcome screen (Dark, iPhone)
  - `04-landing-template-context-iphone-de.png` — Landing with template LC (iPhone)
  - `05-landing-empty-new-session-iphone-de.png` — Landing empty, new session (iPhone)
- [ ] 02-auth (0 screenshots)
- [x] 03-context-setup (12 screenshots)
  - `01-intent-picker-dark-ipad13-de.png` — Intent selection (Dark)
  - `02-questionnaire-empty-ipad13-de.png` — LC questionnaire, Kernprofil empty
  - `03-questionnaire-filled-ipad13-de.png` — LC questionnaire, Kernprofil filled
  - `04-questionnaire-career-ipad13-de.png` — LC questionnaire, Karriere & Beruf filled
  - `05-lc-editor-preview-enriched-ipad13-de.png` — LC editor preview, post-session enriched content
  - `06-intent-picker-dark-iphone-de.png` — Intent selection (Dark, iPhone)
  - `07-questionnaire-filled-iphone-de.png` — LC questionnaire, Kernprofil filled (iPhone)
  - `08-questionnaire-career-iphone-de.png` — LC questionnaire, Karriere section (iPhone)
  - `09-lc-editor-edit-mode-iphone-de.png` — LC Markdown editor, edit tab (iPhone)
  - `10-lc-editor-preview-iphone-de.png` — LC Markdown editor, preview tab (iPhone)
  - `11-lc-editor-preview-dark-iphone-de.png` — LC Markdown editor, preview (Dark, iPhone)
  - `12-gloria-interview-extension-iphone-de.png` — Gloria extending existing LC via interview (iPhone)
- [x] 04-bot-selection (2 screenshots)
  - `01-coach-grid-full-ipad13-de.png` — Full coach grid: Management + Coaching sections
  - `02-coaching-section-iphone-de.png` — Coaching section: Max & Ava (iPhone)
- [x] 05-chat (7 screenshots)
  - `01-voice-mode-nobody-ipad13-de.png` — Voice mode with Nobody
  - `02-coaching-session-ava-ipad13-de.png` — Ava coaching session, full conversation
  - `03-voice-mode-ava-iphone-de.png` — Voice mode with Ava (iPhone)
  - `04-coaching-session-ava-iphone-de.png` — Ava coaching session (iPhone)
  - `05-coaching-session-ava-dark-iphone-de.png` — Ava coaching session (Dark, iPhone)
  - `06-coaching-deep-tts-active-iphone-de.png` — Deep coaching, TTS active (iPhone)
  - `07-session-analyzing-iphone-de.png` — Session analyzing spinner (iPhone)
- [x] 06-session-review (9 screenshots)
  - `01-review-findings-steps-ipad13-de.png` — Diskursanalyse + Findings + Next Steps + Proposed Updates
  - `02-review-diff-final-ipad13-de.png` — Proposed Updates + Diff View + Final Context + Buttons
  - `03-review-updates-diff-ipad13-de.png` — More Updates + Diff View + Buttons
  - `04-review-updates-diff-dark-ipad13-de.png` — Same as above (Dark)
  - `05-review-findings-iphone-de.png` — Diskursanalyse + Findings (iPhone)
  - `06-review-updates-diff-iphone-de.png` — Proposed Updates + Diff View (iPhone)
  - `07-review-updates-diff-dark-iphone-de.png` — Same as above (Dark, iPhone)
  - `08-review-diff-final-buttons-iphone-de.png` — Diff View + Final Context + Buttons (iPhone)
  - `09-review-diff-career-iphone-de.png` — Diff Career section detail (iPhone)
- [x] 07-achievements (2 screenshots)
  - `01-achievements-dark-ipad13-de.png` — Achievements grid (Dark)
  - `02-achievements-light-ipad13-de.png` — Achievements grid (Light)
- [ ] 08-admin (0 screenshots)
- [ ] 09-mobile (0 screenshots — covered by iPhone screenshots in other categories)

**Total: 37 screenshots (iPad 13": 16, iPhone Pro Max: 21)**

