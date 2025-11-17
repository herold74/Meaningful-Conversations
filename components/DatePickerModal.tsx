import React, { useState, useEffect } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { formatDateToISO } from '../utils/dateParser';

interface DatePickerModalProps {
    isOpen: boolean;
    action: string;
    suggestedDate: Date | null;
    onConfirm: (date: Date) => void;
    onCancel: () => void;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
    isOpen,
    action,
    suggestedDate,
    onConfirm,
    onCancel,
}) => {
    const { t } = useLocalization();
    const [selectedDate, setSelectedDate] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            if (suggestedDate) {
                setSelectedDate(formatDateToISO(suggestedDate));
            } else {
                // Default to tomorrow
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setSelectedDate(formatDateToISO(tomorrow));
            }
        }
    }, [isOpen, suggestedDate]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (selectedDate) {
            const [year, month, day] = selectedDate.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            onConfirm(date);
        }
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            onClick={handleOverlayClick}
        >
            <div className="bg-background-primary dark:bg-background-primary border border-border-primary dark:border-border-primary rounded-lg shadow-lg max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-content-primary dark:text-content-primary mb-4">
                    {t('datePicker_title')}
                </h3>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-content-secondary dark:text-content-secondary mb-2">
                        {t('datePicker_action')}
                    </label>
                    <p className="text-content-primary dark:text-content-primary bg-background-secondary dark:bg-background-secondary p-3 rounded border border-border-primary dark:border-border-primary">
                        {action}
                    </p>
                </div>

                <div className="mb-6">
                    <label htmlFor="date-input" className="block text-sm font-medium text-content-secondary dark:text-content-secondary mb-2">
                        {t('datePicker_selectDate')}
                    </label>
                    <input
                        id="date-input"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3 py-2 border border-border-primary dark:border-border-primary rounded-md bg-background-primary dark:bg-background-primary text-content-primary dark:text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary dark:focus:ring-accent-secondary"
                    />
                </div>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-content-secondary dark:text-content-secondary hover:bg-background-tertiary dark:hover:bg-background-tertiary rounded-md transition-colors"
                    >
                        {t('datePicker_cancel')}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedDate}
                        className="px-4 py-2 bg-accent-primary dark:bg-accent-secondary text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('datePicker_confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DatePickerModal;

