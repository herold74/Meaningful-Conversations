/**
 * GDPR account cleanup helpers (Art. 17 / Art. 20).
 * Purchase records are anonymized (retained for accounting); tickets matched by payload email are deleted.
 */

const prisma = require('../prismaClient.js');

const ANONYMIZED_EMAIL_DOMAIN = 'deleted.local';

function anonymizedPurchaseEmail(userId) {
    return `anonymized-${userId}@${ANONYMIZED_EMAIL_DOMAIN}`;
}

function ticketPayloadEmail(ticket) {
    const payload = ticket?.payload;
    if (!payload || typeof payload !== 'object') return null;
    const email = payload.email;
    return typeof email === 'string' && email.includes('@') ? email : null;
}

async function findTicketsForEmail(email) {
    const tickets = await prisma.ticket.findMany({ orderBy: { createdAt: 'desc' } });
    return tickets.filter((t) => ticketPayloadEmail(t) === email);
}

async function deleteTicketsForEmail(email) {
    const matched = await findTicketsForEmail(email);
    if (matched.length === 0) {
        return { count: 0 };
    }
    return prisma.ticket.deleteMany({
        where: { id: { in: matched.map((t) => t.id) } },
    });
}

async function anonymizePurchasesForEmail(email, userId) {
    return prisma.purchase.updateMany({
        where: { customerEmail: email },
        data: {
            customerEmail: anonymizedPurchaseEmail(userId),
            customerName: null,
            paypalPayload: null,
        },
    });
}

async function clearPersonalityProfileOnPasswordReset(userId) {
    return prisma.personalityProfile.deleteMany({ where: { userId } });
}

module.exports = {
    anonymizedPurchaseEmail,
    anonymizePurchasesForEmail,
    clearPersonalityProfileOnPasswordReset,
    deleteTicketsForEmail,
    findTicketsForEmail,
    ticketPayloadEmail,
};
