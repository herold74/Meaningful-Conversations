import React, { useState, useEffect } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import Button from './shared/Button';
import { downloadTextFile } from '../utils/fileDownload';
import { generateLifeContextPDF } from '../utils/lifeContextPDF';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface LifeContextEditorViewProps {
  lifeContext: string;
  onSave: (newContext: string) => void;
  onCancel: () => void;
  showPiiTips?: boolean;
  title?: string;
  description?: string;
}

const LifeContextEditorView: React.FC<LifeContextEditorViewProps> = ({ 
  lifeContext, 
  onSave, 
  onCancel,
  showPiiTips = true,
  title,
  description,
}) => {
  const { t, language } = useLocalization();
  const [editableContext, setEditableContext] = useState(lifeContext);
  const [hasChanges, setHasChanges] = useState(false);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    setEditableContext(lifeContext);
  }, [lifeContext]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableContext(e.target.value);
    setHasChanges(e.target.value !== lifeContext);
  };

  const handleSave = () => {
    onSave(editableContext);
  };

  const handleDownloadMd = async () => {
    try {
      await downloadTextFile(editableContext, 'Life_Context.md', 'text/markdown;charset=utf-8');
    } catch (err) {
      console.error('Context .md download failed:', err);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      await generateLifeContextPDF(editableContext, language as 'de' | 'en', 'Life_Context.pdf');
    } catch (err) {
      console.error('Context PDF download failed:', err);
    }
  };

  const headerTitle = title || (language === 'de' ? '📝 Lebenskontext bearbeiten' : '📝 Edit Life Context');
  const headerDesc = description || (language === 'de' 
    ? 'Hier kannst du deinen Lebenskontext direkt bearbeiten. Ersetze echte Namen und Firmennamen durch Pseudonyme (z.B. "mein Chef" statt "Hans Müller").'
    : 'Here you can edit your Life Context directly. Replace real names and company names with pseudonyms (e.g., "my boss" instead of "John Smith").');

  return (
    <div className="flex flex-col items-center py-4 md:py-6 animate-fadeIn">
      <div className="w-full max-w-3xl p-6 sm:p-8 space-y-4 bg-background-secondary border border-border-primary rounded-card shadow-card-elevated">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-content-primary mb-2">
            {headerTitle}
          </h2>
          <p className="text-content-secondary text-sm">
            {headerDesc}
          </p>
        </div>

        {/* PII Tips (optional) */}
        {showPiiTips && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <p className="text-blue-800 dark:text-blue-300 font-medium mb-2">
              💡 {language === 'de' ? 'Tipps für mehr Privatsphäre:' : 'Tips for more privacy:'}
            </p>
            <ul className="text-blue-700 dark:text-blue-400 text-sm list-disc list-inside space-y-1">
              <li>{language === 'de' ? '"Hans Müller" → "mein Chef" oder "Herr M."' : '"John Smith" → "my boss" or "Mr. S."'}</li>
              <li>{language === 'de' ? '"Beispiel GmbH" → "meine Firma" oder "das Unternehmen"' : '"Example Inc." → "my company" or "the company"'}</li>
              <li>{language === 'de' ? '"Hauptstraße 15, 1180 Wien" → "meine Wohnung" oder "Wien"' : '"123 Main Street, NYC" → "my apartment" or "New York"'}</li>
            </ul>
          </div>
        )}

        {/* Edit / Preview Toggle */}
        <div className="flex border-b border-border-primary">
          <button
            onClick={() => setMode('edit')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'edit'
                ? 'border-b-2 border-accent-primary text-accent-primary'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            ✏️ {t('lc_editor_edit')}
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'preview'
                ? 'border-b-2 border-accent-primary text-accent-primary'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            👁 {t('lc_editor_preview')}
          </button>
        </div>

        {/* Editor / Preview — same height for both modes */}
        <div>
          {mode === 'edit' ? (
            <>
              <textarea
                value={editableContext}
                onChange={handleTextChange}
                className="w-full h-64 md:h-[55vh] p-4 bg-background-primary dark:bg-gray-900 border border-border-secondary dark:border-border-primary rounded-lg 
                           text-content-primary font-mono text-sm resize-y
                           focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                placeholder={language === 'de' ? 'Dein Lebenskontext...' : 'Your Life Context...'}
              />
              <p className="text-content-secondary text-xs mt-2">
                {language === 'de' 
                  ? `${editableContext.length} Zeichen`
                  : `${editableContext.length} characters`}
                {hasChanges && (
                  <span className="text-amber-600 dark:text-amber-400 ml-2">
                    • {language === 'de' ? 'Ungespeicherte Änderungen' : 'Unsaved changes'}
                  </span>
                )}
              </p>
            </>
          ) : (
            <div className="w-full h-64 md:h-[55vh] overflow-y-auto p-4 bg-background-primary dark:bg-gray-900 border border-border-secondary dark:border-border-primary rounded-lg prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {editableContext || (language === 'de' ? '*Kein Inhalt*' : '*No content*')}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-between">
          <div className="flex gap-3">
            <Button onClick={handleDownloadMd} variant="secondary" size="md">
              📥 .md
            </Button>
            <Button onClick={handleDownloadPdf} variant="secondary" size="md">
              📄 PDF
            </Button>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={onCancel}
              variant="secondary"
              size="md"
            >
              {language === 'de' ? 'Abbrechen' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSave}
              variant="primary"
              size="md"
              disabled={!hasChanges}
            >
              {language === 'de' ? 'Speichern & Zurück' : 'Save & Return'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LifeContextEditorView;
