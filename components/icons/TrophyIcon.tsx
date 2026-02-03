import React from 'react';

// Trophy icon matching SF Symbol "trophy" style
export const TrophyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {/* Trophy cup body */}
        <path d="M7 4h10v7a5 5 0 0 1-10 0V4Z" />
        {/* Top rim */}
        <path d="M7 4h10" />
        {/* Left handle */}
        <circle cx="5" cy="8" r="2" />
        {/* Right handle */}
        <circle cx="19" cy="8" r="2" />
        {/* Stem */}
        <path d="M12 16v4" />
        {/* Base */}
        <path d="M8 20h8" />
    </svg>
);
