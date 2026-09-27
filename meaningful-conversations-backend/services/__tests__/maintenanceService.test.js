jest.mock('../../prismaClient.js', () => ({
    maintenanceWindow: {
        findFirst: jest.fn(),
    },
}));

const prisma = require('../../prismaClient.js');
const {
    getCurrentMaintenanceNotice,
    validateMaintenancePayload,
    maintenanceDbErrorResponse,
} = require('../maintenanceService');

const validBody = {
    startsAt: '2026-10-04T00:00:00.000Z',
    endsAt: '2026-10-04T03:00:00.000Z',
    announceAt: '2026-10-02T00:00:00.000Z',
    titleDe: 'Wartung',
    titleEn: 'Maintenance',
    bodyDe: 'Kurz offline.',
    bodyEn: 'Briefly offline.',
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('validateMaintenancePayload', () => {
    it('accepts a window announced before it starts', () => {
        expect(validateMaintenancePayload(validBody)).toBeNull();
    });

    it('rejects an end that is not after the start', () => {
        expect(validateMaintenancePayload({
            ...validBody,
            endsAt: '2026-10-04T00:00:00.000Z',
        })).toMatch(/endsAt/);
    });

    it('rejects an announcement after the start', () => {
        expect(validateMaintenancePayload({
            ...validBody,
            announceAt: '2026-10-04T01:00:00.000Z',
        })).toMatch(/announceAt/);
    });

    it('requires both languages', () => {
        expect(validateMaintenancePayload({ ...validBody, titleEn: '  ' })).toMatch(/titleEn/);
    });
});

describe('maintenanceDbErrorResponse', () => {
    it('maps missing table to migration hint', () => {
        const res = maintenanceDbErrorResponse({ code: 'P2021' });
        expect(res?.status).toBe(503);
        expect(res?.body.code).toBe('MAINTENANCE_MIGRATION_REQUIRED');
    });
});

describe('getCurrentMaintenanceNotice', () => {
    it('prefers the active window', async () => {
        prisma.maintenanceWindow.findFirst.mockResolvedValueOnce({ id: 'active' });
        const notice = await getCurrentMaintenanceNotice(new Date('2026-10-04T01:00:00.000Z'));
        expect(notice).toMatchObject({ id: 'active', phase: 'active' });
        expect(prisma.maintenanceWindow.findFirst).toHaveBeenCalledTimes(1);
    });

    it('falls back to the next announced window', async () => {
        prisma.maintenanceWindow.findFirst
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ id: 'next' });
        const notice = await getCurrentMaintenanceNotice(new Date('2026-10-03T01:00:00.000Z'));
        expect(notice).toMatchObject({ id: 'next', phase: 'upcoming' });
    });

    it('returns null when nothing is announced', async () => {
        prisma.maintenanceWindow.findFirst.mockResolvedValue(null);
        await expect(getCurrentMaintenanceNotice()).resolves.toBeNull();
    });
});
