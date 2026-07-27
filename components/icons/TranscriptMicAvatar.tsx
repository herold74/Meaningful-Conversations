import React from 'react';

interface TranscriptMicAvatarProps {
  className?: string;
}

/** Decorative mic avatar for the transcript tools tile (matches coach avatar size). */
const TranscriptMicAvatar: React.FC<TranscriptMicAvatarProps> = ({ className = 'w-20 h-20' }) => (
  <svg
    viewBox="0 0 80 80"
    className={className}
    aria-hidden
    role="img"
  >
    <defs>
      <linearGradient id="tmic-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1B7272" stopOpacity="0.35" />
        <stop offset="55%" stopColor="#38BDF8" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.35" />
      </linearGradient>
      <linearGradient id="tmic-body" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#5BBFBF" />
        <stop offset="100%" stopColor="#1B7272" />
      </linearGradient>
    </defs>
    <circle cx="40" cy="40" r="38" fill="url(#tmic-bg)" />
    {/* Sound arcs */}
    <path
      d="M 58 32 Q 66 40 58 48"
      fill="none"
      stroke="#1B7272"
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity="0.55"
    />
    <path
      d="M 64 26 Q 76 40 64 54"
      fill="none"
      stroke="#38BDF8"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.45"
    />
    <path
      d="M 22 32 Q 14 40 22 48"
      fill="none"
      stroke="#1B7272"
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity="0.55"
    />
    <path
      d="M 16 26 Q 4 40 16 54"
      fill="none"
      stroke="rgb(251 191 36)"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.45"
    />
    {/* Mic body */}
    <rect x="33" y="22" width="14" height="26" rx="7" fill="url(#tmic-body)" />
    <path
      d="M 26 38 C 26 50 33 56 40 56 C 47 56 54 50 54 38"
      fill="none"
      stroke="url(#tmic-body)"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <line x1="40" y1="56" x2="40" y2="64" stroke="rgb(27 114 114)" strokeWidth="3" strokeLinecap="round" />
    <line x1="32" y1="64" x2="48" y2="64" stroke="rgb(27 114 114)" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export default TranscriptMicAvatar;
