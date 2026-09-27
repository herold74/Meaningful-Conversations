import type { NavView } from '../types';

export const MAINTENANCE_DISMISS_KEY = 'maintenanceNoticeDismissedId';

/** Credential screens and the short splash. Guests enter via `auth` and keep the banner. */
const HIDDEN_VIEWS = new Set<NavView>([
    'welcome',
    'login',
    'register',
    'forgotPassword',
    'registrationPending',
    'verifyEmail',
    'resetPassword',
]);

export interface MaintenanceNotice {
    id: string;
    phase: 'upcoming' | 'active';
    startsAt: string;
    endsAt: string;
    announceAt: string;
    titleDe: string;
    titleEn: string;
    bodyDe: string;
    bodyEn: string;
}

export function isMaintenanceBannerHidden(view: NavView): boolean {
    return HIDDEN_VIEWS.has(view);
}

export function shouldShowMaintenanceNotice(
    notice: MaintenanceNotice | null,
    dismissedId: string | null,
): boolean {
    if (!notice) return false;
    if (notice.phase === 'active') return true;
    return dismissedId !== notice.id;
}

export function maintenanceNoticeCopy(
    notice: MaintenanceNotice,
    language: string,
): { title: string; body: string } {
    if (language === 'de') {
        return { title: notice.titleDe, body: notice.bodyDe };
    }
    return { title: notice.titleEn, body: notice.bodyEn };
}

export function readDismissedMaintenanceId(storage: Pick<Storage, 'getItem'> | null): string | null {
    try {
        return storage?.getItem(MAINTENANCE_DISMISS_KEY) ?? null;
    } catch {
        return null;
    }
}

export function writeDismissedMaintenanceId(storage: Pick<Storage, 'setItem'> | null, id: string): void {
    try {
        storage?.setItem(MAINTENANCE_DISMISS_KEY, id);
    } catch {
        // Private mode or blocked storage — banner can stay visible.
    }
}

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

/** `datetime-local` value in the browser timezone. */
export function toDatetimeLocalValue(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function datetimeLocalToIso(value: string): string {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
        throw new Error('Invalid datetime');
    }
    return d.toISOString();
}

function formatRange(start: Date, end: Date, locale: string, timeZone: string): string {
    const fmt = new Intl.DateTimeFormat(locale, {
        timeZone,
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    });
    return `${fmt.format(start)} – ${fmt.format(end)}`;
}

export function formatMaintenanceWindow(
    startsAt: string,
    endsAt: string,
    locale: string,
    timeZone?: string,
): { localLabel: string; viennaLabel: string; showVienna: boolean } {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const localTz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const loc = locale === 'de' ? 'de-AT' : 'en-GB';
    return {
        localLabel: formatRange(start, end, loc, localTz),
        viennaLabel: formatRange(start, end, loc, 'Europe/Vienna'),
        showVienna: localTz !== 'Europe/Vienna',
    };
}
