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

## 📊 Current Status

- [ ] 01-landing (0 screenshots)
- [ ] 02-auth (0 screenshots)
- [ ] 03-context-setup (0 screenshots)
- [ ] 04-bot-selection (0 screenshots)
- [ ] 05-chat (0 screenshots)
- [ ] 06-session-review (0 screenshots)
- [ ] 07-achievements (0 screenshots)
- [ ] 08-admin (0 screenshots)
- [ ] 09-mobile (0 screenshots)

**Total: 0 screenshots captured**

Update this checklist as you add screenshots!

