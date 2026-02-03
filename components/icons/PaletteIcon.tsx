import React from 'react';

// Paint palette icon matching SF Symbol "paintpalette" style
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
        {/* Palette body - organic kidney shape */}
        <path d="M12 21a9 9 0 0 1 0-18c4.97 0 9 3.58 9 8 0 1.06-.47 2.08-1.32 2.83-.84.75-1.99 1.17-3.18 1.17h-2.5a2 2 0 0 0-1 3.75 1.3 1.3 0 0 1-1 2.25" />
        {/* Thumb hole */}
        <circle cx="16.5" cy="17.5" r="1.5" />
        {/* Paint dots - matching SF Symbol positions */}
        <circle cx="8" cy="10" r="1" fill="currentColor" />
        <circle cx="12" cy="7" r="1" fill="currentColor" />
        <circle cx="16" cy="10" r="1" fill="currentColor" />
        <circle cx="9" cy="14" r="1" fill="currentColor" />
        <circle cx="13" cy="12" r="1" fill="currentColor" />
    </svg>
);