import React, { useCallback } from 'react';
import * as api from '../services/api';
import type { User } from '../types';
import type { UserIntent } from '../components/IntentPickerView';
import type { NavView } from '../types';

interface UseAppRoutingParams {
    currentUser: User | null;
    lifeContext: string;
    completedLenses: string[];
    setView: React.Dispatch<React.SetStateAction<NavView>>;
    setHighlightSection: React.Dispatch<React.SetStateAction<'management' | 'topicSearch' | null>>;
    setPostOceanRoute: React.Dispatch<React.SetStateAction<'landing' | 'intent'>>;
    setHasPersonalityProfile: React.Dispatch<React.SetStateAction<boolean>>;
    setCompletedLenses: React.Dispatch<React.SetStateAction<string[]>>;
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

    const applyIntentLogic = useCallback(
        (intent: UserIntent | null) => {
            const i = intent || (localStorage.getItem('userIntent') as UserIntent | null);
            switch (i) {
                case 'communication':
                    setHighlightSection('management');
                    setView('botSelection');
                    break;
                case 'lifecoaching':
                    setHighlightSection('topicSearch');
                    setView('botSelection');
                    break;
                case 'coaching':
                    setHighlightSection('topicSearch');
                    setView('botSelection');
                    break;
                default:
                    setView(lifeContext ? 'contextChoice' : 'landing');
                    break;
            }
        },
        [lifeContext, setHighlightSection, setView]
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
            if (shouldShowProfileHint()) {
                setView('profileHint');
            } else {
                applyIntentLogic(intent);
            }
        },
        [shouldShowProfileHint, applyIntentLogic, setView]
    );

    const routeWithIntentPicker = useCallback(
        async (hasContext: boolean) => {
            const { exists: profileExists, lenses } = await loadProfileInfo();
            if (!localStorage.getItem('intentPickerVersion')) {
                localStorage.removeItem('intentPickerDisabled');
                localStorage.setItem('intentPickerVersion', '1.9.7');
            }
            const pickerDisabled = localStorage.getItem('intentPickerDisabled') === 'true';
            if (!pickerDisabled) {
                setView('intentPicker');
            } else if (!hasContext) {
                setView('namePrompt');
            } else if (!profileExists) {
                setPostOceanRoute('intent');
                setView('oceanOnboarding');
            } else {
                setView(hasContext ? 'contextChoice' : 'landing');
            }
        },
        [loadProfileInfo, setView, setPostOceanRoute]
    );

    return {
        loadProfileInfo,
        applyIntentLogic,
        routeWithIntentPicker,
        shouldShowProfileHint,
        routeWithProfileHint,
    };
}
