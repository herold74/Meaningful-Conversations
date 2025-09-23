import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        {...props}
    >
        {/* Rings */}
        <circle cx="12" cy="12" r="8" /> {/* Outer ring */}
        <circle cx="12" cy="12" r="5" /> {/* Inner ring */}
        <circle cx="12" cy="12" r="2" /> {/* Hub */}

        {/* Handles & Spokes (rotated) */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
            <g key={angle} transform={`rotate(${angle} 12 12)`}>
                {/* Flared Handle */}
                <path d="M 11.6 4 L 11.4 2 L 12.6 2 L 12.4 4" />
                {/* Outer Spoke */}
                <line x1="12" y1="7" x2="12" y2="4" />
                {/* Inner Spoke */}
                <line x1="12" y1="10" x2="12" y2="7" />
            </g>
        ))}
    </svg>
);
