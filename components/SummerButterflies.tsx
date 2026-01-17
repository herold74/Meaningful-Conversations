import React, { useEffect, useState } from 'react';

interface SummerButterfliesProps {
  lightModeOnly?: boolean;
}

const SummerButterflies: React.FC<SummerButterfliesProps> = ({ lightModeOnly = true }) => {
  // Butterflies only fly during the day! 🦋☀️
  const butterflies = ['🦋'];
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
  
  // Don't render butterflies at night (dark mode)
  if (lightModeOnly && isDarkMode) {
    return null;
  }
  
  return (
    <div className="summer-butterflies-container" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="butterfly">
          {butterflies[0]}
        </div>
      ))}
    </div>
  );
};

export default SummerButterflies;
