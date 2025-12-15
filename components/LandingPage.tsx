import React, { useState, useCallback, useMemo } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { useLocalization } from '../context/LocalizationContext';
import { FileTextIcon } from './icons/FileTextIcon';
import { CheckIcon } from './icons/CheckIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChristmasSnowflakes from './ChristmasSnowflakes';
import { isChristmasSeason } from '../utils/dateUtils';
import Button from './shared/Button';

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
  
  const showChristmas = useMemo(() => {
    const result = isChristmasSeason();
    console.log('[LandingPage] Christmas season check:', result);
    return result;
  }, []);

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
          if (!trimmedText.startsWith('# My Life Context') && !trimmedText.startsWith('# Lebenskontext') && !trimmedText.startsWith('# Mein Lebenskontext')) {
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
      {showChristmas && <ChristmasSnowflakes darkModeOnly={true} />}
      <div className="w-full max-w-3xl p-8 space-y-6 bg-background-secondary dark:bg-transparent border border-border-secondary dark:border-border-primary rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-content-primary dark:text-content-primary uppercase">{t('meaningfulConversations')}</h1>
        <p className="text-sm md:text-lg text-content-secondary dark:text-content-secondary leading-relaxed">
          {t('landing_subtitle')}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!fileContent ? (
            <label 
              htmlFor="file-upload" 
              className={`relative block w-full p-8 text-center border-2 transition-colors duration-300 rounded-lg cursor-pointer group
                ${isDragging 
                  ? 'border-solid bg-status-success-background dark:bg-status-success-background border-status-success-border' 
                  : 'bg-background-primary dark:bg-background-primary/50 border-border-secondary dark:border-border-primary hover:border-accent-primary dark:hover:border-accent-primary shadow-inner'
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
                    <UploadIcon className="w-16 h-16 text-accent-primary" />
                    <span className="text-lg font-semibold text-status-success-foreground">
                      {t('landing_drop_prompt')}
                    </span>
                  </>
                ) : (
                  <>
                    <FileTextIcon className="w-16 h-16 text-content-subtle transition-colors group-hover:text-accent-primary" />
                    <span className="text-xl font-bold text-content-primary">
                      {t('landing_upload_title')}
                    </span>
                    <span className="text-sm text-content-secondary">
                      {t('landing_dragDrop')}
                    </span>
                  </>
                )}
              </div>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".md,text/markdown" onChange={handleFileChange} />
            </label>
          ) : (
             <div className="p-4 space-y-4 bg-background-secondary dark:bg-background-primary/50 border border-border-primary dark:border-border-primary rounded-lg animate-fadeIn shadow-md">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 p-2 bg-accent-primary/20">
                        <CheckIcon className="w-6 h-6 text-accent-primary" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                        <p className="font-bold text-content-primary truncate" title={fileName}>{fileName}</p>
                        <button type="button" onClick={handleResetFile} className="text-sm text-accent-primary hover:text-accent-primary-hover hover:underline">
                            {t('landing_change_file')}
                        </button>
                    </div>
                </div>
                {previewContent && (
                    <div className="text-left">
                        <p className="text-xs font-bold text-content-subtle uppercase mb-1">{t('landing_file_preview')}</p>
                        <div className="prose prose-sm dark:prose-invert max-w-none h-48 overflow-y-auto p-3 bg-background-tertiary dark:bg-background-tertiary border border-border-primary dark:border-border-primary rounded-md">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {previewContent}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>
          )}
          
          {error && <p className="text-status-danger-foreground text-sm">{error}</p>}
          
          <Button type="submit" disabled={!fileContent} size="lg" fullWidth>
            {t('landing_startSession')}
          </Button>
        </form>

        <div className="flex items-center justify-center space-x-4">
            <hr className="w-full border-border-secondary dark:border-border-primary"/>
            <span className="font-medium text-content-subtle text-xs">{t('landing_or')}</span>
            <hr className="w-full border-border-secondary dark:border-border-primary"/>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
                onClick={onStartQuestionnaire}
                className="w-full px-6 py-3 text-base font-bold text-button-foreground-on-accent bg-accent-secondary uppercase hover:bg-accent-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-secondary dark:focus:ring-offset-background-primary transition-all duration-200 rounded-lg shadow-md"
            >
                {t('landing_createFile')}
            </button>
             <button
                onClick={onStartInterview}
                className="w-full px-6 py-3 text-base font-bold text-accent-tertiary-foreground bg-accent-tertiary uppercase hover:bg-accent-tertiary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-tertiary dark:focus:ring-offset-background-primary transition-all duration-200 rounded-lg shadow-md"
            >
                {t('landing_createWithInterview')}
            </button>
        </div>

        <div className="text-xs text-content-subtle pt-4">
            <p><strong>{t('landing_privacyNote')}</strong> {t('landing_privacyText')}</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;