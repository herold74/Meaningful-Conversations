import React, { useEffect, useState } from 'react';

interface ChristmasSnowflakesProps {
  darkModeOnly?: boolean;
}

const ChristmasSnowflakes: React.FC<ChristmasSnowflakesProps> = ({ darkModeOnly = false }) => {
  const snowflakes = ['❄', '❅', '❆'];
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    // Check if dark mode is active
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Watch for dark mode changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);
  
  // Don't render if darkModeOnly is true and we're not in dark mode
  if (darkModeOnly && !isDarkMode) {
    return null;
  }
  
  console.log('[ChristmasSnowflakes] Rendering snowflakes...', { darkModeOnly, isDarkMode });
  
  return (
    <div className="christmas-snow-container" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="snowflake">
          {snowflakes[i % snowflakes.length]}
        </div>
      ))}
    </div>
  );
};

export default ChristmasSnowflakes;

