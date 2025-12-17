import React, { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import Button from './shared/Button';

interface NarrativeStoriesModalProps {
  onComplete: (stories: { flowStory: string; frictionStory: string }) => void;
  onCancel: () => void;
  oldStories?: { flowStory: string; frictionStory: string };
}

const MIN_CHARS = 50;

const NarrativeStoriesModal: React.FC<NarrativeStoriesModalProps> = ({
  onComplete,
  onCancel,
  oldStories
}) => {
  const { t } = useLocalization();
  const [flowStory, setFlowStory] = useState('');
  const [frictionStory, setFrictionStory] = useState('');

  const flowValid = flowStory.trim().length >= MIN_CHARS;
  const frictionValid = frictionStory.trim().length >= MIN_CHARS;
  const allValid = flowValid && frictionValid;

  const getTextareaBorderClass = (isValid: boolean, hasContent: boolean) => {
    if (!hasContent) return 'border-border-secondary';
    return isValid ? 'border-green-500' : 'border-red-500';
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-background-primary dark:bg-background-secondary rounded-xl shadow-2xl max-w-3xl w-full p-8 my-8 animate-fadeIn">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-content-primary mb-2">
            ✨ {t('narrative_stories_modal_title') || 'Aktualisiere deine Erfahrungen'}
          </h2>
          <p className="text-content-secondary text-sm">
            {t('narrative_stories_modal_desc') || 
              'Um eine aktuelle und relevante Persönlichkeits-Signatur zu erstellen, beschreibe bitte zwei konkrete Erlebnisse aus deinem aktuellen Leben.'}
          </p>
        </div>

        {/* Info Box: Why we need this */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg">
          <p className="text-sm text-content-secondary">
            <strong className="text-blue-700 dark:text-blue-400">💡 {t('narrative_stories_modal_why') || 'Warum?'}</strong>
            <br />
            {t('narrative_stories_modal_reason') || 
              'Deine Persönlichkeit entwickelt sich weiter. Neue Erfahrungen führen zu relevanteren Einsichten als alte Stories.'}
          </p>
        </div>

        {/* Old Stories Hint (collapsed, not editable) */}
        {oldStories && (
          <details className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700">
            <summary className="cursor-pointer text-sm font-medium text-content-secondary hover:text-content-primary">
              📋 {t('narrative_stories_modal_show_old') || 'Deine vorherigen Antworten anzeigen (als Inspiration)'}
            </summary>
            <div className="mt-4 space-y-3 text-sm text-content-secondary">
              <div>
                <strong>{t('survey_narrative_flow_label') || 'Flow-Erlebnis'}:</strong>
                <p className="mt-1 italic opacity-75">&quot;{oldStories.flowStory}&quot;</p>
              </div>
              <div>
                <strong>{t('survey_narrative_friction_label') || 'Reibungs-Erlebnis'}:</strong>
                <p className="mt-1 italic opacity-75">&quot;{oldStories.frictionStory}&quot;</p>
              </div>
            </div>
          </details>
        )}

        {/* Flow Story Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-content-primary mb-2">
            1️⃣ {t('survey_narrative_flow_label') || 'Flow-Erlebnis'}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <p className="text-xs text-content-secondary mb-3">
            {t('survey_narrative_flow_desc') || 
              'Beschreibe eine aktuelle Situation, in der du voll in deinem Element warst – Zeit verging wie im Flug, alles floss mühelos.'}
          </p>
          <textarea
            value={flowStory}
            onChange={(e) => setFlowStory(e.target.value)}
            placeholder={t('survey_narrative_flow_placeholder') || 'Z.B.: "Letzte Woche habe ich..."'}
            rows={5}
            className={`w-full p-3 rounded-lg border-2 
              bg-background-primary dark:bg-background-tertiary 
              text-content-primary resize-y transition-colors
              ${getTextareaBorderClass(flowValid, flowStory.length > 0)}`}
          />
          <div className="flex justify-between items-center mt-2">
            <span className={`text-xs ${flowValid ? 'text-green-600 dark:text-green-400' : 'text-content-secondary'}`}>
              {flowStory.length} / {MIN_CHARS}+ Zeichen
            </span>
            {flowValid && <span className="text-green-600 text-sm">✓</span>}
          </div>
        </div>

        {/* Friction Story Input */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-content-primary mb-2">
            2️⃣ {t('survey_narrative_friction_label') || 'Reibungs-Erlebnis'}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <p className="text-xs text-content-secondary mb-3">
            {t('survey_narrative_friction_desc') || 
              'Beschreibe eine aktuelle Herausforderung oder Frustration – eine Situation, die dich Energie kostet oder in der du gegen Widerstände kämpfst.'}
          </p>
          <textarea
            value={frictionStory}
            onChange={(e) => setFrictionStory(e.target.value)}
            placeholder={t('survey_narrative_friction_placeholder') || 'Z.B.: "Ich merke immer wieder, dass..."'}
            rows={5}
            className={`w-full p-3 rounded-lg border-2 
              bg-background-primary dark:bg-background-tertiary 
              text-content-primary resize-y transition-colors
              ${getTextareaBorderClass(frictionValid, frictionStory.length > 0)}`}
          />
          <div className="flex justify-between items-center mt-2">
            <span className={`text-xs ${frictionValid ? 'text-green-600 dark:text-green-400' : 'text-content-secondary'}`}>
              {frictionStory.length} / {MIN_CHARS}+ Zeichen
            </span>
            {frictionValid && <span className="text-green-600 text-sm">✓</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => onComplete({ flowStory: flowStory.trim(), frictionStory: frictionStory.trim() })}
            disabled={!allValid}
            size="lg"
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed"
          >
            ✨ {t('narrative_stories_modal_generate') || 'Signatur jetzt generieren'}
          </Button>
          <Button
            onClick={onCancel}
            variant="secondary"
            size="lg"
            className="flex-1"
          >
            {t('narrative_stories_modal_cancel') || 'Abbrechen'}
          </Button>
        </div>

        {/* Privacy Note */}
        <p className="mt-4 text-xs text-content-secondary text-center">
          🔒 {t('narrative_stories_modal_privacy') || 
            'Deine Geschichten werden verschlüsselt gespeichert und nur für die Signatur-Generierung verwendet.'}
        </p>
      </div>
    </div>
  );
};

export default NarrativeStoriesModal;

