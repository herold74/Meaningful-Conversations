jest.mock('../../prismaClient.js', () => require('../../__mocks__/prismaClient.js'));

const prisma = require('../../prismaClient.js');
const { isTokenInvalidated, invalidateTokensForUser } = require('../tokenInvalidation.js');

describe('isTokenInvalidated', () => {
    it('treats a deleted account as invalidated', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        await expect(isTokenInvalidated('missing-user-token-check', 1_700_000_000)).resolves.toBe(true);
    });

    it('keeps a token that was issued after the invalidation timestamp', async () => {
        const userId = 'active-user-token-check';
        prisma.user.findUnique.mockResolvedValue({
            tokensInvalidatedAt: new Date(1_600_000_000 * 1000),
        });
        await expect(isTokenInvalidated(userId, 1_700_000_000)).resolves.toBe(false);
    });
});

describe('invalidateTokensForUser', () => {
    it('writes tokensInvalidatedAt', async () => {
        prisma.user.update.mockResolvedValue({});
        await invalidateTokensForUser('user-to-revoke');
        expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'user-to-revoke' },
            data: expect.objectContaining({ tokensInvalidatedAt: expect.any(Date) }),
        }));
    });
});
