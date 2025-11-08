import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { DownloadIcon } from './icons/DownloadIcon';
import { getSession } from '../services/api';

const DataExportView: React.FC = () => {
    const { t } = useLocalization();
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        setError(null);
        setSuccess(false);

        try {
            const session = getSession();
            if (!session || !session.token) {
                throw new Error('Not authenticated');
            }

            // Determine API base URL (same logic as in api.ts)
            const hostname = window.location.hostname;
            const port = window.location.port;
            const hostnameWithPort = port ? `${hostname}:${port}` : hostname;
            
            const backendMap: { [key: string]: string } = {
                'mc-beta.manualmode.at': '',
                'mc-app.manualmode.at': '',
                '91.99.193.87': '',
            };
            
            const apiBaseUrl = backendMap[hostnameWithPort] || '';

            const response = await fetch(`${apiBaseUrl}/api/data/export`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to export data');
            }

            // Get the filename from Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'meaningful-conversations-data-export.json';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            // Download the file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setSuccess(true);
        } catch (err: any) {
            console.error('Export error:', err);
            setError(err.message || t('export_data_error'));
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-8 space-y-6 bg-background-secondary dark:bg-transparent border border-border-secondary dark:border-border-primary my-10 animate-fadeIn rounded-lg shadow-lg">
            <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-content-primary uppercase">
                    {t('export_data_title')}
                </h1>
            </div>

            <div className="space-y-4 text-content-secondary">
                <p>{t('export_data_description')}</p>

                <div className="p-4 bg-accent-secondary dark:bg-accent-secondary-dark rounded-lg border border-accent-primary">
                    <h3 className="font-semibold text-content-primary mb-2">{t('export_data_includes')}</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>{t('export_data_includes_account')}</li>
                        <li>{t('export_data_includes_gamification')}</li>
                        <li>{t('export_data_includes_context')}</li>
                        <li>{t('export_data_includes_feedback')}</li>
                        <li>{t('export_data_includes_codes')}</li>
                        <li>{t('export_data_includes_api')}</li>
                    </ul>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-400 dark:border-yellow-600">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>{t('export_data_note_title')}:</strong> {t('export_data_note_encrypted')}
                    </p>
                </div>

                {error && (
                    <div className="p-4 bg-status-danger-background rounded-lg border border-status-danger-border">
                        <p className="text-status-danger-foreground text-sm">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="p-4 bg-status-success-background rounded-lg border border-status-success-border">
                        <p className="text-status-success-foreground text-sm">{t('export_data_success')}</p>
                    </div>
                )}
            </div>

            <div className="flex justify-center pt-4">
                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="inline-flex items-center justify-center gap-3 px-8 py-3 text-base font-bold text-white bg-accent-primary uppercase hover:bg-accent-primary-hover disabled:bg-accent-disabled disabled:cursor-not-allowed rounded-lg shadow-md transition-colors"
                >
                    <DownloadIcon className="w-5 h-5" />
                    {isExporting ? t('export_data_downloading') : t('export_data_button')}
                </button>
            </div>

            <div className="pt-4 text-sm text-content-subtle text-center">
                <p>{t('export_data_gdpr_note')}</p>
            </div>
        </div>
    );
};

export default DataExportView;

