import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '../services/api';

export type BackendHealthInfo = {
  version: string;
  prisma?: string | null;
};

type HealthResponse = {
  status?: string;
  version?: string;
  prisma?: string | null;
};

/**
 * Fetches public /api/health once per mount — version + Prisma for staging parity checks.
 */
export function useBackendVersion(): {
  backend: BackendHealthInfo | null;
  loading: boolean;
} {
  const [backend, setBackend] = useState<BackendHealthInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const base = getApiBaseUrl();
    const url = base ? `${base}/api/health` : '/api/health';

    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: HealthResponse) => {
        if (cancelled || data.status !== 'ok' || !data.version) return;
        setBackend({ version: data.version, prisma: data.prisma ?? null });
      })
      .catch(() => {
        if (!cancelled) setBackend(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { backend, loading };
}
