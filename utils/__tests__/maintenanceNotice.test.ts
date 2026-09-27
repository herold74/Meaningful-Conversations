import type { NavView } from '../../types';
import {
    datetimeLocalToIso,
    formatMaintenanceWindow,
    isMaintenanceBannerHidden,
    shouldShowMaintenanceNotice,
    toDatetimeLocalValue,
    type MaintenanceNotice,
} from '../maintenanceNotice';

const notice = (phase: MaintenanceNotice['phase'], id = 'win-1'): MaintenanceNotice => ({
    id,
    phase,
    startsAt: '2026-10-04T00:00:00.000Z',
    endsAt: '2026-10-04T03:00:00.000Z',
    announceAt: '2026-10-02T00:00:00.000Z',
    titleDe: 'Wartung',
    titleEn: 'Maintenance',
    bodyDe: 'Kurz offline.',
    bodyEn: 'Briefly offline.',
});

describe('maintenance notice visibility', () => {
    it('hides credential screens and the splash, and shows the guest entry', () => {
        expect(isMaintenanceBannerHidden('login')).toBe(true);
        expect(isMaintenanceBannerHidden('register')).toBe(true);
        expect(isMaintenanceBannerHidden('welcome')).toBe(true);
        expect(isMaintenanceBannerHidden('auth')).toBe(false);
        expect(isMaintenanceBannerHidden('botSelection')).toBe(false);
        expect(isMaintenanceBannerHidden('landing' as NavView)).toBe(false);
    });

    it('lets upcoming notices be dismissed by id and always shows an active window', () => {
        expect(shouldShowMaintenanceNotice(null, null)).toBe(false);
        expect(shouldShowMaintenanceNotice(notice('upcoming'), null)).toBe(true);
        expect(shouldShowMaintenanceNotice(notice('upcoming'), 'win-1')).toBe(false);
        expect(shouldShowMaintenanceNotice(notice('upcoming', 'win-2'), 'win-1')).toBe(true);
        expect(shouldShowMaintenanceNotice(notice('active'), 'win-1')).toBe(true);
    });
});

describe('maintenance window formatting', () => {
    it('formats the local range and adds Vienna when the zone differs', () => {
        const range = formatMaintenanceWindow(
            '2026-10-04T00:00:00.000Z',
            '2026-10-04T03:00:00.000Z',
            'en',
            'America/New_York',
        );
        expect(range.showVienna).toBe(true);
        expect(range.localLabel).toContain('20:00');
        expect(range.localLabel).toContain('23:00');
        expect(range.viennaLabel).toContain('02:00');
        expect(range.viennaLabel).toContain('05:00');
    });

    it('omits the Vienna line when the viewer is already in Vienna', () => {
        const range = formatMaintenanceWindow(
            '2026-10-04T00:00:00.000Z',
            '2026-10-04T03:00:00.000Z',
            'de',
            'Europe/Vienna',
        );
        expect(range.showVienna).toBe(false);
        expect(range.localLabel).toContain('02:00');
    });

    it('round-trips datetime-local values in the runtime timezone', () => {
        const local = new Date(2026, 9, 4, 2, 30);
        const value = toDatetimeLocalValue(local.toISOString());
        expect(value).toBe('2026-10-04T02:30');
        expect(datetimeLocalToIso(value)).toBe(local.toISOString());
    });
});
