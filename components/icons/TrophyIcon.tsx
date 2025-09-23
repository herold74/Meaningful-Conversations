import React from 'react';

export const TrophyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9.75 9.75 0 011.036-4.22.75.75 0 01.37-1.036 9.75 9.75 0 011.036-1.036.75.75 0 011.036.37 9.75 9.75 0 014.22 1.036.75.75 0 01.37 1.036 9.75 9.75 0 011.036 4.22z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 1.5v5.25m0 0a2.25 2.25 0 00-2.25 2.25 2.25 2.25 0 002.25 2.25 2.25 2.25 0 002.25-2.25 2.25 2.25 0 00-2.25-2.25z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12h3.75m12 0h3.75" />
    </svg>
);
