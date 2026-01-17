import React, { useEffect, useState } from 'react';

interface SpringBlossomsProps {
  lightModeOnly?: boolean;
}

const SpringBlossoms: React.FC<SpringBlossomsProps> = ({ lightModeOnly = true }) => {
  // Cherry blossoms and leaves only (no roses/tulips)
  // Blossoms look best in daylight! 🌸☀️
  const petals = ['🌸', '🍃'];
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
  
  // Don't render blossoms at night (dark mode)
  if (lightModeOnly && isDarkMode) {
    return null;
  }
  
  return (
    <div className="spring-blossom-container" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="blossom">
          {petals[i % petals.length]}
        </div>
      ))}
    </div>
  );
};

export default SpringBlossoms;
