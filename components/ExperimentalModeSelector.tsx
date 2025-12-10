import React, { useState, useRef, useEffect } from 'react';
import { useLocalization } from '../context/LocalizationContext';

export type ExperimentalMode = 'OFF' | 'DPC' | 'DPFL';

interface ExperimentalModeSelectorProps {
  currentMode: ExperimentalMode;
  onModeChange: (mode: ExperimentalMode) => void;
  onClose: () => void;
  onOpenInfo: () => void;
}

const ExperimentalModeSelector: React.FC<ExperimentalModeSelectorProps> = ({
  currentMode,
  onModeChange,
  onClose,
  onOpenInfo
}) => {
  const { t } = useLocalization();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleModeSelect = (mode: ExperimentalMode) => {
    onModeChange(mode);
    onClose();
  };

  const modes = [
    {
      id: 'OFF' as ExperimentalMode,
      label: t('experimental_mode_off'),
      description: t('experimental_mode_off_desc')
    },
    {
      id: 'DPC' as ExperimentalMode,
      label: t('experimental_mode_dpc'),
      description: t('experimental_mode_dpc_desc')
    },
    {
      id: 'DPFL' as ExperimentalMode,
      label: t('experimental_mode_dpfl'),
      description: t('experimental_mode_dpfl_desc')
    }
  ];

  return (
    <div
      ref={dropdownRef}
      className="absolute top-8 right-0 z-50 w-64 bg-background-secondary dark:bg-background-primary border border-border-secondary dark:border-border-primary rounded-lg shadow-lg overflow-hidden"
      style={{ animation: 'fadeIn 0.15s ease-out' }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-secondary dark:border-border-primary">
        <h3 className="text-sm font-semibold text-content-primary dark:text-content-primary flex items-center gap-2">
          🧪 {t('experimental_mode_title')}
        </h3>
      </div>

      {/* Options */}
      <div className="py-2">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => handleModeSelect(mode.id)}
            className={`w-full px-4 py-3 text-left hover:bg-background-primary dark:hover:bg-background-secondary transition-colors ${
              currentMode === mode.id ? 'bg-green-50 dark:bg-green-900/20' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <input
                  type="radio"
                  checked={currentMode === mode.id}
                  onChange={() => {}}
                  className="w-4 h-4 text-green-600 focus:ring-green-500"
                />
              </div>
              <div className="flex-1">
                <div className={`text-sm font-medium ${
                  currentMode === mode.id 
                    ? 'text-green-700 dark:text-green-400' 
                    : 'text-content-primary dark:text-content-primary'
                }`}>
                  {mode.label}
                </div>
                <div className="text-xs text-content-secondary dark:text-content-secondary mt-0.5">
                  {mode.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border-secondary dark:border-border-primary">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenInfo();
          }}
          className="text-xs text-accent-primary hover:text-accent-secondary dark:text-accent-primary dark:hover:text-accent-secondary flex items-center gap-1 transition-colors"
        >
          <span>ℹ️</span>
          <span>{t('experimental_mode_info_link')}</span>
        </button>
      </div>
    </div>
  );
};

export default ExperimentalModeSelector;

