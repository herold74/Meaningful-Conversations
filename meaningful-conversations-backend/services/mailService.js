const Mailjet = require('node-mailjet');

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
const SENDER_NAME = 'Meaningful Conversations | www.manualmode.at';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const sendConfirmationEmail = async (email, token, lang = 'en') => {
    const confirmationUrl = `${FRONTEND_URL}?route=verify-email&token=${token}`;

    const subjects = {
        en: 'Activate Your Meaningful Conversations Account',
        de: 'Aktivieren Sie Ihr Konto bei Sinnstiftende Gespräche'
    };

    const textBodies = {
        en: `Welcome to Meaningful Conversations!\n\nPlease click the link below to activate your account. This link is valid for 24 hours.\n\n${confirmationUrl}\n\nIf you did not sign up for an account, you can safely ignore this email.`,
        de: `Willkommen bei Sinnstiftende Gespräche!\n\nBitte klicken Sie auf den untenstehenden Link, um Ihr Konto zu aktivieren. Dieser Link ist 24 Stunden lang gültig.\n\n${confirmationUrl}\n\nWenn Sie sich nicht für ein Konto angemeldet haben, können Sie diese E-Mail einfach ignorieren.`
    };

    const htmlBodies = {
        en: `
        <div style="font-family: sans-serif; line-height: 1.6;">
            <h3>Welcome to Meaningful Conversations!</h3>
            <p>Please click the link below to activate your account. This link is valid for 24 hours.</p>
            <p style="margin: 20px 0;">
                <a href="${confirmationUrl}" style="background-color: #22c55e; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px; font-weight: bold;">Activate Account</a>
            </p>
            <p>If you cannot click the link, please copy and paste this URL into your browser:</p>
            <p><a href="${confirmationUrl}">${confirmationUrl}</a></p>
            <p>If you did not sign up for an account, you can safely ignore this email.</p>
        </div>
    `,
        de: `
        <div style="font-family: sans-serif; line-height: 1.6;">
            <h3>Willkommen bei Sinnstiftende Gespräche!</h3>
            <p>Bitte klicken Sie auf den untenstehenden Link, um Ihr Konto zu aktivieren. Dieser Link ist 24 Stunden lang gültig.</p>
            <p style="margin: 20px 0;">
                <a href="${confirmationUrl}" style="background-color: #22c55e; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px; font-weight: bold;">Konto aktivieren</a>
            </p>
            <p>Wenn Sie den Link nicht anklicken können, kopieren Sie bitte diese URL und fügen Sie sie in Ihren Browser ein:</p>
            <p><a href="${confirmationUrl}">${confirmationUrl}</a></p>
            <p>Wenn Sie sich nicht für ein Konto angemeldet haben, können Sie diese E-Mail einfach ignorieren.</p>
        </div>
    `};
    
    const subject = subjects[lang] || subjects['en'];
    const textBody = textBodies[lang] || textBodies['en'];
    const htmlBody = htmlBodies[lang] || htmlBodies['en'];

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

const sendPasswordResetEmail = async (email, token, lang = 'en') => {
    const resetUrl = `${FRONTEND_URL}?route=reset-password&token=${token}`;

    const subjects = {
        en: 'Password Reset for Your Meaningful Conversations Account',
        de: 'Passwort zurücksetzen für Ihr Konto bei Sinnstiftende Gespräche'
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
    
    const subject = subjects[lang] || subjects['en'];
    const textBody = textBodies[lang] || textBodies['en'];
    const htmlBody = htmlBodies[lang] || htmlBodies['en'];

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


module.exports = {
    sendConfirmationEmail,
    sendPasswordResetEmail
};