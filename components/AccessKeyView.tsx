import React, { useState } from 'react';
import { KeyIcon } from './icons/KeyIcon';

interface AccessKeyViewProps {
  onSubmit: (key: string) => boolean;
}

const AccessKeyView: React.FC<AccessKeyViewProps> = ({ onSubmit }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedKey = key.trim();
    if (!trimmedKey) {
      setError('Please enter an access key.');
      return;
    }
    const success = onSubmit(trimmedKey);
    if (!success) {
      setError('The provided access key is incorrect.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-transparent border border-gray-700">
        <div className="flex flex-col items-center">
          <KeyIcon className="w-16 h-16 text-gray-500" />
          <h1 className="mt-4 text-3xl font-bold text-gray-200 uppercase">Access Required</h1>
        </div>
        <p className="text-lg text-gray-400 leading-relaxed">
          This application is available for authorized users. Please enter your access key to continue.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setError('');
            }}
            placeholder="Enter your access key"
            className="w-full p-3 bg-gray-900 text-gray-200 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-400 focus:border-green-400 text-center"
            aria-label="Access Key"
          />
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <button
            type="submit"
            className="w-full px-6 py-3 text-base font-bold text-black bg-green-400 uppercase hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed focus:outline-none transition-colors duration-200"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccessKeyView;