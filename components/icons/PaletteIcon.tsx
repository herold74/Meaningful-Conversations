import React from 'react';

// Palette icon matching SF Symbol "paintpalette" style
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
        {/* Paint palette shape */}
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2Z" />
        {/* Color dots */}
        <circle cx="7.5" cy="10.5" r="1.5" fill="currentColor" />
        <circle cx="12" cy="7.5" r="1.5" fill="currentColor" />
        <circle cx="16.5" cy="10.5" r="1.5" fill="currentColor" />
    </svg>
);