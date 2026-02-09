import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-3 h-3 bg-accent-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-3 h-3 bg-accent-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-3 h-3 bg-accent-primary rounded-full animate-bounce"></div>
    </div>
  );
};

export default Spinner;