const prisma = require('../prismaClient.js');

/**
 * Returns the maintenance notice to show now, or null.
 * Priority: active window (startsAt <= now <= endsAt), else next announced upcoming window.
 */
async function getCurrentMaintenanceNotice(now = new Date()) {
    const baseWhere = {
        archivedAt: null,
        announceAt: { lte: now },
        endsAt: { gte: now },
    };

    const active = await prisma.maintenanceWindow.findFirst({
        where: {
            ...baseWhere,
            startsAt: { lte: now },
        },
        orderBy: { startsAt: 'asc' },
    });
    if (active) {
        return { ...active, phase: 'active' };
    }

    const upcoming = await prisma.maintenanceWindow.findFirst({
        where: {
            ...baseWhere,
            startsAt: { gt: now },
        },
        orderBy: { startsAt: 'asc' },
    });
    if (upcoming) {
        return { ...upcoming, phase: 'upcoming' };
    }

    return null;
}

function validateMaintenancePayload(body) {
    const { startsAt, endsAt, announceAt, titleDe, titleEn, bodyDe, bodyEn } = body || {};
    const starts = new Date(startsAt);
    const ends = new Date(endsAt);
    const announce = new Date(announceAt);
    if ([starts, ends, announce].some((d) => Number.isNaN(d.getTime()))) {
        return 'Invalid date fields.';
    }
    if (ends <= starts) {
        return 'endsAt must be after startsAt.';
    }
    if (announce > starts) {
        return 'announceAt must be at or before startsAt.';
    }
    for (const [key, val] of [
        ['titleDe', titleDe],
        ['titleEn', titleEn],
        ['bodyDe', bodyDe],
        ['bodyEn', bodyEn],
    ]) {
        if (!val || typeof val !== 'string' || !val.trim()) {
            return `${key} is required.`;
        }
    }
    return null;
}

function maintenanceDbErrorResponse(error) {
    if (error?.code === 'P2021') {
        return {
            status: 503,
            body: {
                error: 'Maintenance windows database table is missing. Run prisma migrate deploy on the server.',
                code: 'MAINTENANCE_MIGRATION_REQUIRED',
            },
        };
    }
    return null;
}

module.exports = {
    getCurrentMaintenanceNotice,
    validateMaintenancePayload,
    maintenanceDbErrorResponse,
};
