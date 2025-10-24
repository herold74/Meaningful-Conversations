import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { useLocalization } from '../context/LocalizationContext';
import { FileTextIcon } from './icons/FileTextIcon';

interface LandingPageProps {
  onSubmit: (context: string) => void;
  onStartQuestionnaire: () => void;
  onStartInterview: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSubmit, onStartQuestionnaire, onStartInterview }) => {
  const { t } = useLocalization();
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
        setError(t('landing_error_invalidFile'));
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
              setError(t('landing_error_invalidFile'));
              setFileName('');
              setFileContent('');
          }
      }
  }, [t]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (fileContent.trim()) {
      onSubmit(fileContent);
    } else {
      setError(t('landing_error_emptyFile'));
    }
  };

  return (
    <div className="flex flex-col items-center py-12 md:py-16 text-center animate-fadeIn">
      <div className="w-full max-w-3xl p-8 space-y-6 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('meaningfulConversations')}</h1>
        <p className="text-sm md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          {t('landing_subtitle')}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!fileContent ? (
            <label 
              htmlFor="file-upload" 
              className="relative block w-full px-12 py-8 text-center border-2 border-dashed cursor-pointer border-gray-400 hover:border-green-500 dark:border-gray-700 dark:hover:border-green-400 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <UploadIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500" />
              <span className="mt-2 block text-sm font-semibold text-gray-500 dark:text-gray-400">
                {fileName ? fileName : t('landing_dragDrop')}
              </span>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".md,text/markdown" onChange={handleFileChange} />
            </label>
          ) : (
             <div className="flex items-center justify-center gap-6 p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg animate-fadeIn">
                <div className="flex-shrink-0 p-3 bg-green-100 dark:bg-green-900/50 rounded-full">
                    <FileTextIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left flex-1 min-w-0">
                    <p className="font-bold text-gray-800 dark:text-gray-200 truncate" title={fileName}>{fileName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('landing_file_loaded_info')}
                    </p>
                </div>
            </div>
          )}
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <button
            type="submit"
            disabled={!fileContent}
            className="w-full px-6 py-3 text-base font-bold text-black bg-green-400 uppercase hover:bg-green-500 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed focus:outline-none transition-colors duration-200 rounded-lg shadow-md"
          >
            {t('landing_startSession')}
          </button>
        </form>

        <div className="flex items-center justify-center space-x-4">
            <hr className="w-full border-gray-300 dark:border-gray-700"/>
            <span className="font-medium text-gray-400 dark:text-gray-500 text-xs">{t('landing_or')}</span>
            <hr className="w-full border-gray-300 dark:border-gray-700"/>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
                onClick={onStartQuestionnaire}
                className="w-full px-6 py-3 text-base font-bold text-black bg-[#FECC78] uppercase hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FECC78] dark:focus:ring-offset-gray-950 transition-all duration-200 rounded-lg shadow-md"
            >
                {t('landing_createFile')}
            </button>
             <button
                onClick={onStartInterview}
                className="w-full px-6 py-3 text-base font-bold text-white bg-[#1B7272] uppercase hover:bg-[#165a5a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B7272] dark:focus:ring-offset-gray-950 transition-all duration-200 rounded-lg shadow-md"
            >
                {t('landing_createWithInterview')}
            </button>
        </div>

        <div className="text-xs text-gray-500 pt-4">
            <p><strong>{t('landing_privacyNote')}</strong> {t('landing_privacyText')}</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;