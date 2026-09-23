import React from 'react';

interface TutorialTileAvatarProps {
  className?: string;
}

/** Decorative avatar for QuickStart & Tutorials (matches TranscriptMicAvatar / ConnectorTileAvatar). */
const TutorialTileAvatar: React.FC<TutorialTileAvatarProps> = ({ className = 'w-20 h-20' }) => (
  <svg viewBox="0 0 80 80" className={className} aria-hidden role="img">
    <defs>
      <linearGradient id="tut-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1B7272" stopOpacity="0.35" />
        <stop offset="55%" stopColor="#38BDF8" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#D97706" stopOpacity="0.38" />
      </linearGradient>
      <linearGradient id="tut-cover-l" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#5BBFBF" />
        <stop offset="100%" stopColor="#1B7272" />
      </linearGradient>
      <linearGradient id="tut-cover-r" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="tut-page" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#F8FAFC" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </linearGradient>
      <filter id="tut-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#0f172a" floodOpacity="0.35" />
      </filter>
    </defs>
    <circle cx="40" cy="40" r="38" fill="url(#tut-bg)" />
    <path
      d="M 58 30 Q 68 40 58 50"
      fill="none"
      stroke="#38BDF8"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.4"
    />
    <path
      d="M 22 30 Q 12 40 22 50"
      fill="none"
      stroke="rgb(251 191 36)"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.4"
    />
    <g filter="url(#tut-shadow)" transform="translate(40 42)">
      {/* spine */}
      <ellipse cx="0" cy="2" rx="3" ry="14" fill="#165a5a" />
      {/* left cover + pages */}
      <path
        d="M -2 14 L -2 -12 Q -18 -14 -28 -8 L -28 10 Q -18 16 -2 14 Z"
        fill="url(#tut-cover-l)"
      />
      <path
        d="M -4 12 L -4 -10 Q -16 -11 -26 -6 L -26 8 Q -16 13 -4 12 Z"
        fill="url(#tut-page)"
      />
      <line x1="-22" y1="-2" x2="-8" y2="-2" stroke="#1B7272" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
      <line x1="-22" y1="2" x2="-10" y2="2" stroke="#1B7272" strokeWidth="1.2" strokeLinecap="round" opacity="0.28" />
      <line x1="-22" y1="6" x2="-12" y2="6" stroke="#1B7272" strokeWidth="1.2" strokeLinecap="round" opacity="0.22" />
      {/* right cover + pages */}
      <path
        d="M 2 14 L 2 -12 Q 18 -14 28 -8 L 28 10 Q 18 16 2 14 Z"
        fill="url(#tut-cover-r)"
      />
      <path
        d="M 4 12 L 4 -10 Q 16 -11 26 -6 L 26 8 Q 16 13 4 12 Z"
        fill="url(#tut-page)"
      />
      <line x1="8" y1="-2" x2="22" y2="-2" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
      <line x1="10" y1="2" x2="22" y2="2" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" opacity="0.28" />
      <circle cx="14" cy="7" r="2.2" fill="#1B7272" opacity="0.85" />
      <path d="M 13.2 7 L 14 8.2 L 15.4 5.8" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

export default TutorialTileAvatar;
