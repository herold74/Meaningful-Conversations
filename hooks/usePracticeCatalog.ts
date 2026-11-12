import { useCallback, useEffect, useState } from 'react';
import type { Language, PracticeCatalog } from '../types';
import * as geminiService from '../services/geminiService';
import { findPracticeScenarioConcern } from '../utils/practiceCatalogLookup';

export function usePracticeCatalog(language: Language) {
  const [catalog, setCatalog] = useState<PracticeCatalog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void geminiService
      .getPracticeCatalog(language)
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch(() => {
        if (!cancelled) setCatalog(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  const concernForScenario = useCallback(
    (scenarioId: string) => findPracticeScenarioConcern(catalog, scenarioId),
    [catalog],
  );

  return { catalog, loading, concernForScenario };
}
