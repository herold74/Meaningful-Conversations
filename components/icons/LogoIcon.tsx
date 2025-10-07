import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor"
        {...props}
    >
        {/* Spokes and handles are drawn as 4 rotated paths to create 8 spokes with wider, rounded handles */}
        {[0, 45, 90, 135].map(angle => (
            <g key={angle} transform={`rotate(${angle} 12 12)`}>
                {/* This path creates a shape with a 0.7875 width spoke and 1.35 width rounded handles */}
                <path d="M11.325 4 L11.325 2 A 0.675 0.675 0 0 1 12.675 2 L12.675 4 L12.39375 4 L12.39375 20 L12.675 20 L12.675 22 A 0.675 0.675 0 0 1 11.325 22 L11.325 20 L11.60625 20 L11.60625 4 Z" />
            </g>
        ))}

        {/* The outer ring is created using a path with a hole in it (donut shape) */}
        <path
            fillRule="evenodd"
            d="M12 20a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z"
        />
        
        {/* The central hub */}
        <circle cx="12" cy="12" r="1.75" />
    </svg>
);