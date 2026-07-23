import React, { useState, useCallback, useMemo, useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { useLocalization } from '../context/LocalizationContext';
import { FileTextIcon } from './icons/FileTextIcon';
import { CheckIcon } from './icons/CheckIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { brand } from '../config/brand';
import { LogoIcon } from './icons/LogoIcon';
import Button from './shared/Button';
import { isNativeIOS } from '../utils/platformDetection';
import { MessageCircle, Mic, ChevronRight } from 'lucide-react';

interface LandingPageProps {
  onSubmit: (context: string) => void;
  onStartQuestionnaire: () => void;
  onStartInterview: () => void;
  onEditContext?: (context: string) => void;
  existingContext?: string;
  isTemplateContext?: boolean;
}

const removeGamificationKey = (text: string) => {
    return text.replace(/<!-- (gmf-data|do_not_delete): (.*?) -->\s*$/, '').trim();
};

const LandingPage: React.FC<LandingPageProps> = ({ onSubmit, onStartQuestionnaire, onStartInterview, onEditContext, existingContext, isTemplateContext }) => {
  const { t, language } = useLocalization();
  const native = isNativeIOS() && window.innerWidth < 768;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
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
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleContextCard = () => {
    if (existingContext?.trim() && !isTemplateContext) {
      setFileContent(existingContext);
      setFileName(language === 'de' ? 'Lebenskontext.md' : 'Life-Context.md');
      setError('');
      return;
    }
    openFilePicker();
  };

  const isNewUpload = !!fileContent && fileContent !== existingContext;
  const showEdit = !!fileContent && (isNewUpload || !isTemplateContext);

  return (
    <div className="flex flex-col items-center py-6 md:py-10 px-4 text-center animate-fadeIn">
      <div className={`w-full max-w-5xl space-y-8 ${native ? 'space-y-5' : ''}`}>
        <div className="flex flex-col items-center">
          <LogoIcon className={`${native ? 'w-10 h-10' : 'w-14 h-14'} text-accent-primary mb-4`} />
          <h1 className={`${native ? 'text-2xl' : 'text-3xl sm:text-4xl'} font-semibold text-content-primary tracking-tight`}>
            {language === 'de' ? brand.appNameDe : brand.appName}
          </h1>
          <p className={`mt-2 ${native ? 'text-sm' : 'text-base'} text-content-secondary max-w-lg leading-relaxed`}>
            {t('landing_welcome_subtitle')}
          </p>
        </div>

        <input
          ref={fileInputRef}
          id="file-upload"
          name="file-upload"
          type="file"
          className="sr-only"
          accept=".md,text/markdown"
          onChange={handleFileChange}
        />

        {!fileContent ? (
          <>
            <div className={`grid grid-cols-1 ${native ? '' : 'md:grid-cols-3'} gap-4 md:gap-5`}>
              <button
                type="button"
                onClick={handleContextCard}
                className="text-left rounded-card p-5 bg-background-secondary/90 backdrop-blur-sm border border-border-primary shadow-card hover:border-accent-primary/40 hover:shadow-card-elevated transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-accent-primary/10 flex items-center justify-center mb-4">
                  <FileTextIcon className="w-5 h-5 text-accent-primary" />
                </div>
                <h2 className="text-base font-semibold text-content-primary mb-2 group-hover:text-accent-primary transition-colors">
                  {t('landing_card_context_title')}
                </h2>
                <p className="text-sm text-content-secondary leading-relaxed">{t('landing_card_context_desc')}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-accent-primary opacity-70 group-hover:opacity-100 transition-opacity">
                  <span>{t('intent_card_cta')}</span>
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </div>
              </button>

              <button
                type="button"
                onClick={onStartQuestionnaire}
                className="text-left rounded-card p-5 action-card-featured shadow-card-elevated border border-transparent transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                  <MessageCircle className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <h2 className="text-base font-semibold text-white mb-2">{t('landing_card_conversation_title')}</h2>
                <p className="text-sm text-white/90 leading-relaxed">{t('landing_card_conversation_desc')}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-white">
                  <span>{t('intent_card_cta')}</span>
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </div>
              </button>

              <button
                type="button"
                onClick={onStartInterview}
                className="text-left rounded-card p-5 bg-background-secondary/90 backdrop-blur-sm border border-border-primary shadow-card hover:border-accent-primary/40 hover:shadow-card-elevated transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-accent-primary/10 flex items-center justify-center mb-4">
                  <Mic className="w-5 h-5 text-accent-primary" aria-hidden="true" />
                </div>
                <h2 className="text-base font-semibold text-content-primary mb-2 group-hover:text-accent-primary transition-colors">
                  {t('landing_card_interview_title')}
                </h2>
                <p className="text-sm text-content-secondary leading-relaxed">{t('landing_card_interview_desc')}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-accent-primary opacity-70 group-hover:opacity-100 transition-opacity">
                  <span>{t('intent_card_cta')}</span>
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </div>
              </button>
            </div>

            <label
              htmlFor="file-upload"
              className={`relative block w-full max-w-2xl mx-auto ${native ? 'p-4' : 'p-6'} text-center border-2 transition-colors duration-300 rounded-card cursor-pointer group
                ${isDragging
                  ? 'border-solid bg-status-success-background border-status-success-border'
                  : 'bg-background-secondary/90 backdrop-blur-sm border-border-primary hover:border-accent-primary shadow-card'
                }
              `}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className={`flex ${native ? 'flex-row items-center gap-3' : 'flex-col items-center justify-center space-y-3'}`}>
                {isDragging ? (
                  <>
                    <UploadIcon className={`${native ? 'w-8 h-8' : 'w-10 h-10'} text-accent-primary`} />
                    <span className={`${native ? 'text-sm' : 'text-base'} font-semibold text-status-success-foreground`}>
                      {t('landing_drop_prompt')}
                    </span>
                  </>
                ) : (
                  <>
                    <FileTextIcon className={`${native ? 'w-8 h-8 flex-shrink-0' : 'w-10 h-10'} text-content-subtle transition-colors group-hover:text-accent-primary`} />
                    <div className={native ? 'text-left' : ''}>
                      <span className={`${native ? 'text-sm' : 'text-base'} font-semibold text-content-primary`}>
                        {t('landing_upload_title')}
                      </span>
                      {!native && (
                        <span className="text-sm text-content-secondary block mt-1">
                          {t('landing_dragDrop')}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </label>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-4 text-left">
            <div className="p-4 space-y-4 bg-background-secondary/90 backdrop-blur-sm border border-border-primary rounded-card shadow-card animate-fadeIn">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-2 bg-accent-primary/20 rounded-lg">
                  <CheckIcon className="w-6 h-6 text-accent-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-content-primary truncate" title={fileName}>{fileName}</p>
                  <button type="button" onClick={handleResetFile} className="text-sm text-accent-primary hover:text-accent-primary-hover hover:underline">
                    {t('landing_change_file')}
                  </button>
                </div>
              </div>
              {previewContent && (
                <div>
                  <p className="text-xs font-semibold text-content-subtle mb-1">{t('landing_file_preview')}</p>
                  <div className="prose prose-sm dark:prose-invert max-w-none h-48 md:h-[28vh] overflow-y-auto p-3 bg-background-tertiary border border-border-primary rounded-lg">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {previewContent}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="text-status-danger-foreground text-sm text-center">{error}</p>}

            <Button type="submit" variant="gradient" size="lg" fullWidth>
              {t('landing_startSession')}
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button
                type="button"
                onClick={showEdit ? () => onEditContext?.(fileContent) : onStartQuestionnaire}
                size="lg"
                fullWidth
                className="bg-accent-secondary hover:bg-accent-secondary-hover text-button-foreground-on-accent focus:ring-accent-secondary"
              >
                {showEdit ? t('landing_editFile') : t('landing_extendFile')}
              </Button>
              <Button
                type="button"
                onClick={onStartInterview}
                size="lg"
                fullWidth
                className="bg-accent-tertiary hover:bg-accent-tertiary-hover text-accent-tertiary-foreground focus:ring-accent-tertiary"
              >
                {t('landing_extendWithInterview')}
              </Button>
            </div>
          </form>
        )}

        {error && !fileContent && <p className="text-status-danger-foreground text-sm">{error}</p>}

        <div className="text-xs text-content-subtle max-w-2xl mx-auto pt-2">
          <p><strong>{t('landing_privacyNote')}</strong> {t('landing_privacyText')}</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
