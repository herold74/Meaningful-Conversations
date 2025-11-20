# Data Privacy at Meaningful Conversations

Our commitment is to provide a secure and private space for your self-reflection and personal growth. This document outlines how your data is handled, protected, and what you control.

---

## Guest Users vs. Registered Users

The application operates in two distinct modes, each with a different approach to data privacy:

### 👤 Guest Mode
- **Zero Server Storage:** When you use the app as a guest, your "Life Context" file and all conversation data are processed **exclusively in your browser**.
- **Your Responsibility:** No data is ever sent to or stored on our servers. You are in complete control and are responsible for saving your `.md` file at the end of each session and uploading it to continue your journey.

### ✅ Registered User Mode
- **Encrypted Cloud Storage:** For registered users, your "Life Context" file is stored on our servers to provide a seamless experience across sessions. This data is protected by **End-to-End Encryption (E2EE)**.
- **Benefits:** This mode enables automatic saving, gamification progress tracking, and access to a wider range of coaches.

---

## End-to-End Encryption (E2EE) Explained

The privacy of your "Life Context" file is our highest priority. Here’s how our E2EE model ensures only you can read your data:

1.  **Key Generation:** When you register, your password is combined with a unique salt to create a powerful encryption key. This process happens **entirely on your device** (in your browser).
2.  **Key is Never Transmitted:** This encryption key **never leaves your device**. It is never sent to our servers.
3.  **Local Encryption:** Before your "Life Context" is saved, it is encrypted on your device using this key.
4.  **Secure Storage:** Only the scrambled, encrypted version of your data is sent to our servers for storage.
5.  **Local Decryption:** When you log in, your password is used to re-create the same key on your device, which then decrypts the data fetched from the server.

**The Bottom Line:** Because the key is never stored on our servers, no one—not even our system administrators—can read the content of your "Life Context" file.

---

## Frequently Asked Privacy Questions

### Can an admin connect my "anonymous" feedback to my account?

**No.** This is a critical privacy guarantee. Here’s how it works:

-   **"Guest" Feedback:** Submitted by a user who is not logged in. There is no user account to link it to.
-   **"Anonymous" Feedback:** Submitted by a **registered user** who has explicitly checked the "Send Anonymously" box.

When you submit feedback anonymously, the system saves a flag (`isAnonymous: true`) with that specific feedback record. The admin interface is programmed to **unconditionally obey this flag**. If the flag is true, the admin panel is forbidden from displaying your email and will only show the word "Anonymous". While a link between the feedback and your user ID exists in the database for data integrity, the `isAnonymous` flag acts as a privacy firewall at the presentation layer.

### What happens if I forget or reset my password?

This is a direct and important consequence of our E2EE model. Because we never have your password or your encryption key, **if you lose your password, your encrypted "Life Context" data is permanently and irrecoverably lost.**

When you use the "Forgot Password" feature, the system allows you to create a new password. This new password generates a new encryption key, which cannot decrypt your old data. As a security measure, the old, unreadable data is automatically deleted from our servers.

**Important Distinction:**
- **Password Reset** (via "Forgot Password"): Use this only when you've truly forgotten your password. ⚠️ **All your Life Context data will be permanently deleted.**
- **Change Password** (via Account Settings): Use this when you still know your current password but want to change it. ✅ **Your data is preserved** by re-encrypting it with the new password.

**We strongly recommend that all registered users regularly download a backup of their "Life Context" file.**

### What data does the AI see during a conversation?

During a session, your current "Life Context" and the ongoing chat history are sent to the Google Gemini API to generate the coach's responses. This data is used for the duration of that specific API call and is not stored by us or Google in a way that is permanently linked to your user account for other purposes.

### What data do you collect and store?

We collect the minimum data necessary to provide the service:

-   **For Registered Users:**
    -   Your email address (for login and password resets).
    -   A securely hashed version of your password (we never store the plain text).
    -   Your unique, randomly generated encryption salt.
    -   Your gamification state (XP, level, achievements). This is encoded, not encrypted.
    -   Your encrypted "Life Context" file (unreadable by us).
-   **For All Feedback Submissions:**
    -   The content of the feedback (rating, comments, and the relevant parts of the conversation if you report a specific message). This data is visible to administrators to help improve the service.
-   **Anonymized Analytics:** We may collect high-level, anonymized usage data (e.g., which coaches are most popular, average session length) to improve the application. This data is never tied to your personal identity.
