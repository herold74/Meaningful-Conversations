import React, { useState, useCallback, useMemo } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { useLocalization } from '../context/LocalizationContext';
import { FileTextIcon } from './icons/FileTextIcon';
import { CheckIcon } from './icons/CheckIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface LandingPageProps {
  onSubmit: (context: string) => void;
  onStartQuestionnaire: () => void;
  onStartInterview: () => void;
}

const removeGamificationKey = (text: string) => {
    return text.replace(/<!-- (gmf-data|do_not_delete): (.*?) -->\s*$/, '').trim();
};

const LandingPage: React.FC<LandingPageProps> = ({ onSubmit, onStartQuestionnaire, onStartInterview }) => {
  const { t } = useLocalization();
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const previewContent = useMemo(() => {
      if (!fileContent) return '';
      return removeGamificationKey(fileContent);
  }, [fileContent]);

  const processFile = useCallback((file: File) => {
      if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          const trimmedText = text.trim();
          if (!trimmedText.startsWith('# My Life Context') && !trimmedText.startsWith('# Lebenskontext')) {
              setError(t('landing_error_invalidHeader'));
              setFileName('');
              setFileContent('');
              return;
          }
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
  }, [t]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };
  
  const handleDragEnter = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (fileContent.trim()) {
      onSubmit(fileContent);
    } else {
      setError(t('landing_error_emptyFile'));
    }
  };

  const handleResetFile = () => {
    setFileContent('');
    setFileName('');
    setError('');
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
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
              className={`relative block w-full p-8 text-center border-2 transition-colors duration-300 rounded-lg cursor-pointer group
                ${isDragging 
                  ? 'border-solid bg-green-50 dark:bg-green-900/50 border-green-500' 
                  : 'bg-gray-50 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 shadow-inner'
                }
              `}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                {isDragging ? (
                  <>
                    <UploadIcon className="w-16 h-16 text-green-500 dark:text-green-400" />
                    <span className="text-lg font-semibold text-green-700 dark:text-green-300">
                      {t('landing_drop_prompt')}
                    </span>
                  </>
                ) : (
                  <>
                    <FileTextIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 transition-colors group-hover:text-green-500 dark:group-hover:text-green-400" />
                    <span className="text-xl font-bold text-gray-800 dark:text-gray-200">
                      {t('landing_upload_title')}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {t('landing_dragDrop')}
                    </span>
                  </>
                )}
              </div>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".md,text/markdown" onChange={handleFileChange} />
            </label>
          ) : (
             <div className="p-4 space-y-4 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg animate-fadeIn shadow-md">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                        <CheckIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                        <p className="font-bold text-gray-800 dark:text-gray-200 truncate" title={fileName}>{fileName}</p>
                        <button type="button" onClick={handleResetFile} className="text-sm text-yellow-600 dark:text-yellow-400 hover:underline">
                            {t('landing_change_file')}
                        </button>
                    </div>
                </div>
                {previewContent && (
                    <div className="text-left">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('landing_file_preview')}</p>
                        <div className="prose prose-sm dark:prose-invert max-w-none h-48 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {previewContent}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}
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