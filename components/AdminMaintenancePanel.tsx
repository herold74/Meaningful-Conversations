import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '../services/api';
import { useLocalization } from '../context/LocalizationContext';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ChevronUpIcon } from './icons/ChevronUpIcon';
import { datetimeLocalToIso, toDatetimeLocalValue } from '../utils/maintenanceNotice';

interface MaintenanceWindowRow {
    id: string;
    startsAt: string;
    endsAt: string;
    announceAt: string;
    titleDe: string;
    titleEn: string;
    bodyDe: string;
    bodyEn: string;
    archivedAt: string | null;
}

type FormState = {
    id: string | null;
    startsAt: string;
    endsAt: string;
    announceAt: string;
    titleDe: string;
    titleEn: string;
    bodyDe: string;
    bodyEn: string;
};

function maintenancePanelErrorMessage(err: unknown, t: (key: string) => string): string {
    if (err instanceof ApiError) {
        if (err.data?.code === 'MAINTENANCE_MIGRATION_REQUIRED') {
            return t('admin_maintenance_migration_required');
        }
        return err.message;
    }
    if (err instanceof Error && err.message) {
        return err.message;
    }
    return t('admin_maintenance_error');
}

const emptyForm = (): FormState => ({
    id: null,
    startsAt: '',
    endsAt: '',
    announceAt: '',
    titleDe: '',
    titleEn: '',
    bodyDe: '',
    bodyEn: '',
});

function phaseOf(row: MaintenanceWindowRow, now = Date.now()): 'archived' | 'past' | 'active' | 'upcoming' | 'scheduled' {
    if (row.archivedAt) return 'archived';
    const start = new Date(row.startsAt).getTime();
    const end = new Date(row.endsAt).getTime();
    const announce = new Date(row.announceAt).getTime();
    if (now > end) return 'past';
    if (now >= start && now <= end) return 'active';
    if (now >= announce && now < start) return 'upcoming';
    return 'scheduled';
}

const inputClass = 'w-full p-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-accent-primary rounded-lg';

const AdminMaintenancePanel: React.FC = () => {
    const { t } = useLocalization();
    const [open, setOpen] = useState(false);
    const [rows, setRows] = useState<MaintenanceWindowRow[]>([]);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        const data = await apiFetch('/admin/maintenance-windows');
        setRows(Array.isArray(data) ? data : []);
    }, []);

    useEffect(() => {
        if (!open) return;
        load().catch((err) => setError(maintenancePanelErrorMessage(err, t)));
    }, [open, load, t]);

    const setField = (key: keyof FormState, value: string) => {
        setSaved(false);
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const payload = () => ({
        startsAt: datetimeLocalToIso(form.startsAt),
        endsAt: datetimeLocalToIso(form.endsAt),
        announceAt: datetimeLocalToIso(form.announceAt),
        titleDe: form.titleDe.trim(),
        titleEn: form.titleEn.trim(),
        bodyDe: form.bodyDe.trim(),
        bodyEn: form.bodyEn.trim(),
    });

    const save = async () => {
        setError('');
        setSaved(false);
        setBusy(true);
        try {
            const body = JSON.stringify(payload());
            if (form.id) {
                await apiFetch(`/admin/maintenance-windows/${form.id}`, { method: 'PUT', body });
            } else {
                await apiFetch('/admin/maintenance-windows', { method: 'POST', body });
            }
            setForm(emptyForm());
            setSaved(true);
            await load();
        } catch (err: unknown) {
            setError(maintenancePanelErrorMessage(err, t));
        } finally {
            setBusy(false);
        }
    };

    const archive = async (id: string) => {
        setError('');
        setBusy(true);
        try {
            await apiFetch(`/admin/maintenance-windows/${id}/archive`, { method: 'POST' });
            if (form.id === id) setForm(emptyForm());
            await load();
        } catch (err: unknown) {
            setError(maintenancePanelErrorMessage(err, t));
        } finally {
            setBusy(false);
        }
    };

    const edit = (row: MaintenanceWindowRow) => {
        setSaved(false);
        setForm({
            id: row.id,
            startsAt: toDatetimeLocalValue(row.startsAt),
            endsAt: toDatetimeLocalValue(row.endsAt),
            announceAt: toDatetimeLocalValue(row.announceAt),
            titleDe: row.titleDe,
            titleEn: row.titleEn,
            bodyDe: row.bodyDe,
            bodyEn: row.bodyEn,
        });
    };

    const phaseLabel = (phase: ReturnType<typeof phaseOf>) => t(`admin_maintenance_phase_${phase}`);

    return (
        <div className="border border-border-primary rounded-lg overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between p-4 bg-background-secondary dark:bg-background-tertiary hover:bg-background-tertiary dark:hover:bg-gray-800 transition-colors"
            >
                <span className="text-lg font-bold text-content-primary">{t('admin_maintenance_title')}</span>
                {open ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
            </button>
            {open && (
                <div className="p-4 space-y-4 border-t border-border-primary">
                    <p className="text-sm text-content-secondary">{t('admin_maintenance_hint')}</p>
                    <p className="text-xs text-content-subtle">{t('admin_maintenance_local_time_hint')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <label className="text-sm text-content-secondary space-y-1">
                            <span>{t('admin_maintenance_starts')}</span>
                            <input type="datetime-local" className={inputClass} value={form.startsAt} onChange={(e) => setField('startsAt', e.target.value)} />
                        </label>
                        <label className="text-sm text-content-secondary space-y-1">
                            <span>{t('admin_maintenance_ends')}</span>
                            <input type="datetime-local" className={inputClass} value={form.endsAt} onChange={(e) => setField('endsAt', e.target.value)} />
                        </label>
                        <label className="text-sm text-content-secondary space-y-1">
                            <span>{t('admin_maintenance_announce')}</span>
                            <input type="datetime-local" className={inputClass} value={form.announceAt} onChange={(e) => setField('announceAt', e.target.value)} />
                        </label>
                    </div>
                    <button
                        type="button"
                        onClick={() => setField('announceAt', toDatetimeLocalValue(new Date().toISOString()))}
                        className="text-sm font-semibold text-accent-primary hover:underline"
                    >
                        {t('admin_maintenance_announce_now')}
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="text-sm text-content-secondary space-y-1">
                            <span>{t('admin_maintenance_title_de')}</span>
                            <input maxLength={200} className={inputClass} value={form.titleDe} onChange={(e) => setField('titleDe', e.target.value)} />
                        </label>
                        <label className="text-sm text-content-secondary space-y-1">
                            <span>{t('admin_maintenance_title_en')}</span>
                            <input maxLength={200} className={inputClass} value={form.titleEn} onChange={(e) => setField('titleEn', e.target.value)} />
                        </label>
                        <label className="text-sm text-content-secondary space-y-1">
                            <span>{t('admin_maintenance_body_de')}</span>
                            <textarea rows={3} className={inputClass} value={form.bodyDe} onChange={(e) => setField('bodyDe', e.target.value)} placeholder={t('maintenance_banner_expectation')} />
                        </label>
                        <label className="text-sm text-content-secondary space-y-1">
                            <span>{t('admin_maintenance_body_en')}</span>
                            <textarea rows={3} className={inputClass} value={form.bodyEn} onChange={(e) => setField('bodyEn', e.target.value)} placeholder={t('maintenance_banner_expectation')} />
                        </label>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {saved && <p className="text-sm text-content-secondary">{t('admin_maintenance_saved')}</p>}
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => { void save(); }}
                            className="px-4 py-2 text-sm font-bold uppercase rounded-lg gradient-accent disabled:opacity-60"
                        >
                            {form.id ? t('admin_maintenance_update') : t('admin_maintenance_save')}
                        </button>
                        {form.id && (
                            <button type="button" onClick={() => setForm(emptyForm())} className="px-4 py-2 text-sm font-semibold text-content-secondary">
                                {t('admin_maintenance_cancel')}
                            </button>
                        )}
                    </div>
                    {rows.length === 0 ? (
                        <p className="text-sm text-content-subtle">{t('admin_maintenance_empty')}</p>
                    ) : (
                        <ul className="space-y-2">
                            {rows.map((row) => {
                                const phase = phaseOf(row);
                                return (
                                    <li key={row.id} className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-content-primary truncate">{row.titleDe}</p>
                                            <p className="text-xs text-content-subtle">
                                                {phaseLabel(phase)} · {toDatetimeLocalValue(row.startsAt).replace('T', ' ')} – {toDatetimeLocalValue(row.endsAt).replace('T', ' ')}
                                            </p>
                                        </div>
                                        <div className="flex gap-3 shrink-0">
                                            <button type="button" onClick={() => edit(row)} className="text-sm font-semibold text-accent-primary hover:underline">
                                                {t('admin_maintenance_edit')}
                                            </button>
                                            {!row.archivedAt && (
                                                <button type="button" disabled={busy} onClick={() => { void archive(row.id); }} className="text-sm font-semibold text-content-secondary hover:underline">
                                                    {t('admin_maintenance_archive')}
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminMaintenancePanel;
