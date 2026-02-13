import React from 'react';
import { Document, Page, View, Text, StyleSheet, pdf } from '@react-pdf/renderer';
import { TranscriptEvaluationResult, TranscriptPreAnswers } from '../types';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

// ============================================================================
// STYLES
// ============================================================================

const colors = {
  primary: '#1B7272',
  white: '#ffffff',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray400: '#9ca3af',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  teal50: '#f0fdfa',
  green500: '#16a34a',
  yellow500: '#eab308',
  red500: '#ef4444',
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: colors.gray800,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 6,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.white,
  },
  section: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.gray100,
    borderRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  scoreBadge: {
    backgroundColor: colors.primary,
    color: colors.white,
    padding: '4 8',
    borderRadius: 3,
    fontSize: 10,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 10,
    lineHeight: 1.5,
    color: colors.gray700,
    marginBottom: 4,
  },
  bulletList: {
    marginTop: 4,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginRight: 6,
    marginTop: 5,
  },
  bulletText: {
    fontSize: 10,
    lineHeight: 1.4,
    color: colors.gray700,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: colors.gray400,
  },
});

// ============================================================================
// PDF DOCUMENT COMPONENT
// ============================================================================

interface TranscriptEvaluationPDFProps {
  evaluation: TranscriptEvaluationResult;
  preAnswers: TranscriptPreAnswers;
  userEmail?: string;
  lang: 'de' | 'en';
}

const BulletList: React.FC<{ items: string[] }> = ({ items }) => {
  if (items.length === 0) return <Text style={styles.text}>—</Text>;
  return (
    <View style={styles.bulletList}>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletItem}>
          <View style={styles.bullet} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
};

const TranscriptEvaluationPDF: React.FC<TranscriptEvaluationPDFProps> = ({
  evaluation,
  preAnswers,
  userEmail,
  lang,
}) => {
  const t = (key: string) => {
    const translations: Record<string, { de: string; en: string }> = {
      title: { de: 'Transkript-Auswertung', en: 'Transcript Evaluation' },
      pre_questions: { de: 'Ihre Reflexion vor dem Gespräch', en: 'Your Pre-Reflection' },
      goal: { de: 'Ziel', en: 'Goal' },
      personal_target: { de: 'Persönliches Ziel', en: 'Personal Target' },
      assumptions: { de: 'Annahmen', en: 'Assumptions' },
      satisfaction: { de: 'Erwartete Zufriedenheit', en: 'Expected Satisfaction' },
      difficult: { de: 'Herausforderung', en: 'Challenge' },
      overall_score: { de: 'Gesamtbewertung', en: 'Overall Score' },
      goal_alignment: { de: 'Zielerreichung', en: 'Goal Alignment' },
      achieved: { de: 'Erreicht', en: 'Achieved' },
      evidence: { de: 'Belege', en: 'Evidence' },
      behavioral_analysis: { de: 'Verhaltensanalyse', en: 'Behavioral Analysis' },
      target_behaviors: { de: 'Zielverhalten erkannt', en: 'Target Behaviors Observed' },
      assumption_check: { de: 'Annahmen-Check', en: 'Assumption Check' },
      confirmed: { de: 'Bestätigt', en: 'Confirmed' },
      rejected: { de: 'Widerlegt', en: 'Rejected' },
      calibration: { de: 'Selbstwahrnehmung vs. Realität', en: 'Self-Rating vs. Evidence' },
      self_rating: { de: 'Ihre Einschätzung', en: 'Your Rating' },
      actual_score: { de: 'Tatsächlicher Score', en: 'Actual Score' },
      personality_insights: { de: 'Persönlichkeitsbasierte Erkenntnisse', en: 'Personality Insights' },
      strengths: { de: 'Stärken', en: 'Strengths' },
      development: { de: 'Entwicklungsfelder', en: 'Development Areas' },
      next_steps: { de: 'Nächste Schritte', en: 'Next Steps' },
      footer: {
        de: 'Generiert von Meaningful Conversations • Vertraulich',
        en: 'Generated by Meaningful Conversations • Confidential',
      },
    };
    return translations[key]?.[lang] || key;
  };

  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('title')}</Text>
          <Text style={styles.headerSubtitle}>
            {formatDate()} {userEmail ? `• ${userEmail}` : ''}
          </Text>
        </View>

        {/* Pre-Questions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('pre_questions')}</Text>
          <View style={styles.divider} />
          <Text style={styles.text}>
            <Text style={{ fontWeight: 'bold' }}>{t('goal')}: </Text>
            {preAnswers.goal}
          </Text>
          <Text style={styles.text}>
            <Text style={{ fontWeight: 'bold' }}>{t('personal_target')}: </Text>
            {preAnswers.personalTarget}
          </Text>
          <Text style={styles.text}>
            <Text style={{ fontWeight: 'bold' }}>{t('assumptions')}: </Text>
            {preAnswers.assumptions}
          </Text>
          <Text style={styles.text}>
            <Text style={{ fontWeight: 'bold' }}>{t('satisfaction')}: </Text>
            {preAnswers.satisfaction}/10
          </Text>
          {preAnswers.difficult && (
            <Text style={styles.text}>
              <Text style={{ fontWeight: 'bold' }}>{t('difficult')}: </Text>
              {preAnswers.difficult}
            </Text>
          )}
        </View>

        {/* Overall Score */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('overall_score')}</Text>
            <Text style={styles.scoreBadge}>
              {evaluation.overallScore}/10
            </Text>
          </View>
          <Text style={styles.text}>{evaluation.summary}</Text>
        </View>

        {/* Goal Alignment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('goal_alignment')}</Text>
          <View style={styles.divider} />
          <Text style={styles.text}>
            <Text style={{ fontWeight: 'bold' }}>{t('achieved')}: </Text>
            {evaluation.goalAlignment.score}/10
          </Text>
          <Text style={styles.text}>
            <Text style={{ fontWeight: 'bold' }}>{t('evidence')}: </Text>
          </Text>
          <Text style={styles.bulletText}>{evaluation.goalAlignment.evidence}</Text>
          {evaluation.goalAlignment.gaps && (
            <>
              <Text style={styles.text}>
                <Text style={{ fontWeight: 'bold' }}>Gaps: </Text>
              </Text>
              <Text style={styles.bulletText}>{evaluation.goalAlignment.gaps}</Text>
            </>
          )}
        </View>

        {/* Behavioral Analysis */}
        {evaluation.behavioralAlignment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('behavioral_analysis')}</Text>
            <View style={styles.divider} />
            <Text style={styles.text}>
              <Text style={{ fontWeight: 'bold' }}>Score: </Text>
              {evaluation.behavioralAlignment.score}/10
            </Text>
            <Text style={styles.text}>{evaluation.behavioralAlignment.evidence}</Text>
            {evaluation.behavioralAlignment.blindspotEvidence.length > 0 && (
              <>
                <Text style={styles.text}>
                  <Text style={{ fontWeight: 'bold' }}>Blindspots: </Text>
                </Text>
                <BulletList items={evaluation.behavioralAlignment.blindspotEvidence} />
              </>
            )}
          </View>
        )}

        {/* Assumption Check */}
        {evaluation.assumptionCheck && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('assumption_check')}</Text>
            <View style={styles.divider} />
            {evaluation.assumptionCheck.confirmed.length > 0 && (
              <>
                <Text style={styles.text}>
                  <Text style={{ fontWeight: 'bold' }}>{t('confirmed')}:</Text>
                </Text>
                <BulletList items={evaluation.assumptionCheck.confirmed} />
              </>
            )}
            {evaluation.assumptionCheck.challenged.length > 0 && (
              <>
                <Text style={styles.text}>
                  <Text style={{ fontWeight: 'bold' }}>Challenged:</Text>
                </Text>
                <BulletList items={evaluation.assumptionCheck.challenged} />
              </>
            )}
            {evaluation.assumptionCheck.newInsights.length > 0 && (
              <>
                <Text style={styles.text}>
                  <Text style={{ fontWeight: 'bold' }}>New Insights:</Text>
                </Text>
                <BulletList items={evaluation.assumptionCheck.newInsights} />
              </>
            )}
          </View>
        )}

        {/* Calibration */}
        {evaluation.calibration && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('calibration')}</Text>
            <View style={styles.divider} />
            <Text style={styles.text}>
              {t('self_rating')}: {evaluation.calibration.selfRating}/10
            </Text>
            <Text style={styles.text}>
              Evidence: {evaluation.calibration.evidenceRating}/10
            </Text>
            <Text style={styles.text}>{evaluation.calibration.delta}</Text>
            <Text style={styles.text}>{evaluation.calibration.interpretation}</Text>
          </View>
        )}

        {/* Personality Insights */}
        {evaluation.personalityInsights && evaluation.personalityInsights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('personality_insights')}</Text>
            <View style={styles.divider} />
            {evaluation.personalityInsights.map((insight, i) => (
              <View key={i} style={{ marginBottom: 8 }}>
                <Text style={[styles.text, { fontWeight: 'bold', color: colors.primary }]}>
                  {insight.dimension}
                </Text>
                <Text style={styles.bulletText}>{insight.observation}</Text>
                <Text style={[styles.bulletText, { fontStyle: 'italic' }]}>
                  → {insight.recommendation}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Strengths */}
        {evaluation.strengths && evaluation.strengths.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('strengths')}</Text>
            <View style={styles.divider} />
            <BulletList items={evaluation.strengths} />
          </View>
        )}

        {/* Development Areas */}
        {evaluation.developmentAreas && evaluation.developmentAreas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('development')}</Text>
            <View style={styles.divider} />
            <BulletList items={evaluation.developmentAreas} />
          </View>
        )}

        {/* Next Steps */}
        {evaluation.nextSteps && evaluation.nextSteps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('next_steps')}</Text>
            <View style={styles.divider} />
            {evaluation.nextSteps.map((step, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <Text style={[styles.text, { fontWeight: 'bold' }]}>
                  {i + 1}. {step.action}
                </Text>
                <Text style={styles.bulletText}>{step.rationale}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>{t('footer')}</Text>
      </Page>
    </Document>
  );
};

// ============================================================================
// EXPORT FUNCTION
// ============================================================================

export const exportTranscriptEvaluationPDF = async (
  evaluation: TranscriptEvaluationResult,
  preAnswers: TranscriptPreAnswers,
  userEmail?: string,
  lang: 'de' | 'en' = 'de'
): Promise<void> => {
  const isNative = Capacitor.isNativePlatform();
  const fileName = `transcript_evaluation_${new Date().toISOString().split('T')[0]}.pdf`;

  try {
    const blob = await pdf(
      <TranscriptEvaluationPDF
        evaluation={evaluation}
        preAnswers={preAnswers}
        userEmail={userEmail}
        lang={lang}
      />
    ).toBlob();

    if (isNative) {
      // Native platform: Save and share
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache,
        });

        await Share.share({
          title: lang === 'de' ? 'Transkript-Auswertung' : 'Transcript Evaluation',
          text: lang === 'de' ? 'Meine Transkript-Auswertung' : 'My Transcript Evaluation',
          url: savedFile.uri,
          dialogTitle: lang === 'de' ? 'Auswertung teilen' : 'Share Evaluation',
        });
      };
      reader.readAsDataURL(blob);
    } else {
      // Web platform: Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('PDF export error:', error);
    throw error;
  }
};
