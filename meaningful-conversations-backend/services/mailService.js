const Mailjet = require('node-mailjet');

const mailjet = Mailjet.apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_SECRET_KEY
);

const SENDER_EMAIL = process.env.MAILJET_SENDER_EMAIL;
const SENDER_NAME = "Meaningful Conversations";
const FRONTEND_URL = process.env.FRONTEND_URL;

const sendEmail = async (toEmail, subject, htmlPart, textPart) => {
    try {
        const request = await mailjet.post("send", { 'version': 'v3.1' }).request({
            "Messages": [{
                "From": {
                    "Email": SENDER_EMAIL,
                    "Name": SENDER_NAME
                },
                "To": [{
                    "Email": toEmail
                }],
                "Subject": subject,
                "TextPart": textPart,
                "HTMLPart": htmlPart
            }]
        });
        console.log(`Email sent to ${toEmail}. Status: ${request.body.Messages[0].Status}`);
    } catch (err) {
        console.error(`Failed to send email to ${toEmail}:`, err.statusCode, err.response.text);
        // We throw the error so the calling function knows the email failed
        throw new Error('Failed to send email.');
    }
};

const sendConfirmationEmail = async (toEmail, token, subjectPrefix = '') => {
    const confirmationLink = `${FRONTEND_URL}/?route=verify-email&token=${token}`;
    const subject = `${subjectPrefix}Confirm your Account for Meaningful Conversations`.trim();
    const htmlPart = `
        <h3>Welcome to Meaningful Conversations!</h3>
        <p>Please click the link below to activate your account. This link is valid for 24 hours.</p>
        <p><a href="${confirmationLink}">Activate Account</a></p>
        <p>If you cannot click the link, please copy and paste this URL into your browser:</p>
        <p>${confirmationLink}</p>
        <p>If you did not sign up for an account, you can safely ignore this email.</p>
    `;
    const textPart = `
        Welcome to Meaningful Conversations!
        Please copy and paste this URL into your browser to activate your account: ${confirmationLink}
        This link is valid for 24 hours.
        If you did not sign up for an account, you can safely ignore this email.
    `;

    await sendEmail(toEmail, subject, htmlPart, textPart);
};

const sendPasswordResetEmail = async (toEmail, token) => {
    const resetLink = `${FRONTEND_URL}/?route=reset-password&token=${token}`;
    const subject = "Reset Your Meaningful Conversations Password";
    const htmlPart = `
        <h3>Password Reset Request</h3>
        <p>We received a request to reset the password for your account. Please click the link below to set a new password. This link is valid for 1 hour.</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>If you cannot click the link, please copy and paste this URL into your browser:</p>
        <p>${resetLink}</p>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
    `;
    const textPart = `
        Password Reset Request
        Please copy and paste this URL into your browser to reset your password: ${resetLink}
        This link is valid for 1 hour.
        If you did not request a password reset, you can safely ignore this email.
    `;

    await sendEmail(toEmail, subject, htmlPart, textPart);
};

module.exports = {
    sendConfirmationEmail,
    sendPasswordResetEmail
};
