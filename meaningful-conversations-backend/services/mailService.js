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
const SENDER_NAME = 'Meaningful Conversations';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const sendConfirmationEmail = async (email, token) => {
    const confirmationUrl = `${FRONTEND_URL}?route=verify-email&token=${token}`;

    const textBody = `Welcome to Meaningful Conversations!\n\nPlease click the link below to activate your account. This link is valid for 24 hours.\n\n${confirmationUrl}\n\nIf you did not sign up for an account, you can safely ignore this email.`;
    const htmlBody = `
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
    `;

    if (!isProductionOrStaging) {
        console.log('\n--- SIMULATED EMAIL ---');
        console.log(`To: ${email}`);
        console.log('Subject: Activate Your Account');
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
                    'Subject': 'Activate Your Meaningful Conversations Account',
                    'TextPart': textBody,
                    'HTMLPart': htmlBody
                }
            ]
        });

    return request;
};

const sendPasswordResetEmail = async (email, token) => {
    const resetUrl = `${FRONTEND_URL}?route=reset-password&token=${token}`;

    if (!isProductionOrStaging) {
        console.log('\n--- SIMULATED EMAIL ---');
        console.log(`To: ${email}`);
        console.log('Subject: Password Reset Request');
        console.log('Body: You requested a password reset. Click the link below to set a new password:');
        console.log(resetUrl);
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
                    'Subject': 'Password Reset for Your Meaningful Conversations Account',
                    'TextPart': `You requested a password reset. Click the following link to set a new password: ${resetUrl}`,
                    'HTMLPart': `<h3>Password Reset Request</h3><p>You requested a password reset for your account. Please click the link below to set a new password:</p><p><a href="${resetUrl}">Reset Password</a></p><p>If you did not request this, you can safely ignore this email.</p>`
                }
            ]
        });

    return request;
};


module.exports = {
    sendConfirmationEmail,
    sendPasswordResetEmail
};