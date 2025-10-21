import React from 'react';

export const BetaIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.05h.01c.46 0 .89.26 1.1.69l3.49 6.98a1.25 1.25 0 01-.1 1.36l-3.5 7c-.22.43-.65.69-1.1.69h-.01a1.25 1.25 0 01-1.1-.69l-3.5-7a1.25 1.25 0 01.1-1.36l3.5-7c.22-.43.64-.69 1.1-.69z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 4.09l-1.4 2.43H18v2.96h-4.3l-1.4 2.42h4.3v2.96H8.97l-1.4-2.42H6V4.09h8.25z" />
    </svg>
);