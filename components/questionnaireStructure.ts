// components/questionnaireStructure.ts

interface Field {
    id: string;
    label?: string;
    prompt: string;
    rows?: number;
}

interface SubSection {
    title: string;
    level: 3;
    fields: Field[];
    description?: string;
}

interface Section {
    title: string;
    level: 2;
    description?: string;
    fields?: Field[];
    subSections?: SubSection[];
    collapsedByDefault?: boolean;
    collapseText?: string;
}

export const getQuestionnaireStructure = (t: (key: string) => string): Section[] => [
    {
        title: t('questionnaire_background_title'),
        level: 2,
        description: t('questionnaire_background_desc'),
        fields: [
            { id: 'background_name', label: t('questionnaire_background_name_label'), prompt: t('questionnaire_background_name_prompt'), rows: 1 },
            { id: 'background_work', label: t('questionnaire_background_work_label'), prompt: t('questionnaire_background_work_prompt') },
            { id: 'background_family', label: t('questionnaire_background_family_label'), prompt: t('questionnaire_background_family_prompt') },
            { id: 'background_social', label: t('questionnaire_background_social_label'), prompt: t('questionnaire_background_social_prompt') },
            { id: 'background_health', label: t('questionnaire_background_health_label'), prompt: t('questionnaire_background_health_prompt') },
            { id: 'background_sentiment', label: t('questionnaire_background_sentiment_label'), prompt: t('questionnaire_background_sentiment_prompt') },
        ]
    },
    {
        title: t('questionnaire_goals_title'),
        level: 2,
        description: t('questionnaire_goals_desc'),
        subSections: [
            {
                title: t('questionnaire_goals_midterm_title'),
                level: 3,
                fields: [
                    { id: 'goals_midterm_career', label: t('questionnaire_goals_midterm_career_label'), prompt: t('questionnaire_goals_midterm_career_prompt') },
                    { id: 'goals_midterm_personal', label: t('questionnaire_goals_midterm_personal_label'), prompt: t('questionnaire_goals_midterm_personal_prompt') },
                    { id: 'goals_midterm_financial', label: t('questionnaire_goals_midterm_financial_label'), prompt: t('questionnaire_goals_midterm_financial_prompt') },
                ]
            },
            {
                title: t('questionnaire_goals_longterm_title'),
                level: 3,
                description: t('questionnaire_goals_longterm_desc'),
                fields: [
                    { id: 'goals_longterm_big5', label: t('questionnaire_goals_longterm_big5_label'), prompt: t('questionnaire_goals_longterm_big5_prompt') },
                ]
            }
        ],
        collapsedByDefault: true,
        collapseText: t('questionnaire_goals_collapseText'),
    },
    {
        title: t('questionnaire_routines_title'),
        level: 2,
        description: t('questionnaire_routines_desc'),
        fields: [
            { id: 'routines_p_tm', label: t('questionnaire_routines_ptm_label'), prompt: t('questionnaire_routines_ptm_prompt') },
            { id: 'routines_learning', label: t('questionnaire_routines_learning_label'), prompt: t('questionnaire_routines_learning_prompt') },
            { id: 'routines_health', label: t('questionnaire_routines_health_label'), prompt: t('questionnaire_routines_health_prompt') },
            { id: 'routines_growth', label: t('questionnaire_routines_growth_label'), prompt: t('questionnaire_routines_growth_prompt') },
        ],
        collapsedByDefault: true,
        collapseText: t('questionnaire_routines_collapseText'),
    },
    {
        title: t('questionnaire_challenges_title'),
        level: 2,
        description: t('questionnaire_challenges_desc'),
        fields: [
            { id: 'challenges_career', label: t('questionnaire_challenges_career_label'), prompt: t('questionnaire_challenges_career_prompt') },
            { id: 'challenges_wlb', label: t('questionnaire_challenges_wlb_label'), prompt: t('questionnaire_challenges_wlb_prompt') },
            { id: 'challenges_social', label: t('questionnaire_challenges_social_label'), prompt: t('questionnaire_challenges_social_prompt') },
            { id: 'challenges_growth', label: t('questionnaire_challenges_growth_label'), prompt: t('questionnaire_challenges_growth_prompt') },
            { id: 'challenges_habits', label: t('questionnaire_challenges_habits_label'), prompt: t('questionnaire_challenges_habits_prompt') },
        ],
        collapsedByDefault: true,
        collapseText: t('questionnaire_challenges_collapseText'),
    },
    {
        title: t('questionnaire_next_steps_title'),
        level: 2,
        description: t('questionnaire_next_steps_desc'),
        fields: [
            { id: 'next_steps_commitments', prompt: t('questionnaire_next_steps_prompt'), rows: 4 },
        ]
    }
];

export const getAllFieldIds = (t: (key: string) => string): string[] => {
    const ids: string[] = [];
    getQuestionnaireStructure(t).forEach(section => {
        if (section.fields) {
            section.fields.forEach(field => ids.push(field.id));
        }
        if (section.subSections) {
            section.subSections.forEach(subSection => {
                subSection.fields.forEach(field => ids.push(field.id));
            });
        }
    });
    return ids;
}