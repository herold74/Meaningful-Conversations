import React from 'react';
import { WarningIcon } from './icons/WarningIcon';

interface PIIWarningViewProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const PIIWarningView: React.FC<PIIWarningViewProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center animate-fadeIn">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-transparent border border-yellow-500">
        <div className="flex flex-col items-center">
          <WarningIcon className="w-16 h-16 text-yellow-400" />
          <h1 className="mt-4 text-3xl font-bold text-gray-200 uppercase">Privacy Warning</h1>
        </div>
        <p className="text-lg text-gray-400 leading-relaxed">
          The "Life Context" file is sent to the AI for analysis. To protect your privacy, please ensure you have removed all Personally Identifiable Information (PII) before proceeding.
        </p>
        <div className="p-4 bg-gray-900 border border-gray-700 text-left text-sm text-gray-400">
          <p className="font-bold text-gray-300">Examples of PII include:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Full names, home address, email, phone number, birthdates, anniversaries</li>
            <li>Company names, job titles, or project names</li>
          </ul>
           <p className="mt-4">Treat your life context wisely to avoid potential traceability. Instead, use generic descriptions (e.g., "my manager," "a large tech company," "Project X"), first names only, or pseudonyms.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 text-base font-bold text-yellow-400 bg-transparent border border-yellow-400 uppercase hover:bg-yellow-400 hover:text-black focus:outline-none transition-colors"
          >
            Go Back & Edit
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 text-base font-bold text-black bg-green-400 uppercase hover:bg-green-500 focus:outline-none transition-colors"
          >
            I Understand, Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default PIIWarningView;