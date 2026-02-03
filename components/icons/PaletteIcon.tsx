import React from 'react';

// Paint palette icon with classic artist palette shape and thumb hole
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
        {/* Classic palette shape with thumb hole */}
        <path d="M2 12.5C2 7 6 3 12 3c5.5 0 10 4 10 8.5 0 2.5-1.5 4-3.5 4h-2c-1 0-1.5.7-1.5 1.5 0 .4.1.7.3 1 .2.3.2.6.2 1 0 1.2-1 2-2.5 2C6 21 2 17 2 12.5Z" />
        {/* Thumb hole */}
        <circle cx="16.5" cy="16" r="1.8" />
        {/* Paint blobs - arranged organically */}
        <circle cx="7" cy="9" r="1.3" fill="currentColor" />
        <circle cx="10.5" cy="6.5" r="1.1" fill="currentColor" />
        <circle cx="14.5" cy="7" r="1.2" fill="currentColor" />
        <circle cx="7.5" cy="13" r="1" fill="currentColor" />
        <circle cx="11" cy="11" r="1.1" fill="currentColor" />
    </svg>
);