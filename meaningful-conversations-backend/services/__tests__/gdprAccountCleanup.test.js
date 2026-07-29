const {
    anonymizePurchasesForEmail,
    clearPersonalityProfileOnPasswordReset,
    deleteTicketsForEmail,
    findTicketsForEmail,
    ticketPayloadEmail,
} = require('../gdprAccountCleanup.js');

jest.mock('../../prismaClient.js', () => require('../../__mocks__/prismaClient.js'));

const prisma = require('../../prismaClient.js');

describe('gdprAccountCleanup', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('ticketPayloadEmail', () => {
        it('returns email from payload object', () => {
            expect(ticketPayloadEmail({ payload: { email: 'user@example.com' } })).toBe('user@example.com');
        });

        it('returns null for invalid payload', () => {
            expect(ticketPayloadEmail({ payload: null })).toBeNull();
            expect(ticketPayloadEmail({ payload: { email: 'not-an-email' } })).toBeNull();
        });
    });

    describe('findTicketsForEmail', () => {
        it('filters tickets by payload email', async () => {
            prisma.ticket.findMany.mockResolvedValue([
                { id: 't1', payload: { email: 'match@example.com' } },
                { id: 't2', payload: { email: 'other@example.com' } },
            ]);

            const result = await findTicketsForEmail('match@example.com');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('t1');
        });
    });

    describe('deleteTicketsForEmail', () => {
        it('deletes matched tickets only', async () => {
            prisma.ticket.findMany.mockResolvedValue([
                { id: 't1', payload: { email: 'user@example.com' } },
                { id: 't2', payload: { email: 'other@example.com' } },
            ]);
            prisma.ticket.deleteMany.mockResolvedValue({ count: 1 });

            const result = await deleteTicketsForEmail('user@example.com');
            expect(prisma.ticket.deleteMany).toHaveBeenCalledWith({
                where: { id: { in: ['t1'] } },
            });
            expect(result.count).toBe(1);
        });
    });

    describe('anonymizePurchasesForEmail', () => {
        it('anonymizes purchase PII fields', async () => {
            prisma.purchase.updateMany.mockResolvedValue({ count: 2 });

            await anonymizePurchasesForEmail('buyer@example.com', 'user-123');

            expect(prisma.purchase.updateMany).toHaveBeenCalledWith({
                where: { customerEmail: 'buyer@example.com' },
                data: {
                    customerEmail: 'anonymized-user-123@deleted.local',
                    customerName: null,
                    paypalPayload: null,
                },
            });
        });
    });

    describe('clearPersonalityProfileOnPasswordReset', () => {
        it('deletes personality profile for user', async () => {
            prisma.personalityProfile.deleteMany.mockResolvedValue({ count: 1 });

            await clearPersonalityProfileOnPasswordReset('user-123');

            expect(prisma.personalityProfile.deleteMany).toHaveBeenCalledWith({
                where: { userId: 'user-123' },
            });
        });
    });
});
