import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface LandingPageProps {
  onSubmit: (context: string) => void;
  onStartQuestionnaire: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSubmit, onStartQuestionnaire }) => {
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setFileContent(text);
          setFileName(file.name);
          setError('');
        };
        reader.readAsText(file);
      } else {
        setError('Please upload a valid .md (Markdown) file.');
        setFileName('');
        setFileContent('');
      }
    }
  };
  
  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (file) {
          if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
              const reader = new FileReader();
              reader.onload = (e) => {
                  const text = e.target?.result as string;
                  setFileContent(text);
                  setFileName(file.name);
                  setError('');
              };
              reader.readAsText(file);
          } else {
              setError('Please upload a valid .md (Markdown) file.');
              setFileName('');
              setFileContent('');
          }
      }
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (fileContent.trim()) {
      onSubmit(fileContent);
    } else {
      setError('The file is empty or no file has been selected.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center animate-fadeIn">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-transparent border border-gray-700">
        <h1 className="text-4xl font-bold text-gray-200 uppercase">Meaningful Conversations</h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          Begin your journey by providing a "Life Context". This is a Markdown (.md) file with your background, goals, and challenges. The details you provide, help your coaches to respond to your current life situation.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <label 
            htmlFor="file-upload" 
            className="relative block w-full px-12 py-8 text-center border-2 border-dashed cursor-pointer border-gray-700 hover:border-green-400 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <UploadIcon className="w-12 h-12 mx-auto text-gray-500" />
            <span className="mt-2 block text-sm font-semibold text-gray-400">
              {fileName ? fileName : 'Drag & drop a .md file here, or click to select'}
            </span>
            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".md,text/markdown" onChange={handleFileChange} />
          </label>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <button
            type="submit"
            disabled={!fileContent}
            className="w-full px-6 py-3 text-base font-bold text-black bg-green-400 uppercase hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed focus:outline-none transition-colors duration-200"
          >
            Start Coaching Session
          </button>
        </form>

        <div className="flex items-center justify-center space-x-4">
            <hr className="w-full border-gray-700"/>
            <span className="font-medium text-gray-500 text-xs">OR</span>
            <hr className="w-full border-gray-700"/>
        </div>
        
        <button
            onClick={onStartQuestionnaire}
            className="w-full px-6 py-3 text-base font-bold text-green-400 bg-transparent border border-green-400 uppercase hover:bg-green-400 hover:text-black focus:outline-none transition-colors duration-200"
        >
            Don't have a file? Create one now.
        </button>

        <div className="text-xs text-gray-500 pt-4">
            <p><strong>Privacy Note:</strong> Your data is processed in-memory and is not stored on any server. Your Life Context is only used for the duration of your session.</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;