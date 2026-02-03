import React from 'react';

// Color theme icon - three overlapping circles (classic color TV logo style)
export const PaletteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
        {/* Three overlapping circles in triangular arrangement */}
        {/* Top circle */}
        <circle cx="12" cy="8" r="5" />
        {/* Bottom left circle */}
        <circle cx="8" cy="14" r="5" />
        {/* Bottom right circle */}
        <circle cx="16" cy="14" r="5" />
    </svg>
);