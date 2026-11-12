import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  CirclePlay,
  FileText,
  Lightbulb,
  MessageCircle,
  Mic,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLocalization } from '../context/LocalizationContext';
import type { User } from '../types';
import {
  isTutorialHubItemVisible,
  resolveTutorialHubVisibilityContext,
  type TutorialHubItemId,
} from '../utils/tutorialHubVisibility';
import {
  getKommunikationTutorialTilePosition,
  setKommunikationTutorialTilePosition,
  type KommunikationTutorialTilePosition,
} from '../utils/kommunikationTutorialTilePrefs';
import {
  tutorialHandbookAnchorKey,
  userGuideAnchorId,
  type UserGuideAnchorKey,
} from '../utils/userGuideAnchors';

export type TutorialTryAction =
  | 'lifeContext'
  | 'transcriptEval'
  | 'connector'
  | 'practiceSetup';

type TutorialItemDef = {
  id: string;
  Icon: LucideIcon;
  titleKey: string;
  descKey: string;
  durationKey: string;
  handbookHintKey: string;
  handbookAnchor: UserGuideAnchorKey;
  tryAction?: TutorialTryAction;
};

const TUTORIAL_ITEMS: TutorialItemDef[] = [
  {
    id: 'life_context',
    Icon: FileText,
    titleKey: 'tutorialHub_item_life_context_title',
    descKey: 'tutorialHub_item_life_context_desc',
    durationKey: 'tutorialHub_duration_short',
    handbookHintKey: 'tutorialHub_handbook_ch1',
    handbookAnchor: 'ch1',
    tryAction: 'lifeContext',
  },
  {
    id: 'voice_text',
    Icon: Mic,
    titleKey: 'tutorialHub_item_voice_title',
    descKey: 'tutorialHub_item_voice_desc',
    durationKey: 'tutorialHub_duration_short',
    handbookHintKey: 'tutorialHub_handbook_voice_chat',
    handbookAnchor: 'chatInterface',
  },
  {
    id: 'session_review',
    Icon: Sparkles,
    titleKey: 'tutorialHub_item_session_review_title',
    descKey: 'tutorialHub_item_session_review_desc',
    durationKey: 'tutorialHub_duration_medium',
    handbookHintKey: 'tutorialHub_handbook_session_review',
    handbookAnchor: 'sessionReview',
  },
  {
    id: 'transcript',
    Icon: MessageCircle,
    titleKey: 'tutorialHub_item_transcript_title',
    descKey: 'tutorialHub_item_transcript_desc',
    durationKey: 'tutorialHub_duration_medium',
    handbookHintKey: 'tutorialHub_handbook_transcript',
    handbookAnchor: 'transcriptEval',
    tryAction: 'transcriptEval',
  },
  {
    id: 'connector',
    Icon: Users,
    titleKey: 'tutorialHub_item_connector_title',
    descKey: 'tutorialHub_item_connector_desc',
    durationKey: 'tutorialHub_duration_medium',
    handbookHintKey: 'tutorialHub_handbook_connector',
    handbookAnchor: 'connector',
    tryAction: 'connector',
  },
  {
    id: 'coach_practice',
    Icon: Target,
    titleKey: 'tutorialHub_item_practice_title',
    descKey: 'tutorialHub_item_practice_desc',
    durationKey: 'tutorialHub_duration_long',
    handbookHintKey: 'tutorialHub_handbook_practice',
    handbookAnchor: 'coachPractice',
    tryAction: 'practiceSetup',
  },
  {
    id: 'pep',
    Icon: Lightbulb,
    titleKey: 'tutorialHub_item_pep_title',
    descKey: 'tutorialHub_item_pep_desc',
    durationKey: 'tutorialHub_duration_short',
    handbookHintKey: 'tutorialHub_handbook_pep',
    handbookAnchor: 'pep',
  },
];

const CATEGORY_ORDER = ['basics', 'kommunikation', 'coaching'] as const;
type CategoryId = (typeof CATEGORY_ORDER)[number];

const ITEM_CATEGORY: Record<string, CategoryId> = {
  life_context: 'basics',
  voice_text: 'basics',
  session_review: 'basics',
  transcript: 'kommunikation',
  connector: 'kommunikation',
  coach_practice: 'coaching',
  pep: 'coaching',
};

export interface TutorialHubViewProps {
  currentUser: User | null;
  onBack: () => void;
  onOpenHandbook: (anchorId: string) => void;
  onTry: (action: TutorialTryAction) => void;
}

const TutorialHubView: React.FC<TutorialHubViewProps> = ({
  currentUser,
  onBack,
  onOpenHandbook,
  onTry,
}) => {
  const { t } = useLocalization();
  const [tilePosition, setTilePosition] = useState<KommunikationTutorialTilePosition>(
    () => getKommunikationTutorialTilePosition(),
  );

  const visibilityCtx = useMemo(
    () => resolveTutorialHubVisibilityContext(currentUser),
    [currentUser],
  );
  const showTranscriptEvalChapter = !!(
    currentUser?.isPremium ||
    currentUser?.isClient ||
    currentUser?.isAdmin ||
    currentUser?.isDeveloper
  );

  const visibleItems = TUTORIAL_ITEMS.filter((item) =>
    isTutorialHubItemVisible(item.id as TutorialHubItemId, visibilityCtx),
  );

  const handleTilePositionChange = (next: KommunikationTutorialTilePosition) => {
    setTilePosition(next);
    setKommunikationTutorialTilePosition(next);
  };

  const categoryLabel = (id: CategoryId) => {
    switch (id) {
      case 'basics':
        return t('tutorialHub_cat_basics');
      case 'kommunikation':
        return t('tutorialHub_cat_kommunikation');
      case 'coaching':
        return t('tutorialHub_cat_coaching');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-8 space-y-6 bg-background-secondary border border-border-primary rounded-card shadow-card-elevated mt-4 mb-10">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-content-secondary hover:text-content-primary self-start -mt-1 mb-1"
      >
        ← {t('practice_back')}
      </button>

      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-section-bronze/15 ring-1 ring-section-bronze/25 text-section-bronze mx-auto">
          <BookOpen className="w-6 h-6" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold text-content-primary tracking-tight">
          {t('tutorialHub_title')}
        </h1>
        <p className="text-sm text-content-secondary leading-relaxed max-w-xl mx-auto">
          {t('tutorialHub_subtitle')}
        </p>
      </div>

      <div className="rounded-card border border-border-primary bg-background-primary/40 p-4 space-y-3">
        <p className="text-sm font-medium text-content-primary">{t('tutorialHub_tile_position_label')}</p>
        <p className="text-xs text-content-secondary leading-relaxed">{t('tutorialHub_tile_position_hint')}</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => handleTilePositionChange('first')}
            className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
              tilePosition === 'first'
                ? 'border-section-bronze bg-section-bronze/15 text-section-bronze'
                : 'border-border-primary text-content-secondary hover:border-section-bronze/40'
            }`}
          >
            {t('tutorialHub_tile_position_first')}
          </button>
          <button
            type="button"
            onClick={() => handleTilePositionChange('last')}
            className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
              tilePosition === 'last'
                ? 'border-section-bronze bg-section-bronze/15 text-section-bronze'
                : 'border-border-primary text-content-secondary hover:border-section-bronze/40'
            }`}
          >
            {t('tutorialHub_tile_position_last')}
          </button>
        </div>
      </div>

      {CATEGORY_ORDER.map((catId) => {
        const items = visibleItems.filter((item) => ITEM_CATEGORY[item.id] === catId);
        if (items.length === 0) return null;
        return (
          <section key={catId} className="space-y-3">
            <h2 className="text-base font-semibold text-section-bronze px-1">{categoryLabel(catId)}</h2>
            <ul className="space-y-3">
              {items.map((item) => {
                const Icon = item.Icon;
                return (
                  <li
                    key={item.id}
                    className="rounded-card border border-border-primary bg-background-primary/30 p-4 space-y-3"
                  >
                    <div className="flex gap-3">
                      <div className="shrink-0 w-10 h-10 rounded-xl bg-section-bronze/10 flex items-center justify-center text-section-bronze">
                        <Icon className="w-5 h-5" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[15px] font-semibold text-content-primary">{t(item.titleKey)}</h3>
                          <span className="text-[0.6875rem] font-medium uppercase tracking-wide text-content-subtle">
                            {t(item.durationKey)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[0.6875rem] font-medium text-content-subtle rounded-full border border-border-primary px-2 py-0.5">
                            <CirclePlay className="w-3 h-3" aria-hidden />
                            {t('tutorialHub_video_soon')}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm text-content-secondary leading-relaxed">{t(item.descKey)}</p>
                        <p className="mt-2 text-xs text-content-subtle">{t(item.handbookHintKey)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenHandbook(
                            userGuideAnchorId(
                              tutorialHandbookAnchorKey(item.id, item.handbookAnchor, {
                                showTranscriptEvalChapter,
                                showTranscriptToolsSection: showTranscriptEvalChapter,
                              }),
                            ),
                          )
                        }
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold border border-border-primary bg-background-primary hover:border-section-bronze/50 text-content-primary transition-colors"
                      >
                        <BookOpen className="w-4 h-4 shrink-0" aria-hidden />
                        {t('tutorialHub_open_handbook')}
                      </button>
                      {item.tryAction && (
                        <button
                          type="button"
                          onClick={() => onTry(item.tryAction!)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold border border-section-bronze bg-section-bronze/10 text-section-bronze hover:bg-section-bronze hover:text-button-foreground-on-accent transition-colors"
                        >
                          {t('tutorialHub_try_now')}
                          <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <p className="text-xs text-content-subtle text-center leading-relaxed px-2">
        {t('tutorialHub_footer')}
      </p>
    </div>
  );
};

export default TutorialHubView;
