import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import {
    readDismissedMaintenanceId,
    shouldShowMaintenanceNotice,
    writeDismissedMaintenanceId,
    type MaintenanceNotice,
} from '../utils/maintenanceNotice';

const CACHE_MS = 5 * 60 * 1000;

let cache: { at: number; notice: MaintenanceNotice | null } | null = null;

async function loadNotice(force: boolean): Promise<MaintenanceNotice | null> {
    if (!force && cache && Date.now() - cache.at < CACHE_MS) {
        return cache.notice;
    }
    const data = await apiFetch('/maintenance/current');
    const notice = (data?.notice ?? null) as MaintenanceNotice | null;
    cache = { at: Date.now(), notice };
    return notice;
}

export function useMaintenanceNotice() {
    const [notice, setNotice] = useState<MaintenanceNotice | null>(
        cache && Date.now() - cache.at < CACHE_MS ? cache.notice : null,
    );
    const [dismissedId, setDismissedId] = useState<string | null>(() =>
        readDismissedMaintenanceId(typeof localStorage === 'undefined' ? null : localStorage),
    );

    const refresh = useCallback(async (force = false) => {
        try {
            const next = await loadNotice(force);
            setNotice(next);
        } catch {
            // Banner is optional; a failed fetch must not block the app.
        }
    }, []);

    useEffect(() => {
        void refresh(false);
    }, [refresh]);

    useEffect(() => {
        if (!notice) return;
        const boundary = notice.phase === 'upcoming' ? notice.startsAt : notice.endsAt;
        const ms = new Date(boundary).getTime() - Date.now();
        if (ms <= 0 || ms > 6 * 60 * 60 * 1000) return;
        const timer = window.setTimeout(() => {
            void refresh(true);
        }, ms + 500);
        return () => window.clearTimeout(timer);
    }, [notice, refresh]);

    const dismiss = useCallback(() => {
        if (!notice || notice.phase !== 'upcoming') return;
        writeDismissedMaintenanceId(typeof localStorage === 'undefined' ? null : localStorage, notice.id);
        setDismissedId(notice.id);
    }, [notice]);

    return {
        notice,
        visible: shouldShowMaintenanceNotice(notice, dismissedId),
        dismiss,
    };
}
