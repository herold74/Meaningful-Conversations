import React, { useState, useMemo } from 'react';
import { User, GamificationState } from '../types';
import { useLocalization } from '../context/LocalizationContext';
import { UploadIcon } from './icons/UploadIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DownloadIcon } from './icons/DownloadIcon';
import { WarningIcon } from './icons/WarningIcon';
import { XIcon } from './icons/XIcon';
import { serializeGamificationState } from '../utils/gamificationSerializer';

interface ContextChoiceViewProps {
  user: User;
  savedContext: string;
  onContinue: () => void;
  onStartNew: () => void;
  gamificationState: GamificationState;
}

const removeGamificationKey = (text: string) => {
    return text.replace(/<!-- (gmf-data|do_not_delete): (.*?) -->\s*$/, '').trim();
};

const ContextChoiceView: React.FC<ContextChoiceViewProps> = ({ user, savedContext, gamificationState, onContinue, onStartNew }) => {
  const { t } = useLocalization();
  const [isConfirmingStartNew, setIsConfirmingStartNew] = useState(false);

  const contextPreviewFull = useMemo(() => removeGamificationKey(savedContext.trim()), [savedContext]);

  const addGamificationDataToContext = (context: string): string => {
    // Remove any old gamification data comment to ensure a clean slate.
    let finalContext = context.replace(/<!-- (gmf-data|do_not_delete): (.*?) -->/g, '').trim();
    const dataToSerialize = serializeGamificationState(gamificationState);
    
    // 1. Encode to Base64
    const encodedData = btoa(dataToSerialize);
    // 2. Obfuscate by reversing the string. This makes it non-standard and not directly decodable.
    const obfuscatedData = encodedData.split('').reverse().join('');
    // 3. Embed with the new key.
    const dataComment = `<!-- do_not_delete: ${obfuscatedData} -->`;

    if (finalContext) {
        finalContext = `${finalContext.trimEnd()}\n\n${dataComment}`;
    } else {
        finalContext = dataComment;
    }
    return finalContext ? `${finalContext.trim()}\n` : '';
  };

  const handleDownloadContext = () => {
    const contentToDownload = addGamificationDataToContext(savedContext);
    const blob = new Blob([contentToDownload], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Life_Context_Backup.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleConfirmStartNew = () => {
    onStartNew();
    setIsConfirmingStartNew(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center animate-fadeIn">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-background-secondary dark:bg-transparent border border-border-secondary dark:border-border-primary rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-content-primary uppercase">
          {t('contextChoice_welcome_back')}
        </h1>
        <p className="text-lg text-content-secondary leading-relaxed">
          {t('contextChoice_intro')}
          <span className="hidden md:inline"> {t('contextChoice_question')}</span>
        </p>
        
        <div className="p-4 bg-background-primary dark:bg-background-primary border border-border-primary dark:border-border-primary text-left">
          <h2 className="text-sm font-bold text-accent-primary mb-2 uppercase tracking-wider">{t('contextChoice_preview_title')}</h2>
          
          {/* Full preview is now shown on all screen sizes */}
          <div className="prose prose-sm dark:prose-invert max-w-none max-h-60 overflow-y-auto">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({node, ...props}) => <h1 className="text-lg font-bold text-content-primary mb-2" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-base font-bold text-content-primary mb-1" {...props} />,
                    p: ({node, ...props}) => <p className="text-content-secondary" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-content-primary" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 text-content-secondary" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 text-content-secondary" {...props} />,
                    li: ({node, ...props}) => <li className="text-content-secondary" {...props} />,
                    hr: ({node, ...props}) => <hr className="my-6 border-border-secondary" {...props} />,
                }}
            >
                {contextPreviewFull}
            </ReactMarkdown>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <button
            onClick={onContinue}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 text-base font-bold text-button-foreground-on-accent bg-accent-primary uppercase hover:bg-accent-primary-hover focus:outline-none transition-colors duration-200 rounded-lg shadow-md"
          >
            <FileTextIcon className="w-6 h-6" />
            {t('contextChoice_continue')}
          </button>
           <button
            onClick={() => setIsConfirmingStartNew(true)}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 text-base font-bold text-content-secondary bg-transparent border border-border-secondary dark:border-border-primary uppercase hover:bg-background-tertiary dark:hover:bg-background-tertiary rounded-lg shadow-md"
          >
            <UploadIcon className="w-6 h-6" />
            {t('contextChoice_start_new')}
          </button>
        </div>
      </div>
      
      {isConfirmingStartNew && (
         <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => setIsConfirmingStartNew(false)}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-background-secondary dark:bg-background-primary w-full max-w-lg m-4 p-6 border border-status-warning-border dark:border-status-warning-border/50 shadow-xl rounded-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-content-primary flex items-center gap-3">
                        <WarningIcon className="w-6 h-6 text-status-warning-foreground" />
                        {t('contextChoice_confirm_title')}
                    </h2>
                     <button onClick={() => setIsConfirmingStartNew(false)} className="p-2 -mr-2 text-content-secondary hover:text-content-primary">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                 <p className="text-content-secondary text-left mb-6">{t('contextChoice_confirm_warning')}</p>

                 <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleDownloadContext}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-button-foreground-on-accent bg-accent-primary uppercase hover:bg-accent-primary-hover rounded-lg shadow-md"
                    >
                        <DownloadIcon className="w-5 h-5"/>
                        {t('contextChoice_confirm_download')}
                    </button>
                    <button onClick={handleConfirmStartNew} className="flex-1 px-4 py-2 text-sm font-bold text-button-foreground-on-accent bg-accent-secondary uppercase hover:bg-accent-secondary-hover rounded-lg shadow-md">
                        {t('contextChoice_confirm_proceed')}
                    </button>
                 </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default ContextChoiceView;