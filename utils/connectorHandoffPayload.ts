import type { ConnectorDimensionKey, ConnectorEvaluationResult, ConnectorHandoffPayload } from '../types';

export function resolvePrimaryHandoffVignetteId(
  evaluation: ConnectorEvaluationResult,
): string | undefined {
  const withCue = evaluation.perVignette.find((pv) => pv.missedCue?.trim());
  return withCue?.vignetteId ?? evaluation.perVignette[0]?.vignetteId ?? evaluation.vignetteIds[0];
}

export function buildConnectorHandoffPayload(
  evaluation: ConnectorEvaluationResult,
  focusDimension: ConnectorDimensionKey,
): ConnectorHandoffPayload | undefined {
  const vignetteId = resolvePrimaryHandoffVignetteId(evaluation);
  if (!vignetteId) return undefined;
  const row =
    evaluation.perVignette.find((pv) => pv.vignetteId === vignetteId) ?? evaluation.perVignette[0];
  return {
    vignetteId,
    focusDimension,
    highlight: row?.highlight?.trim() || undefined,
    missedCue: row?.missedCue?.trim() || undefined,
  };
}
