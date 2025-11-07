# Screenshot Quick Reference

## 🎯 Essential Screenshots (Minimum Viable Documentation)

### Priority 1: Core User Journey (10 screenshots)

1. **Landing Page** - `01-landing/01-landing-page.png`
   - Shows three options: Login, Register, Guest

2. **Bot Selection** - `04-bot-selection/01-coach-grid.png`
   - Grid of 6 AI coaches with descriptions

3. **Chat Interface** - `05-chat/01-active-conversation.png`
   - Conversation in progress with coach

4. **Voice Mode** - `05-chat/02-voice-mode-active.png`
   - Voice interface with visual feedback

5. **Session Summary** - `06-session-review/01-session-summary.png`
   - AI-generated insights

6. **Life Context Updates** - `06-session-review/02-proposed-updates.png`
   - List of proposed changes

7. **Diff Viewer** - `06-session-review/03-diff-viewer.png`
   - Side-by-side comparison of changes

8. **Achievements** - `07-achievements/01-achievement-grid.png`
   - Gamification dashboard

9. **Admin API Usage** - `08-admin/06-api-usage-dashboard.png`
   - Cost tracking and analytics

10. **Mobile View** - `09-mobile/01-chat-mobile.png`
    - Responsive mobile interface

### Priority 2: Registration & Setup (5 screenshots)

11. **Registration Form** - `02-auth/01-register.png`
12. **Email Verification** - `02-auth/02-verify-email-pending.png`
13. **Questionnaire** - `03-context-setup/03-questionnaire-question.png`
14. **File Upload** - `03-context-setup/01-upload-interface.png`
15. **Generated Context** - `03-context-setup/05-generated-preview.png`

### Priority 3: Admin Features (5 screenshots)

16. **User Management** - `08-admin/01-users-tab.png`
17. **Feedback & Ratings** - `08-admin/04-ratings-feedback.png`
18. **API Cost Projections** - `08-admin/06-api-usage-projections.png`
19. **Model Breakdown** - `08-admin/06-api-usage-models.png`
20. **Top Users** - `08-admin/06-api-usage-top-users.png`

---

## 📱 Responsive Testing Checklist

### Desktop (1440x900 or 1920x1080)
- [ ] Landing page
- [ ] Bot selection
- [ ] Chat interface
- [ ] Admin dashboard

### Tablet (768x1024)
- [ ] Bot selection (adjusted layout)
- [ ] Chat interface
- [ ] Session review

### Mobile (375x667)
- [ ] Landing with burger menu
- [ ] Bot selection (scroll)
- [ ] Chat interface (optimized)
- [ ] Bottom navigation

---

## 🎨 Screenshot Best Practices

### Composition
✅ **Do:**
- Use real, meaningful content (not Lorem Ipsum)
- Show features in action
- Include visual feedback (hover states, active elements)
- Demonstrate value (insights, results)
- Show before/after comparisons

❌ **Don't:**
- Use placeholder text
- Show empty states unless documenting them
- Include personal/sensitive information
- Crop out important UI elements

### Content Preparation
Before capturing, set up:
- **User**: Create test account with realistic name
- **Life Context**: Use sample content (not empty)
- **Conversation**: Have 3-4 exchanges minimum
- **Achievements**: Unlock at least 2-3
- **Admin Data**: Generate some API usage data

### Technical Quality
- **Resolution**: High DPI (Retina) when possible
- **Format**: PNG for UI screenshots (better quality)
- **File Size**: Optimize (aim for < 500KB per image)
- **Naming**: Descriptive, numbered, consistent

---

## 🚀 Quick Start

### 1. Start Servers
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd meaningful-conversations-backend && npm start
```

### 2. Run Screenshot Helper
```bash
./capture-screenshots.sh
```

### 3. Navigate and Capture
Open: http://localhost:5173

**Keyboard Shortcuts:**
- **Mac**: `Cmd + Shift + 4` (select area)
- **Windows**: `Win + Shift + S`
- **Chrome DevTools**: `Cmd/Ctrl + Shift + M` (mobile view)

### 4. Organize Files
Save to appropriate subdirectory:
```
screenshots/
├── 01-landing/01-landing-page.png
├── 04-bot-selection/01-coach-grid.png
├── 05-chat/01-active-conversation.png
└── ...
```

### 5. Commit to Git
```bash
git add screenshots/
git commit -m "Add user journey screenshots"
git push
```

---

## 📊 User Flow Diagram

```
┌─────────────┐
│   LANDING   │  Choose: Guest / Register / Login
└──────┬──────┘
       │
       ├─────→ GUEST PATH
       │      └─→ Upload/Create Context → Bot Selection → Chat → Review → Download
       │
       ├─────→ REGISTER PATH  
       │      └─→ Email → Verify → Create Context → Bot Selection → Chat → Review → Auto-Save
       │
       └─────→ LOGIN PATH
              └─→ Dashboard → Bot Selection → Chat → Review → Auto-Save
```

---

## 🎯 Screenshot Capture Order

### Recommended Flow (Follow User Journey):

**Session 1: Guest Experience**
1. Start at landing page (capture)
2. Click "Continue as Guest" (capture)
3. Create new context via questionnaire (capture steps)
4. Select a coach (capture grid)
5. Start conversation (capture exchanges)
6. End session (capture review screens)
7. Download file (capture modal)

**Session 2: Registered User**
1. Back to landing (capture)
2. Click "Register" (capture form)
3. Email verification flow (capture)
4. Upload previous file (capture)
5. Select different coach (capture)
6. Voice conversation (capture voice mode)
7. Session review with updates (capture)
8. View achievements (capture)

**Session 3: Admin**
1. Login as admin
2. Navigate to Admin Console
3. Capture each tab systematically
4. Focus on API Usage tab (new feature!)

**Session 4: Mobile Views**
1. Open Chrome DevTools
2. Toggle device toolbar (`Cmd/Ctrl + Shift + M`)
3. Select iPhone or Android preset
4. Navigate through key screens
5. Capture mobile-optimized layouts

---

## ✅ Completion Checklist

### Documentation
- [ ] README.md updated with screenshot gallery
- [ ] USER-JOURNEY.md reviewed
- [ ] Screenshots optimized (file size)
- [ ] All screenshots committed to Git

### Quality Check
- [ ] No personal information visible
- [ ] High resolution (readable text)
- [ ] Consistent styling/theme
- [ ] Real content (not placeholders)
- [ ] Representative of actual usage

### Coverage
- [ ] All 20 essential screenshots captured
- [ ] At least 3 mobile views
- [ ] Admin features documented
- [ ] API Usage dashboard complete
- [ ] Error states captured (bonus)

---

## 📈 Next Steps After Screenshots

1. **Update Main README:**
   - Add "Features Gallery" section
   - Embed key screenshots
   - Link to full documentation

2. **Create GitHub Wiki:**
   - Detailed walkthrough with images
   - Troubleshooting guide with screenshots
   - Admin guide with API usage examples

3. **Marketing Materials:**
   - Feature highlights slide deck
   - Social media posts
   - Demo video script

4. **Documentation Site:**
   - Consider using tools like:
     - GitBook
     - Docusaurus
     - MkDocs

---

**Ready to capture?** Run `./capture-screenshots.sh` to get started! 📸

