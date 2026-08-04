import { downloadTextFile } from './fileDownload';
import { Language } from '../types';

export interface PracticeTranscriptDownloadMeta {
  frameworkName: string;
  scenarioName: string;
  difficultyLabel: string;
  createdAt?: string | Date;
  language: Language;
}

/** Download a stored Coach Practice session transcript as plain text. */
export async function downloadPracticeTranscript(
  transcript: string,
  meta: PracticeTranscriptDownloadMeta,
): Promise<void> {
  const date = meta.createdAt ? new Date(meta.createdAt) : new Date();
  const formattedDate = date.toLocaleDateString('en-CA');
  const formattedDateTime = date.toLocaleString(meta.language === 'de' ? 'de-DE' : 'en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const title = meta.language === 'de' ? 'Coach Practice — Transkript' : 'Coach Practice — Transcript';
  const lines = [
    title,
    `${meta.language === 'de' ? 'Methode' : 'Framework'}: ${meta.frameworkName}`,
    `${meta.language === 'de' ? 'Szenario' : 'Scenario'}: ${meta.scenarioName}`,
    `${meta.language === 'de' ? 'Schwierigkeit' : 'Difficulty'}: ${meta.difficultyLabel}`,
    `${meta.language === 'de' ? 'Datum' : 'Date'}: ${formattedDateTime}`,
    '---------------------------------',
    '',
    transcript.trim(),
  ];

  await downloadTextFile(
    lines.join('\n'),
    `Practice_Transcript_${formattedDate}.txt`,
  );
}
