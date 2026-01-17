import React from 'react';

// Autumn leaves fall both day and night! 🍂🍁
const AutumnLeaves: React.FC = () => {
  const leaves = ['🍁', '🍂', '🍃'];
  
  return (
    <div className="autumn-leaves-container" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="leaf">
          {leaves[i % leaves.length]}
        </div>
      ))}
    </div>
  );
};

export default AutumnLeaves;
