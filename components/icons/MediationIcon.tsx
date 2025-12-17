import React from 'react';

/**
 * MediationIcon - Represents meditation and mindfulness practices.
 * Shows a meditation bell/chime - neutral, non-spiritual symbol for meditation and mindfulness.
 * Used to indicate coaches (Rob, Kenji) who offer guided meditation support.
 */
export const MediationIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        {/* Bell body */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M 12 4 C 9 4, 7 6, 7 9 L 7 15 C 7 16, 6 17, 5 17 L 19 17 C 18 17, 17 16, 17 15 L 17 9 C 17 6, 15 4, 12 4 Z" />
        {/* Bell rim */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M 5 17 Q 12 20, 19 17" fill="currentColor" opacity="0.2" />
        {/* Clapper */}
        <line x1="12" y1="17" x2="12" y2="19" strokeLinecap="round" />
        <circle cx="12" cy="19.5" r="1" fill="currentColor" />
        {/* Top handle */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M 12 4 L 12 2 M 10 2 L 14 2" />
    </svg>
);

