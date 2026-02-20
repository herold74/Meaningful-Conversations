# Transcript Evaluation: User Guide

> **For Clients**: Get your conversation transcripts professionally analyzed and receive valuable insights for your communication development.

---

## 📋 Overview

The **Transcript Evaluation** is an AI-powered coaching tool that analyzes your conversation transcripts and provides detailed feedback on your communication. This feature is designed specifically for **Clients** and integrates your personality profile for individualized insights.

### What is analyzed?

- ✅ **Goal Alignment**: Did you achieve your conversation goal?
- ✅ **Behavioral Analysis**: What communication patterns do you exhibit?
- ✅ **Blindspots**: What unconscious patterns might be blocking you?
- ✅ **Assumption Check**: Which of your assumptions were confirmed or challenged?
- ✅ **Calibration**: How realistic is your self-assessment?
- ✅ **Personality Insights**: How does your profile show in the conversation? (if profile available)
- ✅ **Action Recommendations**: Concrete next steps

---

## 🚀 How to Use This Feature

### 1. Access the Feature

1. Sign in to the app
2. Go to **Bot Selection** (home screen)
3. Scroll to the **"Tools"** section
4. Click on **"Transcript Evaluation"**

**Note:** This feature is only available on **desktop browsers**, not in mobile apps.

---

### 2. Preparation: Answer Pre-Reflection Questions

Before submitting your transcript, answer the following questions:

#### ❓ Required Questions:

1. **What was your goal in this conversation?**
   - Example: "I wanted to make a difficult decision together."

2. **What did you personally want to achieve or learn?**
   - Example: "I wanted to stay calm and listen actively."

3. **What assumptions or expectations did you have?**
   - Example: "I expected resistance to my proposal."

4. **How satisfied are you with how the conversation went? (1-5)**
   - **1** = Very dissatisfied
   - **2** = Dissatisfied
   - **3** = Neutral
   - **4** = Satisfied
   - **5** = Very satisfied

#### 🔓 Optional:

5. **What was particularly difficult or challenging?**
   - Example: "My conversation partner became emotional, and I felt overwhelmed."

---

### 3. Upload Transcript

After the reflection questions, you have two options:

#### Option A: Paste Text
- Copy your transcript
- Paste it into the text field
- Click **"Evaluate"**

#### Option B: Upload SRT File
- Click **"Upload SRT File"**
- Select your `.srt` file (subtitle file)
- The file will be automatically parsed and inserted
- Click **"Evaluate"**

**Note:** SRT files can be exported from Zoom, Teams, or YouTube subtitles.

---

### 4. Read Evaluation

After analysis (approx. 10-30 seconds), you'll receive a detailed report:

#### 📊 Overall Score
- **Score**: 0-10 points
- **Summary**: Brief overview of key findings

#### 🎯 Goal Alignment (Score: X/5)
- **Evidence**: What shows you achieved your goal?
- **Gaps**: What's still missing?

#### 🧠 Behavioral Analysis (Score: X/5)
- **Evidence**: What behaviors did you show?
- **Blindspot Evidence**: Unconscious patterns that might hinder you

#### ✅ Assumption Check
- **Confirmed**: Which of your assumptions were true?
- **Challenged**: Which assumptions were wrong?
- **New Insights**: What did you learn that was new?

#### 🎚️ Calibration
- **Your Self-Rating**: X/5
- **Evidence-Based Rating**: X/5
- **Delta**: Difference between self and external view
- **Interpretation**: What does this difference mean?

#### 🧬 Personality Insights (if profile available)
- **Dimension**: e.g., "Riemann-Thomann: Closeness/Distance"
- **Observation**: How does this dimension show in the conversation?
- **Recommendation**: What could you do differently?

**If no profile available:**
> "No personality analysis available. Create a personality profile for individualized insights."

#### 💪 Strengths & Development Areas
- **Strengths**: What did you do well?
- **Development Areas**: What can you work on?

#### 🚀 Next Steps
- **Action**: Concrete action recommendation
- **Rationale**: Why is this step important?

#### 🤖 Coach Recommendations

For each identified **development area**, the evaluation recommends a primary and an alternative coach best suited to help you with that specific topic.

**For each recommendation you see:**
- **Coach name** and a colored badge indicating whether the coach is available to you
- **Rationale**: Why this coach fits your specific development area
- **Conversation starter**: A ready-made sentence to begin the session directly on the topic

**Copy the conversation starter:**
Click **"Copy starter"** to copy the starter sentence to your clipboard — useful for manually starting a session or saving it for later.

**Start session directly:**
Click **"Start session"** — the app opens the recommended coach and automatically sends the suggested starter sentence as your first message. The conversation begins immediately on your specific development topic, with no searching or manual input required.

> 💡 **Tip**: The "Start session" button is only shown for coaches matching your current access level. Coaches of a higher tier display an "Upgrade" button instead. Locked coaches are still visible in the PDF export, but the start button only appears after upgrading.

---

## 📄 PDF Export (Clients, Admins & Developers)

As a **Client, Admin, or Developer**, you can export your evaluations as PDF.

### 📍 Where to Find the PDF Export Button?

The export button is available in **two locations**:

#### Position 1: After Evaluation (Detail View)
- **When:** Directly after completing a transcript analysis
- **Where:** At the end of the evaluation page, **after** the "Next Steps" section
- **Design:** Large button with teal border, download icon (↓), text "Export as PDF"

**How to get there:**
1. Have transcript analyzed
2. Scroll to evaluation detail page
3. At the very bottom: PDF Export Button → "Done" Button

#### Position 2: In History (List View)
- **When:** When browsing previous evaluations
- **Where:** Under **each** evaluation in the "Previous Evaluations" list
- **Design:** Smaller button, same style as above, appears below the summary

**How to get there:**
1. On the first page (reflection questions): Click **"View Previous Evaluations"** button
2. List of evaluations appears
3. Under each evaluation: PDF Export Button (exportable directly, without clicking details)

**Alternative in History:**
- Click evaluation → Detail page opens → See Position 1

---

### Export Directly After Evaluation

1. Scroll to the end of the evaluation page
2. Click **"Export as PDF"** (button with download icon)
3. The PDF will be automatically downloaded (Web) or shared (Mobile)

### Export from History

1. Click **"Previous Evaluations"** (button on first page)
2. Select an evaluation from the list
3. At the end of each evaluation, you'll find the **"Export as PDF"** button
4. Alternative: Click directly on the **PDF Export Button** under each evaluation in the list

**Button Design:**
- White background, teal border (`border-accent-primary`)
- Download icon (arrow down with document)
- Text: "Export as PDF" (EN) / "Als PDF exportieren" (DE)
- Shows spinner during export ("Exporting..." / "Exportiere...")
- Grayed out (disabled) during export

**Important:** The button is **only visible to Clients, Admins, and Developers**. Premium users and other roles cannot see the button.

---

## 📊 PDF Content

The exported PDF contains:

1. **Header**: Logo, date, email
2. **Reflection Questions & Answers**: Your preparation
3. **Overall Score**: Score and summary
4. **All Analysis Sections**: Goal, behavior, assumptions, calibration, etc.
5. **Footer**: "Generated by Meaningful Conversations • Confidential"

**Filename:** `transcript_evaluation_YYYY-MM-DD.pdf`

---

## 🔒 Privacy & Security

### What happens to my data?

- ✅ **Transcripts** are sent to AI (Google Gemini) for analysis
- ✅ **Evaluations** are stored in your personal database
- ✅ **Personality Profile** is transmitted end-to-end encrypted
- ✅ **PDFs** are generated locally in your browser (no server storage)

### Who can see my evaluations?

- ✅ **Only you** have access to your evaluations
- ✅ **Your coach/advisor** can access with explicit permission (future feature)
- ❌ **Admins** can see metadata, but not the content

---

## 💡 Best Practices

### Before Analysis

1. **Reflect honestly**: Quality of evaluation depends on your answers
2. **Be specific**: "I wanted to listen actively" is better than "I wanted to communicate well"
3. **Note details**: What was particularly difficult? More context = better analysis

### Transcript Quality

1. **Completeness**: At least 5-10 conversation rounds for meaningful analysis
2. **Speaker Attribution**: Label speakers ("Me:", "Partner:")
3. **Timestamps**: SRT files with timestamps are ideal

### After Analysis

1. **Take time**: Read the evaluation carefully
2. **Prioritize**: Choose 1-2 development areas for your next conversations
3. **Save PDF**: Export the evaluation for your records
4. **Discuss with coach**: Share the PDF with your coach/advisor

---

## ❓ Frequently Asked Questions (FAQ)

### Can I use this feature as a Premium user?

❌ No. This feature is **exclusively for Clients**. PDF export is visible to **Clients, Admins, and Developers**.

### Does it work on smartphones?

❌ No. This feature is only available on **desktop browsers**. Mobile apps do not support this feature.

### Do I need a personality profile?

🔓 **Optional**. Without a profile, you'll get a general analysis. With a profile, you'll receive additional personality-specific insights and blindspot analyses.

### How long does the analysis take?

⏱️ **10-30 seconds**, depending on transcript length.

### Can I evaluate multiple transcripts?

✅ Yes! You can analyze as many transcripts as you want. All evaluations are saved in your history.

### How long are evaluations stored?

🔄 **Indefinitely**, as long as you have your account. Oldest evaluations first in history.

### Can I delete an evaluation?

❌ Not directly at the moment. Contact support or your admin.

### Which languages are supported?

🌍 **German & English**. The evaluation is performed in your app's language setting.

### What if the analysis fails?

⚠️ **Possible causes:**
- Transcript too short (< 100 words)
- Network error
- AI overload (rare)

**Solution:** Try again. If it fails repeatedly, contact support.

---

## 🔍 Coach Recommendation: Find the Right Coach for Your Topic

Directly on the **coach selection page** (the home page after logging in), you'll find a search field that uses AI to identify the best-fitting coach for your current situation — without manually comparing coaches.

### How to Use the Search

1. Log in and go to **Coach Selection**
2. At the top of the page, you'll find the **"Coach Recommendation"** section with an input field
3. Describe your situation or topic in your own words — as detailed or brief as you like
   > Example: *"When I'm around people I'm close to, I sometimes feel so intimidated that I can't actively contribute. I want to understand what's happening."*
4. Click **"Find coach"** (or press `Cmd/Ctrl + Enter`)
5. The AI analyzes your topic and shows you:
   - A **primary coach** (best match for your topic)
   - An **alternative coach** (different approach to the same topic)
   - For each: a rationale and a ready-made conversation starter

### From Recommendation to Session

| Button | What happens |
|--------|-------------|
| **"Start session"** | Opens the coach and sends the suggested starter as your first message — you begin immediately on your topic |
| **"Copy starter"** | Copies the starter sentence to your clipboard for personal use |
| **"Upgrade"** | Appears for coaches that require a higher access level |

### Who Can Use the Search?

- **Logged-in users** (all tiers): The recommendation feature is available to all registered users
- **Guests**: See a sign-in prompt instead of the search field
- **Start session**: Depends on the recommended coach and your access level (Guest / Premium / Client)

> 💡 **Difference from Transcript Evaluation**: This search works without a transcript — you describe your topic freely, and the AI recommends the right coach. Transcript evaluation, on the other hand, analyzes a real conversation and recommends coaches based on development areas identified in that conversation.

---

## 📞 Support

For questions or issues:

- **Email**: support@manualmode.at
- **In-App**: Contact your admin or coach
- **Documentation**: [TROUBLESHOOTING-INDEX.md](./TROUBLESHOOTING-INDEX.md)

---

**Version:** 1.9.3  
**Last Updated:** February 20, 2026  
**Feature Available For:** Clients (Desktop Browser) · Coach Recommendation: all registered users
