import React, { useState, useEffect } from 'react';
import * as userService from '../services/userService';
import { NewsletterSubscriber, NewsletterHistoryEntry } from '../services/userService';
import { apiFetch } from '../services/api';
import Spinner from './shared/Spinner';
import { MailIcon } from './icons/MailIcon';
import { ClockIcon } from './icons/ClockIcon';

const NewsletterPanel: React.FC = () => {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [history, setHistory] = useState<NewsletterHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [showSubscribers, setShowSubscribers] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const [subjectDE, setSubjectDE] = useState('');
  const [subjectEN, setSubjectEN] = useState('');
  const [textBodyDE, setTextBodyDE] = useState('');
  const [textBodyEN, setTextBodyEN] = useState('');
  
  const [result, setResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subscribersData, historyData] = await Promise.all([
        userService.getNewsletterSubscribers(),
        userService.getNewsletterHistory()
      ]);
      setSubscribers(subscribersData.subscribers);
      setHistory(historyData);
    } catch (error) {
      console.error('Failed to load newsletter data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!subjectDE || !subjectEN || !textBodyDE || !textBodyEN) {
      setResult({ type: 'error', message: 'Bitte alle Felder ausfüllen.' });
      return;
    }

    if (!window.confirm(`Newsletter an ${subscribers.length} Abonnenten versenden?\n\nDieser Vorgang kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await userService.sendNewsletter({
        subjectDE,
        subjectEN,
        textBodyDE,
        textBodyEN,
      });

      setResult({
        type: 'success',
        message: `Newsletter erfolgreich versendet! ${response.sent} von ${response.total} E-Mails gesendet.${response.failed > 0 ? ` (${response.failed} fehlgeschlagen)` : ''}`
      });

      // Clear fields after successful send
      setSubjectDE('');
      setSubjectEN('');
      setTextBodyDE('');
      setTextBodyEN('');
      
      // Reload history
      const historyData = await userService.getNewsletterHistory();
      setHistory(historyData);

    } catch (error: any) {
      setResult({
        type: 'error',
        message: error.message || 'Fehler beim Versenden des Newsletters.'
      });
    } finally {
      setSending(false);
    }
  };

  const handleTranslate = async () => {
    if (!subjectDE && !textBodyDE) {
      setResult({ type: 'error', message: 'Bitte mindestens Betreff oder Nachricht auf Deutsch eingeben.' });
      return;
    }

    setTranslating(true);
    setResult(null);

    try {
      const data = await apiFetch('/gemini/translate', {
        method: 'POST',
        body: JSON.stringify({
          subject: subjectDE || undefined,
          body: textBodyDE || undefined
        })
      });
      
      if (data.subject) {
        setSubjectEN(data.subject);
      }
      if (data.body) {
        setTextBodyEN(data.body);
      }

      setResult({
        type: 'success',
        message: 'Übersetzung erfolgreich! Bitte prüfen Sie die englische Version.'
      });

    } catch (error: any) {
      setResult({
        type: 'error',
        message: error.message || 'Fehler bei der Übersetzung.'
      });
    } finally {
      setTranslating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-background-secondary dark:bg-background-primary rounded-lg">
        <div className="flex items-center justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 p-6 bg-background-secondary dark:bg-background-primary rounded-lg border border-border-secondary dark:border-border-primary">
      <div className="flex items-center gap-3 mb-4">
        <MailIcon className="w-6 h-6 text-accent-primary" />
        <div>
          <h3 className="text-xl font-bold text-content-primary">Newsletter versenden</h3>
          <p className="text-sm text-content-secondary">
            Aktuell {subscribers.length} Abonnent{subscribers.length !== 1 ? 'en' : ''}
          </p>
        </div>
      </div>

      {/* Subscriber List Toggle */}
      <div className="mb-4">
        <button
          onClick={() => setShowSubscribers(!showSubscribers)}
          className="text-sm text-accent-primary hover:underline"
        >
          {showSubscribers ? '▼' : '▶'} Abonnenten anzeigen ({subscribers.length})
        </button>
        
        {showSubscribers && (
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto bg-background-tertiary dark:bg-background-secondary p-3 rounded border border-border-secondary">
            {subscribers.length === 0 ? (
              <p className="text-sm text-content-secondary italic">Keine Abonnenten vorhanden.</p>
            ) : (
              subscribers.map(sub => (
                <div key={sub.id} className="text-xs text-content-secondary p-2 bg-background-secondary dark:bg-background-primary rounded flex items-center justify-between">
                  <div>
                    <span className="font-mono">{sub.email}</span>
                    {(sub.firstName || sub.lastName) && (
                      <span className="ml-2 text-content-tertiary">
                        ({sub.firstName || ''} {sub.lastName || ''})
                      </span>
                    )}
                  </div>
                  {(sub as any).status === 'PENDING' && (
                    <span className="ml-2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 rounded text-[10px] font-medium">
                      PENDING
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {subscribers.length === 0 ? (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded text-sm text-content-secondary">
          Keine Newsletter-Abonnenten vorhanden. Nutzer können sich über ihre Profil-Einstellungen für den Newsletter anmelden.
        </div>
      ) : (
        <>
          {/* German Version */}
          <div className="space-y-3 mb-4 p-4 border border-border-secondary rounded-lg bg-background-tertiary dark:bg-background-secondary">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🇩🇪</span>
                <h4 className="font-bold text-content-primary">Deutsche Version</h4>
              </div>
              <button
                onClick={handleTranslate}
                disabled={translating || sending || (!subjectDE && !textBodyDE)}
                className="px-4 py-2 bg-content-tertiary/20 dark:bg-content-tertiary/10 text-content-primary hover:bg-content-tertiary/30 dark:hover:bg-content-tertiary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-semibold transition-colors rounded border border-border-secondary"
                title="Deutsche Version automatisch ins Englische übersetzen"
              >
                {translating ? (
                  <>
                    <Spinner />
                    <span className="hidden sm:inline">Übersetze...</span>
                  </>
                ) : (
                  <>
                    <span>🌐</span>
                    <span className="hidden sm:inline">Automatisch übersetzen</span>
                  </>
                )}
              </button>
            </div>
            <div>
              <label htmlFor="subject-de" className="block text-sm font-semibold text-content-secondary mb-1">
                Betreff
              </label>
              <input
                id="subject-de"
                type="text"
                placeholder="z.B. Neuigkeiten von Meaningful Conversations"
                value={subjectDE}
                onChange={(e) => setSubjectDE(e.target.value)}
                className="w-full p-2 border border-border-secondary rounded bg-background-primary text-content-primary focus:ring-2 focus:ring-accent-primary focus:outline-none"
                disabled={sending}
              />
            </div>
            <div>
              <label htmlFor="body-de" className="block text-sm font-semibold text-content-secondary mb-1">
                Nachricht (Markdown unterstützt)
              </label>
              <textarea
                id="body-de"
                placeholder="# Überschrift&#10;&#10;Newsletter-Text mit **Fettdruck** und *Kursiv*...&#10;&#10;- Punkt 1&#10;- Punkt 2"
                value={textBodyDE}
                onChange={(e) => setTextBodyDE(e.target.value)}
                rows={8}
                className="w-full p-2 border border-border-secondary rounded bg-background-primary text-content-primary focus:ring-2 focus:ring-accent-primary focus:outline-none font-mono text-sm"
                disabled={sending}
              />
              <p className="text-xs text-content-tertiary mt-1">
                Markdown-Formatierung wird in HTML konvertiert: **fett**, *kursiv*, # Überschrift, - Liste, etc.
              </p>
            </div>
          </div>

          {/* English Version */}
          <div className="space-y-3 mb-4 p-4 border border-border-secondary rounded-lg bg-background-tertiary dark:bg-background-secondary">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🇬🇧</span>
              <h4 className="font-bold text-content-primary">English Version</h4>
            </div>
            <div>
              <label htmlFor="subject-en" className="block text-sm font-semibold text-content-secondary mb-1">
                Subject
              </label>
              <input
                id="subject-en"
                type="text"
                placeholder="e.g. News from Meaningful Conversations"
                value={subjectEN}
                onChange={(e) => setSubjectEN(e.target.value)}
                className="w-full p-2 border border-border-secondary rounded bg-background-primary text-content-primary focus:ring-2 focus:ring-accent-primary focus:outline-none"
                disabled={sending}
              />
            </div>
            <div>
              <label htmlFor="body-en" className="block text-sm font-semibold text-content-secondary mb-1">
                Message (Markdown supported)
              </label>
              <textarea
                id="body-en"
                placeholder="# Heading&#10;&#10;Newsletter text with **bold** and *italic*...&#10;&#10;- Item 1&#10;- Item 2"
                value={textBodyEN}
                onChange={(e) => setTextBodyEN(e.target.value)}
                rows={8}
                className="w-full p-2 border border-border-secondary rounded bg-background-primary text-content-primary focus:ring-2 focus:ring-accent-primary focus:outline-none font-mono text-sm"
                disabled={sending}
              />
              <p className="text-xs text-content-tertiary mt-1">
                Markdown formatting will be converted to HTML: **bold**, *italic*, # heading, - list, etc.
              </p>
            </div>
          </div>

          {/* Result Message */}
          {result && (
            <div className={`p-3 rounded mb-4 ${result.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700'}`}>
              {result.message}
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={sending || !subjectDE || !subjectEN || !textBodyDE || !textBodyEN}
            className="w-full px-6 py-3 bg-accent-primary text-button-foreground-on-accent font-bold rounded-lg hover:bg-accent-primary-hover disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            {sending ? (
              <>
                <Spinner />
                <span>Newsletter wird versendet...</span>
              </>
            ) : (
              <>
                <MailIcon className="w-5 h-5" />
                <span>Newsletter an {subscribers.length} Abonnent{subscribers.length !== 1 ? 'en' : ''} versenden</span>
              </>
            )}
          </button>

          {/* Info Box */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded text-sm text-content-secondary">
            <p className="font-semibold mb-1">ℹ️ Hinweise:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>✨ <strong>Markdown wird automatisch in formatiertes HTML konvertiert</strong></li>
              <li>Nur AKTIVE Nutzer mit Newsletter-Zustimmung erhalten die E-Mail</li>
              <li>Nutzer erhalten die E-Mail in ihrer bevorzugten Sprache</li>
              <li>Jede E-Mail enthält einen Abmelde-Link</li>
              <li>Der Versand erfolgt sequenziell, um Rate-Limits zu beachten</li>
              <li>In Development-Umgebungen wird der Versand nur simuliert</li>
            </ul>
          </div>
        </>
      )}
      
      {/* Newsletter History */}
      <div className="mt-6 p-4 bg-background-tertiary dark:bg-background-secondary rounded-lg border border-border-secondary">
        <div className="flex items-center gap-2 mb-3">
          <ClockIcon className="w-5 h-5 text-accent-primary" />
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm font-semibold text-content-primary hover:text-accent-primary"
          >
            {showHistory ? '▼' : '▶'} Versand-Historie ({history.length})
          </button>
        </div>
        
        {showHistory && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-sm text-content-secondary italic">Noch keine Newsletter versendet.</p>
            ) : (
              history.map(entry => (
                <div key={entry.id} className="p-3 bg-background-primary dark:bg-background-tertiary rounded border border-border-secondary">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-content-primary">
                        🇩🇪 {entry.subjectDE} / 🇬🇧 {entry.subjectEN}
                      </p>
                      <p className="text-xs text-content-secondary mt-1">
                        Versendet von: {entry.sentByEmail}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-content-tertiary">
                        {new Date(entry.createdAt).toLocaleString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 text-xs mt-2">
                    <span className="text-green-600 dark:text-green-400">
                      ✓ {entry.successCount} erfolgreich
                    </span>
                    {entry.failedCount > 0 && (
                      <span className="text-red-600 dark:text-red-400">
                        ✗ {entry.failedCount} fehlgeschlagen
                      </span>
                    )}
                    <span className="text-content-tertiary">
                      von {entry.recipientCount} Empfängern
                    </span>
                  </div>
                  
                  {entry.errors && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                        Fehler anzeigen
                      </summary>
                      <pre className="text-xs mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded overflow-x-auto">
                        {JSON.stringify(entry.errors, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsletterPanel;

