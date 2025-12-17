import React, { useState, useRef, useEffect } from 'react';
import { useLocalization } from '../context/LocalizationContext';

export type ExperimentalMode = 'OFF' | 'DPC' | 'DPFL';

interface ExperimentalModeSelectorProps {
  currentMode: ExperimentalMode;
  onModeChange: (mode: ExperimentalMode) => void;
  onClose: () => void;
  onOpenInfo: () => void;
  adaptationMode?: 'adaptive' | 'stable'; // From personality profile
}

const ExperimentalModeSelector: React.FC<ExperimentalModeSelectorProps> = ({
  currentMode,
  onModeChange,
  onClose,
  onOpenInfo,
  adaptationMode = 'adaptive' // Default to adaptive if not provided
}) => {
  const { t } = useLocalization();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isDpflDisabled = adaptationMode === 'stable';

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
      description: t('experimental_mode_off_desc'),
      disabled: false
    },
    {
      id: 'DPC' as ExperimentalMode,
      label: t('experimental_mode_dpc'),
      description: t('experimental_mode_dpc_desc'),
      disabled: false
    },
    {
      id: 'DPFL' as ExperimentalMode,
      label: t('experimental_mode_dpfl'),
      description: t('experimental_mode_dpfl_desc'),
      disabled: isDpflDisabled
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
            onClick={() => !mode.disabled && handleModeSelect(mode.id)}
            disabled={mode.disabled}
            className={`w-full px-4 py-3 text-left transition-colors ${
              mode.disabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-background-primary dark:hover:bg-background-secondary'
            } ${
              currentMode === mode.id ? 'bg-green-50 dark:bg-green-900/20' : ''
            }`}
            title={mode.disabled ? t('experimental_mode_dpfl_disabled_tooltip') : undefined}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <input
                  type="radio"
                  checked={currentMode === mode.id}
                  disabled={mode.disabled}
                  onChange={() => {}}
                  className="w-4 h-4 text-green-600 focus:ring-green-500 disabled:opacity-50"
                />
              </div>
              <div className="flex-1">
                <div className={`text-sm font-medium ${
                  mode.disabled
                    ? 'text-content-secondary line-through'
                    : currentMode === mode.id 
                      ? 'text-green-700 dark:text-green-400' 
                      : 'text-content-primary dark:text-content-primary'
                }`}>
                  {mode.label}
                  {mode.disabled && <span className="ml-1">🔒</span>}
                </div>
                <div className="text-xs text-content-secondary dark:text-content-secondary mt-0.5">
                  {mode.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* DPFL Disabled Warning */}
      {isDpflDisabled && (
        <div className="mx-4 mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-xs text-yellow-800 dark:text-yellow-300">
            <strong>⚠️ {t('experimental_mode_dpfl_disabled_title') || 'DPFL nicht verfügbar'}:</strong><br />
            {t('experimental_mode_dpfl_disabled_msg') || 
              'Dein Profil ist auf "Statisch" eingestellt. DPFL benötigt ein adaptives Profil.'}
          </p>
        </div>
      )}

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

