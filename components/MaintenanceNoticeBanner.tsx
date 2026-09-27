import React from 'react';
import { createPortal } from 'react-dom';
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
    const kicker = notice.phase === 'active'
        ? t('maintenance_banner_kicker_active')
        : t('maintenance_banner_kicker_upcoming');
    const expectation = notice.phase === 'active'
        ? t('maintenance_banner_expectation_active')
        : t('maintenance_banner_expectation');
    const showBody = copy.body.trim() && copy.body.trim() !== copy.title.trim();

    return createPortal(
        <div
            className="fixed left-0 right-0 z-[45] px-4 pointer-events-none"
            style={{ top }}
            role="presentation"
        >
            <div
                className="pointer-events-auto mx-auto w-full max-w-3xl rounded-lg border border-accent-primary/35 bg-background-primary/95 px-3 py-2 text-left shadow-md backdrop-blur-sm dark:bg-background-secondary/95"
                role="status"
                aria-live="polite"
            >
                <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-accent-primary leading-none">
                            {kicker}
                        </p>
                        <p className="text-sm font-medium text-content-primary leading-snug">
                            {copy.title}
                            {showBody && (
                                <span className="font-normal text-content-secondary">
                                    {' '}
                                    — {copy.body}
                                </span>
                            )}
                        </p>
                        <p className="text-xs text-content-secondary leading-snug">
                            {range.localLabel}
                            {range.showVienna && (
                                <>
                                    {' '}
                                    ({t('maintenance_banner_vienna', { range: range.viennaLabel })})
                                </>
                            )}
                            {' · '}
                            {expectation}
                        </p>
                    </div>
                    {notice.phase === 'upcoming' && (
                        <button
                            type="button"
                            onClick={dismiss}
                            className="shrink-0 max-w-[9rem] text-right text-[11px] font-semibold leading-tight text-accent-primary hover:underline sm:max-w-none"
                        >
                            {t('maintenance_banner_dismiss')}
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default MaintenanceNoticeBanner;
