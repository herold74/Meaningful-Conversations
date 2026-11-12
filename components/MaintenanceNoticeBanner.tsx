import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CalendarClock } from 'lucide-react';
import { useLocalization } from '../context/LocalizationContext';
import { useMaintenanceNotice } from '../hooks/useMaintenanceNotice';
import {
    formatMaintenanceWindow,
    maintenanceNoticeCopy,
} from '../utils/maintenanceNotice';

interface MaintenanceNoticeBannerProps {
    /** Fixed overlay offset from viewport top (below app bar when present). */
    top: string;
}

const MaintenanceNoticeBanner: React.FC<MaintenanceNoticeBannerProps> = ({ top }) => {
    const { t, language } = useLocalization();
    const { notice, visible, dismiss } = useMaintenanceNotice();

    if (!visible || !notice) return null;

    const copy = maintenanceNoticeCopy(notice, language);
    const range = formatMaintenanceWindow(notice.startsAt, notice.endsAt, language);
    const isActive = notice.phase === 'active';
    const kicker = isActive
        ? t('maintenance_banner_kicker_active')
        : t('maintenance_banner_kicker_upcoming');
    const expectation = isActive
        ? t('maintenance_banner_expectation_active')
        : t('maintenance_banner_expectation');
    const showBody = copy.body.trim() && copy.body.trim() !== copy.title.trim();

    const shellClass = isActive
        ? 'border-l-status-warning-foreground bg-status-warning-background/95 ring-status-warning-border/50 dark:bg-status-warning-background/90'
        : 'border-l-accent-primary bg-accent-primary/12 ring-accent-primary/35 dark:bg-accent-primary/15';

    const kickerClass = isActive
        ? 'bg-status-warning-foreground/15 text-status-warning-foreground'
        : 'bg-accent-primary/20 text-accent-primary dark:text-accent-primary';

    const Icon = isActive ? AlertTriangle : CalendarClock;

    return createPortal(
        <div
            className="fixed left-0 right-0 z-[45] px-3 sm:px-4 pointer-events-none"
            style={{ top }}
            role="presentation"
        >
            <div
                className={`pointer-events-auto mx-auto w-full max-w-3xl rounded-xl border border-border-primary/80 border-l-[5px] px-3 py-3 sm:px-4 sm:py-3.5 text-left shadow-lg ring-1 backdrop-blur-md ${shellClass}`}
                role="status"
                aria-live="polite"
            >
                <div className="flex gap-3 sm:gap-4">
                    <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${kickerClass}`}
                        aria-hidden
                    >
                        <Icon className="h-5 w-5" strokeWidth={2.25} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                            <span
                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] ${kickerClass}`}
                            >
                                {kicker}
                            </span>
                            {notice.phase === 'upcoming' && (
                                <button
                                    type="button"
                                    onClick={dismiss}
                                    className="text-xs font-semibold text-accent-primary hover:underline sm:text-sm"
                                >
                                    {t('maintenance_banner_dismiss')}
                                </button>
                            )}
                        </div>
                        <p className="mt-1.5 text-base font-semibold leading-snug text-content-primary sm:text-lg">
                            {copy.title}
                        </p>
                        {showBody && (
                            <p className="mt-1 text-sm leading-snug text-content-secondary">
                                {copy.body}
                            </p>
                        )}
                        <p className="mt-2 text-sm font-medium leading-snug text-content-primary">
                            {range.localLabel}
                            {range.showVienna && (
                                <span className="mt-0.5 block text-xs font-normal text-content-subtle sm:mt-0 sm:inline">
                                    {' '}
                                    ({t('maintenance_banner_vienna', { range: range.viennaLabel })})
                                </span>
                            )}
                        </p>
                        <p className="mt-1.5 text-xs leading-relaxed text-content-secondary sm:text-sm">
                            {expectation}
                        </p>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default MaintenanceNoticeBanner;
