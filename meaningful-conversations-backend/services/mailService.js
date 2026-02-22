const Mailjet = require('node-mailjet');
const brand = require('../config/brand');

let mailjet;
const isProductionOrStaging = process.env.ENVIRONMENT_TYPE === 'production' || process.env.ENVIRONMENT_TYPE === 'staging';

// Initialize Mailjet client only if necessary credentials are provided
if (process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY) {
    mailjet = new Mailjet({
        apiKey: process.env.MAILJET_API_KEY,
        apiSecret: process.env.MAILJET_SECRET_KEY
    });
} else {
    if (isProductionOrStaging) {
        console.error("FATAL: Mailjet API keys are not configured for production/staging environment.");
    } else {
        console.log("INFO: Mailjet API keys not found. Email sending will be simulated in the console.");
    }
}

const SENDER_EMAIL = process.env.MAILJET_SENDER_EMAIL || 'noreply@example.com';
const SENDER_NAME = brand.senderName;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const sendConfirmationEmail = async (email, token, language = 'en') => {
    const confirmationUrl = `${FRONTEND_URL}?route=verify-email&token=${token}`;

    const subjects = {
        en: `Activate Your ${brand.appName} Account`,
        de: `Aktivieren Sie Ihr Konto bei ${brand.appNameDe}`
    };

    const textBodies = {
        en: `========================================
Welcome to ${brand.appName}!
Your account includes 14 days of free Premium access.
========================================

Please click the link below to activate your account.
This link is valid for 24 hours.

${confirmationUrl}

----------------------------------------
WHAT'S INCLUDED IN EACH PLAN?
----------------------------------------
Feature                  | Guest    | Registered | Premium
-------------------------|----------|------------|--------
Coaching Profiles        | 3        | 3 (2 opt.) | 5
Interview Assistant      | -        | Yes        | Yes
Saved Life Context       | -        | Yes        | Yes
Personality Profile      | -        | -          | Yes
Transcript Evaluation    | -        | -          | Yes
Audio Recording          | -        | -          | Yes
Voice Mode               | Yes      | Yes        | Yes
Unlimited Messages       | 50/week  | Yes        | Yes
----------------------------------------

Your 14-day Premium trial gives you full access to all features.
After the trial, you can continue for free as a guest and still manage
your Life Context yourself. As a registered user (from EUR 3.90/month)
you also benefit from automatic management, an individually created
personality profile, and personalized guidance through our coaching
profiles. Premium access is available for 1, 3, or 12 months from EUR 9.90.

If you did not sign up for an account, you can safely ignore this email.`,
        de: `========================================
Willkommen bei ${brand.appNameDe}!
Ihr Konto enthält 14 Tage kostenlosen Premium-Zugang.
========================================

Bitte klicken Sie auf den untenstehenden Link, um Ihr Konto zu aktivieren.
Dieser Link ist 24 Stunden gültig.

${confirmationUrl}

----------------------------------------
WAS IST IN WELCHEM PLAN ENTHALTEN?
----------------------------------------
Funktion                    | Gast     | Registriert | Premium
----------------------------|----------|-------------|--------
Coaching Profile            | 3        | 3 (2 opt.)  | 5
Interview Assistent         | -        | Ja          | Ja
Gespeicherter Life Context  | -        | Ja          | Ja
Persönlichkeitsprofil       | -        | -           | Ja
Transkript-Auswertung       | -        | -           | Ja
Audioaufzeichnung           | -        | -           | Ja
Sprachmodus                 | Ja       | Ja          | Ja
Unbegrenzte Nachrichten     | 50/Woche | Ja          | Ja
----------------------------------------

Ihre 14-tägige Premium-Testphase bietet Ihnen den vollen Funktionsumfang.
Nach Ablauf können Sie kostenlos als Gast weitermachen und Ihren Life Context
weiterhin selbst verwalten. Als registrierter Anwender (ab 3,90 € pro Monat)
profitieren Sie zusätzlich von der automatischen Verwaltung, einem individuell
erstellten Persönlichkeitsprofil und einer auf Sie abgestimmten Ansprache durch
unsere Coaching Profile. Premium-Zugänge sind wahlweise für 1, 3 oder 12 Monate
ab 9,90 € erhältlich.

Wenn Sie sich nicht für ein Konto angemeldet haben, können Sie diese E-Mail
einfach ignorieren.`
    };

    const htmlBodies = {
        en: `
        <table width="100%" cellpadding="0" cellspacing="0" style="font-family: sans-serif; line-height: 1.6;">
            <tr>
                <td align="center" style="padding: 0;">
                    <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

                        <!-- Header -->
                        <tr>
                            <td bgcolor="${brand.primaryColor}" style="background-color: ${brand.primaryColor}; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                                <h2 style="margin: 0; font-size: 24px; color: #ffffff; font-family: sans-serif;">Welcome to<br>${brand.appName}!</h2>
                                <p style="margin: 8px 0 0 0; color: #ffffff; font-family: sans-serif;">Your account includes <strong>14 days of free Premium access</strong></p>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td bgcolor="#f9fafb" style="background-color: #f9fafb; padding: 25px; color: #111827;">
                                <p style="color: #111827; margin-top: 0;">Please click the button below to activate your account. This link is valid for 24 hours.</p>
                                <p style="margin: 20px 0; text-align: center;">
                                    <a href="${confirmationUrl}" style="background-color: #22c55e; color: #ffffff; padding: 14px 30px; text-align: center; text-decoration: none; display: inline-block; border-radius: 8px; font-weight: bold; font-size: 16px; font-family: sans-serif;">Activate Account</a>
                                </p>

                                <h3 style="color: ${brand.primaryColor}; margin-top: 30px;">What's included in each plan?</h3>
                                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-size: 13px; margin-top: 10px; margin-bottom: 25px;">
                                    <thead>
                                        <tr>
                                            <th bgcolor="${brand.primaryColor}" style="background-color: ${brand.primaryColor}; color: #ffffff; padding: 8px; text-align: left; border: 1px solid #ddd;">Feature</th>
                                            <th bgcolor="${brand.primaryColor}" style="background-color: ${brand.primaryColor}; color: #ffffff; padding: 8px; text-align: center; border: 1px solid #ddd;">Guest</th>
                                            <th bgcolor="${brand.primaryColor}" style="background-color: ${brand.primaryColor}; color: #ffffff; padding: 8px; text-align: center; border: 1px solid #ddd;">Registered</th>
                                            <th bgcolor="#d4af37" style="background-color: #d4af37; color: #000000; padding: 8px; text-align: center; border: 1px solid #ddd;">Premium ⭐</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td style="padding: 6px 8px; border: 1px solid #eee;">Coaching Profiles</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">3</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">3 (2 optional)</td><td bgcolor="#fefce8" style="padding: 6px; text-align: center; border: 1px solid #eee; background-color: #fefce8;">5</td></tr>
                                        <tr bgcolor="#f3f4f6" style="background-color: #f3f4f6;"><td style="padding: 6px 8px; border: 1px solid #eee;">Interview Assistant</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">—</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">✅</td><td bgcolor="#fef9c3" style="padding: 6px; text-align: center; border: 1px solid #eee; background-color: #fef9c3;">✅</td></tr>
                                        <tr><td style="padding: 6px 8px; border: 1px solid #eee;">Saved Life Context</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">—</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">✅</td><td bgcolor="#fefce8" style="padding: 6px; text-align: center; border: 1px solid #eee; background-color: #fefce8;">✅</td></tr>
                                        <tr bgcolor="#f3f4f6" style="background-color: #f3f4f6;"><td style="padding: 6px 8px; border: 1px solid #eee;">Personality Profile</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">—</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">—</td><td bgcolor="#fef9c3" style="padding: 6px; text-align: center; border: 1px solid #eee; background-color: #fef9c3;">✅</td></tr>
                                        <tr><td style="padding: 6px 8px; border: 1px solid #eee;">Transcript Evaluation</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">—</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">—</td><td bgcolor="#fefce8" style="padding: 6px; text-align: center; border: 1px solid #eee; background-color: #fefce8;">✅</td></tr>
                                        <tr bgcolor="#f3f4f6" style="background-color: #f3f4f6;"><td style="padding: 6px 8px; border: 1px solid #eee;">Audio Recording</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">—</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">—</td><td bgcolor="#fef9c3" style="padding: 6px; text-align: center; border: 1px solid #eee; background-color: #fef9c3;">✅</td></tr>
                                        <tr><td style="padding: 6px 8px; border: 1px solid #eee;">Voice Mode</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">✅</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">✅</td><td bgcolor="#fefce8" style="padding: 6px; text-align: center; border: 1px solid #eee; background-color: #fefce8;">✅</td></tr>
                                        <tr bgcolor="#f3f4f6" style="background-color: #f3f4f6;"><td style="padding: 6px 8px; border: 1px solid #eee;">Unlimited Messages</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">50/week</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">✅</td><td bgcolor="#fef9c3" style="padding: 6px; text-align: center; border: 1px solid #eee; background-color: #fef9c3;">✅</td></tr>
                                    </tbody>
                                </table>

                                <div style="background: #e6f7ff; border-left: 4px solid ${brand.primaryColor}; padding: 12px 15px; margin-top: 0; margin-bottom: 20px; font-size: 13px; color: #111827;">
                                    <strong>Your 14-day Premium trial</strong> gives you full access to all features. After the trial, you can continue for free as a guest and still manage your Life Context yourself. As a registered user (from €3.90/month) you also benefit from automatic management, an individually created personality profile, and personalized guidance through our coaching profiles. Premium access is available for 1, 3, or 12 months from €9.90.
                                </div>

                                <p style="font-size: 10px; color: #888888;">If you cannot click the button, copy this URL: <a href="${confirmationUrl}" style="color: ${brand.primaryColor}; word-break: break-all;">${confirmationUrl}</a></p>
                                <p style="font-size: 12px; color: #555555;">If you did not sign up for an account, you can safely ignore this email.</p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td bgcolor="${brand.primaryColor}" style="background-color: ${brand.primaryColor}; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px;">
                                <p style="margin: 0; color: #ffffff; font-family: sans-serif;">${brand.appName}&nbsp;|&nbsp;<a href="${brand.providerUrl}" style="color: #ffffff; text-decoration: none;">www.${brand.providerName}</a></p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    `,
        de: `
        <table width="100%" cellpadding="0" cellspacing="0" style="font-family: sans-serif; line-height: 1.6;">
            <tr>
                <td align="center" style="padding: 0;">
                    <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

                        <!-- Header -->
                        <tr>
                            <td bgcolor="${brand.primaryColor}" style="background-color: ${brand.primaryColor}; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                                <h2 style="margin: 0; font-size: 24px; color: #ffffff; font-family: sans-serif;">Willkommen bei<br>${brand.appNameDe}!</h2>
                                <p style="margin: 8px 0 0 0; color: #ffffff; font-family: sans-serif;">Ihr Konto enthält <strong>14 Tage kostenlosen Premium-Zugang</strong></p>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td bgcolor="#f9fafb" style="background-color: #f9fafb; padding: 25px; color: #111827;">
                                <p style="color: #111827; margin-top: 0;">Bitte klicken Sie auf den untenstehenden Button, um Ihr Konto zu aktivieren. Dieser Link ist 24 Stunden gültig.</p>
                                <p style="margin: 20px 0; text-align: center;">
                                    <a href="${confirmationUrl}" style="background-color: #22c55e; color: #ffffff; padding: 14px 30px; text-align: center; text-decoration: none; display: inline-block; border-radius: 8px; font-weight: bold; font-size: 16px; font-family: sans-serif;">Konto aktivieren</a>
                                </p>

                                <h3 style="color: ${brand.primaryColor}; margin-top: 30px;">Was ist in welchem Plan enthalten?</h3>
                                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-size: 13px; margin-top: 10px; margin-bottom: 25px;">
                                    <thead>
                                        <tr>
                                            <th bgcolor="${brand.primaryColor}" style="background-color: ${brand.primaryColor}; color: #ffffff; padding: 8px; text-align: left; border: 1px solid #ddd;">Funktion</th>
                                            <th bgcolor="${brand.primaryColor}" style="background-color: ${brand.primaryColor}; color: #ffffff; padding: 8px; text-align: center; border: 1px solid #ddd;">Gast</th>
                                            <th bgcolor="${brand.primaryColor}" style="background-color: ${brand.primaryColor}; color: #ffffff; padding: 8px; text-align: center; border: 1px solid #ddd;">Registriert</th>
                                            <th bgcolor="#d4af37" style="background-color: #d4af37; color: #000000; padding: 8px; text-align: center; border: 1px solid #ddd;">Premium ⭐</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td style="padding: 6px 8px; border: 1px solid #eee;">Coaching Profile</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">3</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">3 (2 optional)</td><td bgcolor="#fefce8" style="padding: 6px; text-align: center; border: 1px solid #eee; background-color: #fefce8;">5</td></tr>
                                        <tr bgcolor="#f3f4f6" style="background-color: #f3f4f6;"><td style="padding: 6px 8px; border: 1px solid #eee;">Interview Assistent</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">—</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">✅</td><td bgcolor="#fef9c3" style="padding: 6px; text-align: center; border: 1px solid #eee; background-color: #fef9c3;">✅</td></tr>
                                        <tr><td style="padding: 6px 8px; border: 1px solid #eee;">Gespeicherter Life Context</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">—</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">✅</td><td bgcolor="#fefce8" style="padding: 6px; text-align: center; border: 1px solid #eee; background-color: #fefce8;">✅</td></tr>
                                        <tr bgcolor="#f3f4f6" style="background-color: #f3f4f6;"><td style="padding: 6px 8px; border: 1px solid #eee;">Persönlichkeitsprofil</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">—</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">—</td><td bgcolor="#fef9c3" style="padding: 6px; text-align: center; border: 1px solid #eee; background-color: #fef9c3;">✅</td></tr>
                                        <tr><td style="padding: 6px 8px; border: 1px solid #eee;">Transkript-Auswertung</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">—</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">—</td><td bgcolor="#fefce8" style="padding: 6px; text-align: center; border: 1px solid #eee; background-color: #fefce8;">✅</td></tr>
                                        <tr bgcolor="#f3f4f6" style="background-color: #f3f4f6;"><td style="padding: 6px 8px; border: 1px solid #eee;">Audioaufzeichnung</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">—</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">—</td><td bgcolor="#fef9c3" style="padding: 6px; text-align: center; border: 1px solid #eee; background-color: #fef9c3;">✅</td></tr>
                                        <tr><td style="padding: 6px 8px; border: 1px solid #eee;">Sprachmodus</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">✅</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">✅</td><td bgcolor="#fefce8" style="padding: 6px; text-align: center; border: 1px solid #eee; background-color: #fefce8;">✅</td></tr>
                                        <tr bgcolor="#f3f4f6" style="background-color: #f3f4f6;"><td style="padding: 6px 8px; border: 1px solid #eee;">Unbegrenzte Nachrichten</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">50/Woche</td><td style="padding: 6px; text-align: center; border: 1px solid #eee;">✅</td><td bgcolor="#fef9c3" style="padding: 6px; text-align: center; border: 1px solid #eee; background-color: #fef9c3;">✅</td></tr>
                                    </tbody>
                                </table>

                                <div style="background: #e6f7ff; border-left: 4px solid ${brand.primaryColor}; padding: 12px 15px; margin-top: 0; margin-bottom: 20px; font-size: 13px; color: #111827;">
                                    <strong>Ihre 14-tägige Premium-Testphase</strong> bietet Ihnen den vollen Funktionsumfang. Nach Ablauf können Sie kostenlos als Gast weitermachen und Ihren Life Context weiterhin selbst verwalten. Als registrierter Anwender (ab 3,90 € pro Monat) profitieren Sie zusätzlich von der automatischen Verwaltung, einem individuell erstellten Persönlichkeitsprofil und einer auf Sie abgestimmten Ansprache durch unsere Coaching Profile. Premium-Zugänge sind wahlweise für 1, 3 oder 12 Monate ab 9,90 € erhältlich.
                                </div>

                                <p style="font-size: 10px; color: #888888;">Wenn Sie den Button nicht anklicken können, kopieren Sie diese URL: <a href="${confirmationUrl}" style="color: ${brand.primaryColor}; word-break: break-all;">${confirmationUrl}</a></p>
                                <p style="font-size: 12px; color: #555555;">Wenn Sie sich nicht für ein Konto angemeldet haben, können Sie diese E-Mail einfach ignorieren.</p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td bgcolor="${brand.primaryColor}" style="background-color: ${brand.primaryColor}; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px;">
                                <p style="margin: 0; color: #ffffff; font-family: sans-serif;">${brand.appName}&nbsp;|&nbsp;<a href="${brand.providerUrl}" style="color: #ffffff; text-decoration: none;">www.${brand.providerName}</a></p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    `};
    
    const subject = subjects[language] || subjects['en'];
    const textBody = textBodies[language] || textBodies['en'];
    const htmlBody = htmlBodies[language] || htmlBodies['en'];

    if (!isProductionOrStaging) {
        console.log('\n--- SIMULATED EMAIL ---');
        console.log(`To: ${email}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body:\n${textBody}`);
        console.log('-----------------------\n');
        return;
    }

    if (!mailjet) {
        console.error('Mailjet client is not initialized. Cannot send confirmation email.');
        throw new Error('Email service is not configured.');
    }

    const request = mailjet
        .post('send', { 'version': 'v3.1' })
        .request({
            'Messages': [
                {
                    'From': {
                        'Email': SENDER_EMAIL,
                        'Name': SENDER_NAME
                    },
                    'To': [
                        {
                            'Email': email
                        }
                    ],
                    'Subject': subject,
                    'TextPart': textBody,
                    'HTMLPart': htmlBody
                }
            ]
        });

    return request;
};

const sendPasswordResetEmail = async (email, token, language = 'en') => {
    const resetUrl = `${FRONTEND_URL}?route=reset-password&token=${token}`;

    const subjects = {
        en: `Password Reset for Your ${brand.appName} Account`,
        de: `Passwort zurücksetzen für Ihr Konto bei ${brand.appNameDe}`
    };

    const textBodies = {
        en: `You requested a password reset. Click the following link to set a new password. This link is valid for 1 hour.\n\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`,
        de: `Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt. Klicken Sie auf den folgenden Link, um ein neues Passwort festzulegen. Dieser Link ist 1 Stunde gültig.\n\n${resetUrl}\n\nWenn Sie dies nicht angefordert haben, können Sie diese E-Mail einfach ignorieren.`
    };

    const htmlBodies = {
        en: `
        <div style="font-family: sans-serif; line-height: 1.6;">
            <h3>Password Reset Request</h3>
            <p>You requested a password reset for your account. Please click the link below to set a new password. This link is valid for 1 hour.</p>
            <p style="margin: 20px 0;">
                <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px; font-weight: bold;">Reset Password</a>
            </p>
            <p>If you cannot click the link, please copy and paste this URL into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>If you did not request this, you can safely ignore this email.</p>
        </div>
    `,
        de: `
        <div style="font-family: sans-serif; line-height: 1.6;">
            <h3>Anfrage zum Zurücksetzen des Passworts</h3>
            <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts für Ihr Konto gestellt. Bitte klicken Sie auf den untenstehenden Link, um ein neues Passwort festzulegen. Dieser Link ist 1 Stunde gültig.</p>
            <p style="margin: 20px 0;">
                <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px; font-weight: bold;">Passwort zurücksetzen</a>
            </p>
            <p>Wenn Sie den Link nicht anklicken können, kopieren Sie bitte diese URL und fügen Sie sie in Ihren Browser ein:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>Wenn Sie dies nicht angefordert haben, können Sie diese E-Mail einfach ignorieren.</p>
        </div>
    `
    };
    
    const subject = subjects[language] || subjects['en'];
    const textBody = textBodies[language] || textBodies['en'];
    const htmlBody = htmlBodies[language] || htmlBodies['en'];

    if (!isProductionOrStaging) {
        console.log('\n--- SIMULATED EMAIL ---');
        console.log(`To: ${email}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${textBody}`);
        console.log('-----------------------\n');
        return;
    }

    if (!mailjet) {
        console.error('Mailjet client is not initialized. Cannot send password reset email.');
        throw new Error('Email service is not configured.');
    }

    const request = mailjet
        .post('send', { 'version': 'v3.1' })
        .request({
            'Messages': [
                {
                    'From': {
                        'Email': SENDER_EMAIL,
                        'Name': SENDER_NAME
                    },
                    'To': [
                        {
                            'Email': email
                        }
                    ],
                    'Subject': subject,
                    'TextPart': textBody,
                    'HTMLPart': htmlBody
                }
            ]
        });

    return request;
};


// Product names for emails
const getProductName = (botId) => {
  const names = {
    'REGISTERED_1M': { de: 'Registriert 1-Monats-Pass', en: 'Registered 1-Month Pass' },
    'REGISTERED_LIFETIME': { de: 'Registered Lifetime-Zugang', en: 'Registered Lifetime Access' },
    'ACCESS_PASS_1M': { de: 'Premium 1-Monats-Pass', en: 'Premium 1-Month Pass' },
    'ACCESS_PASS_3M': { de: 'Premium 3-Monats-Pass', en: 'Premium 3-Month Pass' },
    'ACCESS_PASS_1Y': { de: 'Premium 1-Jahres-Pass', en: 'Premium 1-Year Pass' },
    'kenji-stoic': { de: 'Kenji - Stoischer Coach', en: 'Kenji - Stoic Coach' },
    'chloe-cbt': { de: 'Chloe - Reflektions-Coach', en: 'Chloe - Reflection Coach' }
  };
  return names[botId] || { de: botId, en: botId };
};

const sendPurchaseEmail = async (email, name, code, botId) => {
  const productName = getProductName(botId);
  const redeemUrl = `${FRONTEND_URL}?route=redeem&code=${code}`;
  const firstName = name ? name.split(' ')[0] : '';

  const htmlBody = `
    <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, ${brand.primaryColor} 0%, ${brand.primaryColorDark} 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">🎉 Vielen Dank für deinen Kauf!</h1>
      </div>
      
      <div style="padding: 30px; background: #f9fafb;">
        <p style="font-size: 16px;">${firstName ? `Hallo ${firstName},` : 'Hallo,'}</p>
        <p style="font-size: 16px;">dein <strong>${productName.de}</strong> wurde erfolgreich aktiviert!</p>
        
        <div style="background: white; border: 2px solid ${brand.primaryColor}; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Dein Freischaltcode:</p>
          <p style="font-size: 32px; font-weight: bold; color: ${brand.primaryColor}; letter-spacing: 4px; margin: 0;">${code}</p>
        </div>

        <h3 style="color: ${brand.primaryColor};">So löst du deinen Code ein:</h3>
        <ol style="line-height: 1.8;">
          <li>Melde dich bei <strong>${brand.appName}</strong> an</li>
          <li>Öffne das Menü und wähle <strong>"Code einlösen"</strong></li>
          <li>Gib deinen Code ein: <strong>${code}</strong></li>
        </ol>

        <p style="margin: 30px 0; text-align: center;">
          <a href="${redeemUrl}" 
             style="background-color: ${brand.primaryColor}; color: white; padding: 14px 30px; 
                    text-decoration: none; display: inline-block; border-radius: 8px; 
                    font-weight: bold; font-size: 16px;">
            Jetzt Code einlösen
          </a>
        </p>

        <div style="background: #e6f7ff; border-left: 4px solid ${brand.primaryColor}; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;"><strong>💡 Tipp:</strong> Speichere diese E-Mail für deine Unterlagen. Bei Fragen stehe ich dir gerne zur Verfügung!</p>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="font-size: 14px; color: #666;">
          Bei Fragen oder Problemen erreichst du mich unter:<br>
          <a href="mailto:${brand.contactEmail}" style="color: ${brand.primaryColor};">${brand.contactEmail}</a>
        </p>
      </div>

      <div style="background: ${brand.primaryColor}; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">${brand.appName}&nbsp;|&nbsp;www.${brand.providerName}</p>
        <p style="margin: 5px 0 0 0;">${brand.ownerName}</p>
      </div>
    </div>
  `;

  if (!isProductionOrStaging) {
    console.log('\n--- SIMULATED PURCHASE EMAIL ---');
    console.log(`To: ${email}`);
    console.log(`Subject: ✅ Dein ${productName.de} ist aktiviert!`);
    console.log(`Code: ${code}`);
    console.log(`Product: ${productName.de}`);
    console.log('-------------------------------\n');
    return;
  }

  if (!mailjet) {
    console.error('Mailjet client is not initialized. Cannot send purchase email.');
    throw new Error('Email service is not configured.');
  }

  const request = mailjet.post('send', { version: 'v3.1' }).request({
    Messages: [{
      From: { Email: SENDER_EMAIL, Name: SENDER_NAME },
      To: [{ Email: email, Name: name }],
      Subject: `✅ Dein ${productName.de} ist aktiviert!`,
      TextPart: `Dein Freischaltcode: ${code}\n\nLöse ihn ein unter: ${redeemUrl}`,
      HTMLPart: htmlBody
    }]
  });

  return request;
};

const sendAdminNotification = async (customerEmail, customerName, code, botId, amount) => {
  const productName = getProductName(botId);
  const adminEmail = process.env.ADMIN_EMAIL || brand.contactEmail;

  const htmlBody = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2 style="color: ${brand.primaryColor};">🛒 Neuer Kauf</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Produkt:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${productName.de}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Kunde:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${customerName} (${customerEmail})</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Code:</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><code>${code}</code></td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Betrag:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">€${amount.toFixed(2)}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Zeitpunkt:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${new Date().toLocaleString('de-DE')}</td></tr>
      </table>
    </div>
  `;

  if (!isProductionOrStaging) {
    console.log('\n--- SIMULATED ADMIN NOTIFICATION ---');
    console.log(`To: ${adminEmail}`);
    console.log(`Subject: 🛒 Neuer Kauf: ${productName.de}`);
    console.log(`Customer: ${customerName} (${customerEmail})`);
    console.log(`Code: ${code}`);
    console.log(`Amount: €${amount.toFixed(2)}`);
    console.log('-------------------------------------\n');
    return;
  }

  if (!mailjet) {
    console.error('Mailjet client is not initialized. Cannot send admin notification.');
    throw new Error('Email service is not configured.');
  }

  const request = mailjet.post('send', { version: 'v3.1' }).request({
    Messages: [{
      From: { Email: SENDER_EMAIL, Name: SENDER_NAME },
      To: [{ Email: adminEmail }],
      Subject: `🛒 Neuer Kauf: ${productName.de}`,
      HTMLPart: htmlBody
    }]
  });

  return request;
};

const sendNewsletterEmail = async (email, subject, content, language = 'de') => {
    // content should contain: { textBody, htmlBody, unsubscribeToken }
    
    // Generate unsubscribe link
    const unsubscribeUrl = content.unsubscribeToken 
        ? `${FRONTEND_URL}?route=unsubscribe&token=${content.unsubscribeToken}`
        : null;
    
    const unsubscribeTexts = {
        de: '\n\n---\nSie möchten keine weiteren Newsletter erhalten? Klicken Sie hier zum Abmelden:\n',
        en: '\n\n---\nDon\'t want to receive further newsletters? Click here to unsubscribe:\n'
    };
    
    // Append unsubscribe link to text body
    let finalTextBody = content.textBody;
    if (unsubscribeUrl) {
        finalTextBody += unsubscribeTexts[language] || unsubscribeTexts['de'];
        finalTextBody += unsubscribeUrl;
    }
    
    // Append unsubscribe link to HTML body
    let finalHtmlBody = content.htmlBody;
    if (unsubscribeUrl) {
        const unsubscribeHtml = language === 'de' 
            ? `<hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
               <p style="text-align: center; font-size: 12px; color: #6b7280;">
                 Sie möchten keine weiteren Newsletter erhalten?<br>
                 <a href="${unsubscribeUrl}" style="color: ${brand.primaryColor}; text-decoration: underline;">Hier klicken zum Abmelden</a>
               </p>`
            : `<hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
               <p style="text-align: center; font-size: 12px; color: #6b7280;">
                 Don't want to receive further newsletters?<br>
                 <a href="${unsubscribeUrl}" style="color: ${brand.primaryColor}; text-decoration: underline;">Click here to unsubscribe</a>
               </p>`;
        finalHtmlBody += unsubscribeHtml;
    }
    
    if (!isProductionOrStaging) {
        console.log('\n--- SIMULATED NEWSLETTER ---');
        console.log(`To: ${email}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body:\n${finalTextBody}`);
        if (unsubscribeUrl) {
            console.log(`Unsubscribe URL: ${unsubscribeUrl}`);
        }
        console.log('----------------------------\n');
        return;
    }

    if (!mailjet) {
        console.error('Mailjet client is not initialized. Cannot send newsletter.');
        throw new Error('Email service is not configured.');
    }

    const request = mailjet
        .post('send', { 'version': 'v3.1' })
        .request({
            'Messages': [
                {
                    'From': {
                        'Email': SENDER_EMAIL,
                        'Name': SENDER_NAME
                    },
                    'To': [
                        {
                            'Email': email
                        }
                    ],
                    'Subject': subject,
                    'TextPart': finalTextBody,
                    'HTMLPart': finalHtmlBody
                }
            ]
        });

    return request;
};

module.exports = {
    sendConfirmationEmail,
    sendPasswordResetEmail,
    sendPurchaseEmail,
    sendAdminNotification,
    sendNewsletterEmail
};