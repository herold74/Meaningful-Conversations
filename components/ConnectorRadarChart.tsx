import React from 'react';
import type { ConnectorDimensionKey, ConnectorEvaluationResult } from '../types';

export const CONNECTOR_DIMENSIONS: ConnectorDimensionKey[] = [
  'empathy',
  'presence',
  'curiosity',
  'nonJudgment',
  'steadiness',
];

interface ConnectorRadarChartProps {
  evaluation: ConnectorEvaluationResult;
  labels: Record<ConnectorDimensionKey, string>;
  className?: string;
}

/** Pentagon radar chart for Connector dimension scores (SVG, no dependencies). */
const ConnectorRadarChart: React.FC<ConnectorRadarChartProps> = ({
  evaluation,
  labels,
  className = 'w-full max-w-lg mx-auto overflow-visible',
}) => {
  const pad = 56;
  const inner = 260;
  const size = inner + pad * 2;
  const center = inner / 2 + pad;
  const radius = 84;
  const labelRadius = radius + 32;

  const point = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / CONNECTOR_DIMENSIONS.length - Math.PI / 2;
    const r = (value / 10) * radius;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };

  const labelAnchor = (x: number): 'start' | 'middle' | 'end' => {
    const dx = x - center;
    if (Math.abs(dx) < 12) return 'middle';
    return dx < 0 ? 'end' : 'start';
  };

  const ringPath = (value: number) =>
    CONNECTOR_DIMENSIONS.map((_, i) => point(i, value).join(',')).join(' ');

  const scorePath = CONNECTOR_DIMENSIONS
    .map((dim, i) => point(i, evaluation[dim]?.score ?? 0).join(','))
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label="Radar"
    >
      {[2.5, 5, 7.5, 10].map((ring) => (
        <polygon
          key={ring}
          points={ringPath(ring)}
          fill="none"
          stroke="currentColor"
          className="text-border-secondary dark:text-border-primary"
          strokeWidth="1"
          opacity={0.6}
        />
      ))}
      {CONNECTOR_DIMENSIONS.map((_, i) => {
        const [x, y] = point(i, 10);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="currentColor"
            className="text-border-secondary dark:text-border-primary"
            strokeWidth="1"
            opacity={0.6}
          />
        );
      })}
      <polygon points={scorePath} fill="rgba(27,114,114,0.35)" stroke="#1B7272" strokeWidth="2" />
      {CONNECTOR_DIMENSIONS.map((dim, i) => {
        const [x, y] = point(i, evaluation[dim]?.score ?? 0);
        return <circle key={dim} cx={x} cy={y} r="3.5" fill="#1B7272" />;
      })}
      {CONNECTOR_DIMENSIONS.map((dim, i) => {
        const angle = (Math.PI * 2 * i) / CONNECTOR_DIMENSIONS.length - Math.PI / 2;
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);
        const anchor = labelAnchor(x);
        return (
          <text
            key={dim}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="fill-current text-content-secondary"
            fontSize="11"
            fontWeight="600"
          >
            <tspan x={x} dy={0}>{labels[dim]}</tspan>
            <tspan x={x} dy="1.15em" className="fill-accent-primary" fontSize="10">
              ({evaluation[dim]?.score ?? '–'})
            </tspan>
          </text>
        );
      })}
    </svg>
  );
};

export default ConnectorRadarChart;
