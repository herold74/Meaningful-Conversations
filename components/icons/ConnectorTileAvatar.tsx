import React from 'react';

interface ConnectorTileAvatarProps {
  className?: string;
}

/** Decorative avatar for The Connector tile (matches TranscriptMicAvatar treatment). */
const ConnectorTileAvatar: React.FC<ConnectorTileAvatarProps> = ({ className = 'w-20 h-20' }) => (
  <svg viewBox="0 0 80 80" className={className} aria-hidden role="img">
    <defs>
      <linearGradient id="conn-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1B7272" stopOpacity="0.35" />
        <stop offset="55%" stopColor="#38BDF8" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.35" />
      </linearGradient>
    </defs>
    <circle cx="40" cy="40" r="38" fill="url(#conn-bg)" />
    <path
      d="M 64 26 Q 76 40 64 54"
      fill="none"
      stroke="#38BDF8"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.45"
    />
    <path
      d="M 16 26 Q 4 40 16 54"
      fill="none"
      stroke="rgb(251 191 36)"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.45"
    />
    {/* Paar zentriert in (40,40); orange darüber für sichtbare Überlappung */}
    <g transform="translate(40 40) translate(1 1)">
      <g transform="translate(-7 -5)">
        <rect x="-14" y="-7" width="28" height="14" rx="4.5" fill="#1B7272" />
        <path d="M -9 7 L -14 12 L -4 7 Z" fill="#1B7272" />
        <line x1="-11" y1="-3" x2="5" y2="-3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
        <circle cx="-11" cy="2.5" r="1.2" fill="#fff" opacity="0.95" />
        <circle cx="-5.5" cy="2.5" r="1.2" fill="#fff" opacity="0.85" />
        <circle cx="0" cy="2.5" r="1.2" fill="#fff" opacity="0.75" />
      </g>
      <g transform="translate(5 3)">
        <rect x="-14" y="-7" width="28" height="14" rx="4.5" fill="#D97706" />
        <path d="M 9 7 L 14 12 L 6 7 Z" fill="#D97706" />
        <circle cx="-11" cy="-3" r="1.2" fill="#fff" opacity="0.95" />
        <circle cx="-5.5" cy="-3" r="1.2" fill="#fff" opacity="0.85" />
        <circle cx="0" cy="-3" r="1.2" fill="#fff" opacity="0.75" />
        <line x1="-11" y1="2.5" x2="5" y2="2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.95" />
      </g>
    </g>
  </svg>
);

export default ConnectorTileAvatar;
