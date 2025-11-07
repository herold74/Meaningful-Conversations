import React, { useState } from 'react';
import { EyedropperIcon } from './icons/EyedropperIcon';

const PALETTE_COLORS = [
    '#29B6F6', '#1E599C', '#00838F', '#78909C',
    '#FFD54F', '#FFA000', '#EF5350', '#C62828',
    null, null,
];

const ColorPalette: React.FC = () => {
    const [selectedColor, setSelectedColor] = useState('#1E599C');

    return (
        <div className="bg-gray-200 p-4 rounded-lg inline-flex items-center gap-4 font-sans shadow-md">
            {/* Selected Color and Eyedropper */}
            <div className="flex items-center gap-3">
                <div 
                    className="w-20 h-20 rounded-lg border-2 border-gray-400 shadow-inner" 
                    style={{ backgroundColor: selectedColor }}
                />
                <EyedropperIcon className="w-8 h-8 text-gray-700 transform -rotate-45" />
            </div>

            {/* Palette Grid */}
            <div className="grid grid-cols-10 gap-1">
                {PALETTE_COLORS.map((color, index) => (
                    color ? (
                        <button
                            key={index}
                            onClick={() => setSelectedColor(color)}
                            className={`w-8 h-8 rounded-md border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                selectedColor === color ? 'border-gray-800' : 'border-gray-400'
                            }`}
                            style={{ backgroundColor: color }}
                            aria-label={`Select color ${color}`}
                        />
                    ) : (
                        <div key={index} className="w-8 h-8" /> // Empty placeholder for the gap
                    )
                ))}
                 {/* The bottom row of empty squares */}
                {Array.from({ length: 10 }).map((_, index) => (
                    <div key={`empty-${index}`} className="w-8 h-8 rounded-md border-2 border-gray-400 bg-gray-100 shadow-inner" />
                ))}
            </div>
        </div>
    );
};

export default ColorPalette;
