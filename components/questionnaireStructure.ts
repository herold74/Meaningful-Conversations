// components/questionnaireStructure.ts

interface Field {
    id: string;
    label?: string;
    prompt: string;
    rows?: number;
    type?: 'list' | 'text';
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
}

export const getQuestionnaireStructure = (t: (key: string, replacements?: Record<string, string | number>) => string): Section[] => [
    {
        title: t('q_section_profile_title'),
        level: 2,
        description: t('q_section_profile_desc'),
        fields: [
            { id: 'profile_name', label: t('q_field_name_label'), prompt: t('q_field_name_prompt'), rows: 1 },
            { id: 'profile_values', label: t('q_field_values_label'), prompt: t('q_field_values_prompt') },
            { id: 'profile_sentiment', label: t('q_field_sentiment_label'), prompt: t('q_field_sentiment_prompt') },
        ]
    },
    {
        title: t('q_section_domains_title'),
        level: 2,
        description: t('q_section_domains_desc'),
        subSections: [
            {
                title: t('q_domain_career_title'),
                level: 3,
                fields: [
                    { id: 'career_situation', label: t('q_field_situation_label'), prompt: t('q_field_career_situation_prompt'), rows: 4 },
                    { id: 'career_routines', label: t('q_field_routines_label'), prompt: t('q_field_career_routines_prompt'), rows: 4, type: 'list' },
                    { id: 'career_goals', label: t('q_field_goals_label'), prompt: t('q_field_career_goals_prompt'), rows: 4, type: 'list' },
                    { id: 'career_challenges', label: t('q_field_challenges_label'), prompt: t('q_field_career_challenges_prompt'), rows: 4, type: 'list' }
                ]
            },
            {
                title: t('q_domain_growth_title'),
                level: 3,
                fields: [
                    { id: 'growth_situation', label: t('q_field_situation_label'), prompt: t('q_field_growth_situation_prompt'), rows: 4 },
                    { id: 'growth_routines', label: t('q_field_routines_label'), prompt: t('q_field_growth_routines_prompt'), rows: 4, type: 'list' },
                    { id: 'growth_goals', label: t('q_field_goals_label'), prompt: t('q_field_growth_goals_prompt'), rows: 4, type: 'list' },
                    { id: 'growth_challenges', label: t('q_field_challenges_label'), prompt: t('q_field_growth_challenges_prompt'), rows: 4, type: 'list' }
                ]
            },
            {
                title: t('q_domain_relationships_title'),
                level: 3,
                fields: [
                    { id: 'relationships_situation', label: t('q_field_situation_label'), prompt: t('q_field_relationships_situation_prompt'), rows: 4 },
                    { id: 'relationships_routines', label: t('q_field_routines_label'), prompt: t('q_field_relationships_routines_prompt'), rows: 4, type: 'list' },
                    { id: 'relationships_goals', label: t('q_field_goals_label'), prompt: t('q_field_relationships_goals_prompt'), rows: 4, type: 'list' },
                    { id: 'relationships_challenges', label: t('q_field_challenges_label'), prompt: t('q_field_relationships_challenges_prompt'), rows: 4, type: 'list' }
                ]
            },
            {
                title: t('q_domain_health_title'),
                level: 3,
                fields: [
                    { id: 'health_situation', label: t('q_field_situation_label'), prompt: t('q_field_health_situation_prompt'), rows: 4 },
                    { id: 'health_routines', label: t('q_field_routines_label'), prompt: t('q_field_health_routines_prompt'), rows: 4, type: 'list' },
                    { id: 'health_goals', label: t('q_field_goals_label'), prompt: t('q_field_health_goals_prompt'), rows: 4, type: 'list' },
                    { id: 'health_challenges', label: t('q_field_challenges_label'), prompt: t('q_field_health_challenges_prompt'), rows: 4, type: 'list' }
                ]
            }
        ]
    },
    {
        title: t('q_section_nextsteps_title'),
        level: 2,
        description: t('q_section_nextsteps_desc'),
        fields: [
            { id: 'next_steps', prompt: t('q_field_nextsteps_prompt_list'), rows: 4, type: 'list' },
        ]
    }
];