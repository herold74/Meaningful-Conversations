import React from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { useBackendVersion } from '../hooks/useBackendVersion';

/** App (build) + connected API version — used in menu and About. */
export const VersionLabels: React.FC<{ className?: string; align?: 'left' | 'center' }> = ({
  className = '',
  align = 'left',
}) => {
  const { t } = useLocalization();
  const { backend, loading } = useBackendVersion();
  const alignClass = align === 'center' ? 'text-center' : 'text-left';

  const appVersion = import.meta.env.VITE_APP_VERSION || 'unknown';
  const build = import.meta.env.VITE_BUILD_NUMBER;

  let backendLine: string;
  if (loading) {
    backendLine = t('version_backend_loading');
  } else if (backend?.version) {
    backendLine = backend.prisma
      ? t('version_backend_with_prisma', { version: backend.version, prisma: backend.prisma })
      : t('version_backend', { version: backend.version });
  } else {
    backendLine = t('version_backend_unavailable');
  }

  return (
    <div className={`text-xs text-content-subtle space-y-0.5 ${alignClass} ${className}`}>
      <p>
        {t('version_app_label')} {appVersion}
        {build ? ` (${t('version_build', { build })})` : ''}
      </p>
      <p>{backendLine}</p>
    </div>
  );
};
