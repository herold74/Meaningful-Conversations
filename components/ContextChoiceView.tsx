import React, { useState } from 'react';
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

const ContextChoiceView: React.FC<ContextChoiceViewProps> = ({ user, savedContext, gamificationState, onContinue, onStartNew }) => {
  const { t } = useLocalization();
  const [isConfirmingStartNew, setIsConfirmingStartNew] = useState(false);

  const contextPreviewFull = savedContext.trim();

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
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">
          {t('contextChoice_welcome_back')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          {t('contextChoice_intro')}
          <span className="hidden md:inline"> {t('contextChoice_question')}</span>
        </p>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-left">
          <h2 className="text-sm font-bold text-green-600 dark:text-green-400 mb-2 uppercase tracking-wider">{t('contextChoice_preview_title')}</h2>
          
          {/* Full preview is now shown on all screen sizes */}
          <div className="prose prose-sm dark:prose-invert max-w-none max-h-60 overflow-y-auto">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({node, ...props}) => <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-1" {...props} />,
                    p: ({node, ...props}) => <p className="text-gray-700 dark:text-gray-400" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-gray-800 dark:text-gray-200" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 text-gray-700 dark:text-gray-400" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 text-gray-700 dark:text-gray-400" {...props} />,
                    li: ({node, ...props}) => <li className="text-gray-700 dark:text-gray-400" {...props} />,
                    hr: ({node, ...props}) => <hr className="my-6 border-gray-300 dark:border-gray-700" {...props} />,
                }}
            >
                {contextPreviewFull}
            </ReactMarkdown>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <button
            onClick={onContinue}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 text-base font-bold text-black bg-green-400 uppercase hover:bg-green-500 focus:outline-none transition-colors duration-200 rounded-lg shadow-md"
          >
            <FileTextIcon className="w-6 h-6" />
            {t('contextChoice_continue')}
          </button>
           <button
            onClick={() => setIsConfirmingStartNew(true)}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 text-base font-bold text-gray-700 dark:text-gray-300 bg-transparent border border-gray-400 dark:border-gray-700 uppercase hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg shadow-md"
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
                className="bg-white dark:bg-gray-900 w-full max-w-lg m-4 p-6 border border-yellow-400 dark:border-yellow-500/50 shadow-xl rounded-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 flex items-center gap-3">
                        <WarningIcon className="w-6 h-6 text-yellow-500" />
                        {t('contextChoice_confirm_title')}
                    </h2>
                     <button onClick={() => setIsConfirmingStartNew(false)} className="p-2 -mr-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                 <p className="text-gray-600 dark:text-gray-400 text-left mb-6">{t('contextChoice_confirm_warning')}</p>

                 <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleDownloadContext}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-black bg-green-400 uppercase hover:bg-green-500 rounded-lg shadow-md"
                    >
                        <DownloadIcon className="w-5 h-5"/>
                        {t('contextChoice_confirm_download')}
                    </button>
                    <button onClick={handleConfirmStartNew} className="flex-1 px-4 py-2 text-sm font-bold text-black bg-[#FECC78] uppercase hover:brightness-95 rounded-lg shadow-md">
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