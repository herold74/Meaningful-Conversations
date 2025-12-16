import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { DownloadIcon } from './icons/DownloadIcon';
import { getSession, getApiBaseUrl } from '../services/api';
import Button from './shared/Button';

interface DataExportViewProps {
    lifeContext?: string; // The decrypted life context from App.tsx
}

const DataExportView: React.FC<DataExportViewProps> = ({ lifeContext = '' }) => {
    const { t } = useLocalization();
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [exportFormat, setExportFormat] = useState<'html' | 'json'>('html'); // Default to HTML

    const handleExport = async () => {
        setIsExporting(true);
        setError(null);
        setSuccess(false);

        try {
            const session = getSession();
            if (!session || !session.token) {
                throw new Error('Not authenticated');
            }

            // Get API base URL using the same logic as other API calls
            const apiBaseUrl = getApiBaseUrl();

            // Get current language
            const currentLanguage = localStorage.getItem('language') || 'de';

            // Prepare request body with decrypted life context for GDPR compliance
            const requestBody = lifeContext ? JSON.stringify({ decryptedLifeContext: lifeContext }) : undefined;

            const response = await fetch(`${apiBaseUrl}/api/data/export?format=${exportFormat}&lang=${currentLanguage}`, {
                method: 'POST', // Changed to POST to send decrypted context
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.token}`,
                },
                body: requestBody,
            });

            if (!response.ok) {
                throw new Error('Failed to export data');
            }

            // Get the filename from Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            const defaultExtension = exportFormat === 'html' ? 'html' : 'json';
            let filename = `meaningful-conversations-data-export.${defaultExtension}`;
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

                {/* Format Selection */}
                <div className="p-4 bg-background-primary dark:bg-background-secondary rounded-lg border border-border-secondary">
                    <h3 className="font-semibold text-content-primary mb-4">{t('export_data_format')}</h3>
                    <div className="space-y-3">
                        <label className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            exportFormat === 'html' 
                                ? 'border-accent-primary bg-accent-secondary dark:bg-accent-secondary-dark' 
                                : 'border-border-secondary hover:border-accent-primary'
                        }`}>
                            <input
                                type="radio"
                                name="exportFormat"
                                value="html"
                                checked={exportFormat === 'html'}
                                onChange={(e) => setExportFormat(e.target.value as 'html')}
                                className="mt-1 mr-3"
                            />
                            <div className="flex-1">
                                <div className="font-semibold text-content-primary">{t('export_data_format_html')}</div>
                                <div className="text-sm text-content-secondary mt-1">{t('export_data_format_html_desc')}</div>
                            </div>
                        </label>

                        <label className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            exportFormat === 'json' 
                                ? 'border-accent-primary bg-accent-secondary dark:bg-accent-secondary-dark' 
                                : 'border-border-secondary hover:border-accent-primary'
                        }`}>
                            <input
                                type="radio"
                                name="exportFormat"
                                value="json"
                                checked={exportFormat === 'json'}
                                onChange={(e) => setExportFormat(e.target.value as 'json')}
                                className="mt-1 mr-3"
                            />
                            <div className="flex-1">
                                <div className="font-semibold text-content-primary">{t('export_data_format_json')}</div>
                                <div className="text-sm text-content-secondary mt-1">{t('export_data_format_json_desc')}</div>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-400 dark:border-green-600">
                    <p className="text-sm text-green-800 dark:text-green-200">
                        {t('export_data_gdpr_compliance')}
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
                <Button onClick={handleExport} disabled={isExporting} size="lg" leftIcon={<DownloadIcon className="w-5 h-5" />}>
                    {isExporting ? t('export_data_downloading') : t('export_data_button')}
                </Button>
            </div>

            <div className="pt-4 text-sm text-content-subtle text-center">
                <p>{t('export_data_gdpr_note')}</p>
            </div>
        </div>
    );
};

export default DataExportView;

