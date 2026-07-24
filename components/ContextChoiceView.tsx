import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { FileText, RotateCcw, Pencil } from 'lucide-react';
import { User, GamificationState } from '../types';
import { useLocalization } from '../context/LocalizationContext';
import { useModalOpen } from '../utils/modalUtils';
import { DownloadIcon } from './icons/DownloadIcon';
import { WarningIcon } from './icons/WarningIcon';
import { XIcon } from './icons/XIcon';
import { LogoIcon } from './icons/LogoIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { serializeGamificationState } from '../utils/gamificationSerializer';
import Button from './shared/Button';
import { downloadTextFile } from '../utils/fileDownload';
import { useFocusTrap } from '../utils/useFocusTrap';

interface ContextChoiceViewProps {
  user: User;
  savedContext: string;
  onContinue: () => void;
  onStartNew: () => void;
  onEdit?: () => void;
  gamificationState: GamificationState;
}

const removeGamificationKey = (text: string) => {
  return text.replace(/<!-- (gmf-data|do_not_delete): (.*?) -->\s*$/, '').trim();
};

const markdownComponents = {
  h1: ({ ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-lg font-bold text-content-primary mb-2" {...props} />
  ),
  h2: ({ ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-base font-bold text-content-primary mb-1" {...props} />
  ),
  p: ({ ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-content-secondary" {...props} />
  ),
  strong: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-bold text-content-primary" {...props} />
  ),
  ul: ({ ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc pl-5 text-content-secondary" {...props} />
  ),
  ol: ({ ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal pl-5 text-content-secondary" {...props} />
  ),
  li: ({ ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="text-content-secondary" {...props} />
  ),
  hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className="my-6 border-border-secondary" {...props} />
  ),
};

const ContextChoiceView: React.FC<ContextChoiceViewProps> = ({
  savedContext,
  gamificationState,
  onContinue,
  onStartNew,
  onEdit,
}) => {
  const { t, language } = useLocalization();
  const [isConfirmingStartNew, setIsConfirmingStartNew] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, () => setIsConfirmingStartNew(false), isConfirmingStartNew);
  useModalOpen(isConfirmingStartNew);

  const contextPreviewFull = useMemo(() => removeGamificationKey(savedContext.trim()), [savedContext]);
  const contextFileName = language === 'de' ? 'Lebenskontext.md' : 'Life-Context.md';

  const addGamificationDataToContext = (context: string): string => {
    let finalContext = context.replace(/<!-- (gmf-data|do_not_delete): (.*?) -->/g, '').trim();
    const dataToSerialize = serializeGamificationState(gamificationState);

    const encodedData = btoa(dataToSerialize);
    const obfuscatedData = encodedData.split('').reverse().join('');
    const dataComment = `<!-- do_not_delete: ${obfuscatedData} -->`;

    if (finalContext) {
      finalContext = `${finalContext.trimEnd()}\n\n${dataComment}`;
    } else {
      finalContext = dataComment;
    }
    return finalContext ? `${finalContext.trim()}\n` : '';
  };

  const handleDownloadContext = async () => {
    const contentToDownload = addGamificationDataToContext(savedContext);
    try {
      await downloadTextFile(contentToDownload, 'Life_Context_Backup.md', 'text/markdown;charset=utf-8');
    } catch (err) {
      console.error('Context download failed:', err);
    }
  };

  const handleConfirmStartNew = () => {
    onStartNew();
    setIsConfirmingStartNew(false);
  };

  return (
    <div className="flex flex-col items-center py-6 md:py-10 px-4 text-center animate-fadeIn">
      <div className="w-full max-w-2xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center"
        >
          <LogoIcon className="w-12 h-12 text-accent-primary mb-4" aria-hidden="true" />
          <h1 className="text-2xl sm:text-3xl font-semibold text-content-primary tracking-tight mb-2">
            {t('contextChoice_welcome_back')}
          </h1>
          <p className="text-sm sm:text-base text-content-secondary max-w-md leading-relaxed">
            {t('contextChoice_intro')}
            <span className="hidden sm:inline"> {t('contextChoice_question')}</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="w-full space-y-4 text-left"
        >
          <div className="p-4 space-y-4 bg-background-secondary/90 backdrop-blur-sm border border-border-primary rounded-card shadow-card">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-2 bg-accent-primary/20 rounded-lg">
                <FileText className="w-6 h-6 text-accent-primary" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-content-primary truncate" title={contextFileName}>
                  {contextFileName}
                </p>
                {onEdit && (
                  <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex items-center gap-1.5 text-sm text-accent-primary hover:text-accent-primary-hover hover:underline mt-0.5"
                  >
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    {t('contextChoice_edit')}
                  </button>
                )}
              </div>
            </div>

            {contextPreviewFull && (
              <div>
                <p className="text-xs font-semibold text-content-subtle mb-1">{t('contextChoice_preview_title')}</p>
                <div className="prose prose-sm dark:prose-invert max-w-none h-48 md:h-[28vh] overflow-y-auto p-3 bg-background-tertiary border border-border-primary rounded-lg scrollbar-themed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {contextPreviewFull}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={onContinue}
              variant="gradient"
              size="lg"
              fullWidth
              leftIcon={<FileText className="w-5 h-5" aria-hidden="true" />}
            >
              {t('contextChoice_continue')}
            </Button>
            <Button
              onClick={() => setIsConfirmingStartNew(true)}
              variant="outline"
              size="lg"
              fullWidth
              leftIcon={<RotateCcw className="w-5 h-5" aria-hidden="true" />}
            >
              {t('contextChoice_start_new')}
            </Button>
          </div>
        </motion.div>
      </div>

      {isConfirmingStartNew &&
        createPortal(
          <div
            ref={modalRef}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4"
            style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
            onClick={() => setIsConfirmingStartNew(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="context-choice-confirm-title"
          >
            <div
              className="bg-background-secondary dark:bg-background-primary w-full max-w-lg p-6 border border-status-warning-border dark:border-status-warning-border/50 shadow-xl rounded-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2
                  id="context-choice-confirm-title"
                  className="text-2xl font-bold text-content-primary flex items-center gap-3"
                >
                  <WarningIcon className="w-6 h-6 text-status-warning-foreground" />
                  {t('contextChoice_confirm_title')}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsConfirmingStartNew(false)}
                  className="p-2 -mr-2 text-content-secondary hover:text-content-primary"
                  aria-label={t('contextChoice_confirm_cancel')}
                >
                  <XIcon className="w-6 h-6" />
                </button>
              </div>
              <p className="text-content-secondary text-left mb-6">{t('contextChoice_confirm_warning')}</p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleDownloadContext}
                  size="sm"
                  className="flex-1"
                  leftIcon={<DownloadIcon className="w-5 h-5" />}
                >
                  {t('contextChoice_confirm_download')}
                </Button>
                <Button
                  onClick={handleConfirmStartNew}
                  size="sm"
                  className="flex-1 bg-accent-secondary hover:bg-accent-secondary-hover"
                >
                  {t('contextChoice_confirm_proceed')}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ContextChoiceView;
