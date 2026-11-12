import React, { useCallback } from 'react';
import * as api from '../services/api';
import type { User } from '../types';
import type { UserIntent } from '../components/IntentPickerView';
import type { NavView } from '../types';
import {
    type HighlightSection,
    getHighlightSectionForIntent,
    getStoredUserIntent,
    isCoachPracticeIntent,
    normalizeUserIntent,
} from '../utils/userIntent';

interface UseAppRoutingParams {
    currentUser: User | null;
    lifeContext: string;
    completedLenses: string[];
    setView: React.Dispatch<React.SetStateAction<NavView>>;
    setHighlightSection: React.Dispatch<React.SetStateAction<HighlightSection>>;
    setPostOceanRoute: React.Dispatch<React.SetStateAction<'landing' | 'intent'>>;
    setHasPersonalityProfile: React.Dispatch<React.SetStateAction<boolean>>;
    setCompletedLenses: React.Dispatch<React.SetStateAction<string[]>>;
    routeToCoachPractice: () => void;
}

export function useAppRouting({
    currentUser,
    lifeContext,
    completedLenses,
    setView,
    setHighlightSection,
    setPostOceanRoute,
    setHasPersonalityProfile,
    setCompletedLenses,
    routeToCoachPractice,
}: UseAppRoutingParams) {
    const loadProfileInfo = useCallback(async () => {
        try {
            const profile = await api.loadPersonalityProfile();
            if (profile) {
                const lenses = profile.completedLenses ? JSON.parse(profile.completedLenses) : [];
                setHasPersonalityProfile(true);
                setCompletedLenses(lenses);
                return { exists: true, lenses };
            }
        } catch {}
        setHasPersonalityProfile(false);
        setCompletedLenses([]);
        return { exists: false, lenses: [] as string[] };
    }, [setHasPersonalityProfile, setCompletedLenses]);

    const routeToBotSelectionForIntent = useCallback(
        (intent: UserIntent | null) => {
            setHighlightSection(getHighlightSectionForIntent(intent));
            setView('botSelection');
        },
        [setHighlightSection, setView],
    );

    const applyIntentLogic = useCallback(
        (intent: UserIntent | null, options?: { lifeContextOverride?: string }) => {
            const lc = options?.lifeContextOverride ?? lifeContext;
            const i = normalizeUserIntent(intent) ?? getStoredUserIntent();
            switch (i) {
                case 'coachPractice':
                    routeToCoachPractice();
                    break;
                case 'communication':
                case 'coaching':
                    if (!currentUser) {
                        if (!lc?.trim()) {
                            setView('landing');
                        } else {
                            routeToBotSelectionForIntent(i);
                        }
                    } else {
                        routeToBotSelectionForIntent(i);
                    }
                    break;
                default:
                    if (!currentUser) {
                        setView(lc?.trim() ? 'botSelection' : 'landing');
                    } else {
                        setView(lc ? 'contextChoice' : 'landing');
                    }
                    break;
            }
        },
        [currentUser, lifeContext, routeToBotSelectionForIntent, routeToCoachPractice, setView],
    );

    const shouldShowProfileHint = useCallback((): boolean => {
        if (!currentUser?.isPremium) return false;
        if (localStorage.getItem('profileHintDisabled') === 'true') return false;
        const hasOcean = completedLenses.includes('ocean');
        const hasSD = completedLenses.includes('sd');
        const hasRiemann = completedLenses.includes('riemann');
        return hasOcean && (!hasSD || !hasRiemann);
    }, [currentUser?.isPremium, completedLenses]);

    const routeWithProfileHint = useCallback(
        (intent: UserIntent | null) => {
            const normalized = normalizeUserIntent(intent) ?? getStoredUserIntent();
            if (isCoachPracticeIntent(normalized)) {
                applyIntentLogic(intent);
                return;
            }
            if (shouldShowProfileHint()) {
                setView('profileHint');
            } else {
                applyIntentLogic(intent);
            }
        },
        [shouldShowProfileHint, applyIntentLogic, setView],
    );

    const routeWithIntentPicker = useCallback(
        async (hasContext: boolean) => {
            const { exists: profileExists } = await loadProfileInfo();
            if (!localStorage.getItem('intentPickerVersion')) {
                localStorage.removeItem('intentPickerDisabled');
                localStorage.setItem('intentPickerVersion', '1.9.7');
            }
            const pickerDisabled = localStorage.getItem('intentPickerDisabled') === 'true';
            const storedIntent = getStoredUserIntent();

            if (!pickerDisabled) {
                setView('intentPicker');
            } else if (isCoachPracticeIntent(storedIntent)) {
                routeToCoachPractice();
            } else if (!hasContext) {
                setView('namePrompt');
            } else if (!profileExists) {
                setPostOceanRoute('intent');
                setView('oceanOnboarding');
            } else {
                setView(hasContext ? 'contextChoice' : 'landing');
            }
        },
        [loadProfileInfo, setView, setPostOceanRoute, routeToBotSelectionForIntent, routeToCoachPractice],
    );

    return {
        loadProfileInfo,
        applyIntentLogic,
        routeWithIntentPicker,
        shouldShowProfileHint,
        routeWithProfileHint,
        routeToBotSelectionForIntent,
    };
}

export type { HighlightSection };
