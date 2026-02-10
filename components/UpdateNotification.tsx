import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocalization } from '../context/LocalizationContext';
import { useModalOpen } from '../utils/modalUtils';
import Button from './shared/Button';

interface UpdateNotificationProps {
  onUpdate: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onUpdate }) => {
  const { t } = useLocalization();
  const [show, setShow] = useState(false);
  useModalOpen(show);

  useEffect(() => {
    // Check if service worker is supported
    if ('serviceWorker' in navigator) {
      // Listen for service worker updates
      navigator.serviceWorker.ready.then((registration) => {
        // Check for updates every 60 seconds
        setInterval(() => {
          registration.update();
        }, 60000);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is ready to take over
                setShow(true);
              }
            });
          }
        });
      });

      // Check for waiting service worker on mount
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
          setShow(true);
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    setShow(false);
    onUpdate();
  };

  if (!show) return null;

  return createPortal(
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] animate-slideDown">
      <div className="bg-accent-primary text-button-foreground-on-accent px-6 py-4 rounded-lg shadow-2xl border-2 border-accent-primary-hover max-w-md">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">{t('update_available_title') || 'Update verfügbar!'}</p>
            <p className="text-xs opacity-90">{t('update_available_desc') || 'Eine neue Version der App ist verfügbar.'}</p>
          </div>
          <Button
            onClick={handleUpdate}
            size="sm"
            className="flex-shrink-0 bg-white text-accent-primary hover:bg-gray-100"
          >
            {t('update_now') || 'Aktualisieren'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UpdateNotification;

