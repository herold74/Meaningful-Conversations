import React, { useState, useEffect } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import Button from './shared/Button';

interface LifeContextEditorViewProps {
  lifeContext: string;
  onSave: (newContext: string) => void;
  onCancel: () => void;
}

/**
 * Simple Life Context Editor View
 * Allows users to directly edit their Life Context without going through a chat session.
 * Used for PII cleanup before enabling DPC/DPFL mode.
 */
const LifeContextEditorView: React.FC<LifeContextEditorViewProps> = ({ 
  lifeContext, 
  onSave, 
  onCancel 
}) => {
  const { t, language } = useLocalization();
  const [editableContext, setEditableContext] = useState(lifeContext);
  const [hasChanges, setHasChanges] = useState(false);

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

  const handleDownload = () => {
    const blob = new Blob([editableContext], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Life_Context.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="py-10 animate-fadeIn max-w-4xl mx-auto px-4">
      <div className="bg-background-secondary dark:bg-transparent border border-border-secondary dark:border-border-primary rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-content-primary mb-2">
            {language === 'de' ? '📝 Lebenskontext bearbeiten' : '📝 Edit Life Context'}
          </h2>
          <p className="text-content-secondary text-sm">
            {language === 'de' 
              ? 'Hier kannst du deinen Lebenskontext direkt bearbeiten. Ersetze echte Namen und Firmennamen durch Pseudonyme (z.B. "mein Chef" statt "Hans Müller").'
              : 'Here you can edit your Life Context directly. Replace real names and company names with pseudonyms (e.g., "my boss" instead of "John Smith").'}
          </p>
        </div>

        {/* Tips Box */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <p className="text-blue-800 dark:text-blue-300 font-medium mb-2">
            💡 {language === 'de' ? 'Tipps für mehr Privatsphäre:' : 'Tips for more privacy:'}
          </p>
          <ul className="text-blue-700 dark:text-blue-400 text-sm list-disc list-inside space-y-1">
            <li>{language === 'de' ? '"Hans Müller" → "mein Chef" oder "Herr M."' : '"John Smith" → "my boss" or "Mr. S."'}</li>
            <li>{language === 'de' ? '"Beispiel GmbH" → "meine Firma" oder "das Unternehmen"' : '"Example Inc." → "my company" or "the company"'}</li>
            <li>{language === 'de' ? '"Hauptstraße 15, 1180 Wien" → "meine Wohnung" oder "Wien"' : '"123 Main Street, NYC" → "my apartment" or "New York"'}</li>
          </ul>
        </div>

        {/* Editor */}
        <div className="mb-6">
          <textarea
            value={editableContext}
            onChange={handleTextChange}
            className="w-full h-96 p-4 bg-background-primary dark:bg-gray-900 border border-border-secondary dark:border-border-primary rounded-lg 
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
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-between">
          <Button
            onClick={handleDownload}
            variant="secondary"
            size="md"
          >
            📥 {language === 'de' ? 'Herunterladen' : 'Download'}
          </Button>
          
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
