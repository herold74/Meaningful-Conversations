// components/questionnaireStructure.ts

interface Field {
    id: string;
    label: string;
    prompt: string;
}

interface SubSection {
    title: string;
    level: 3;
    fields: Field[];
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

export const questionnaireStructure: Section[] = [
    {
        title: 'Background',
        level: 2,
        fields: [
            { id: 'background_work', label: 'Work', prompt: 'e.g., current role, responsibilities, career satisfaction.' },
            { id: 'background_family', label: 'Family', prompt: 'e.g., relationships, home life.' },
            { id: 'background_social', label: 'Social Engagements', prompt: 'e.g., friends, hobbies, community involvement.' },
            { id: 'background_health', label: 'Health', prompt: 'e.g., physical and mental well-being.' },
            { id: 'background_sentiment', label: 'General Sentiment', prompt: 'e.g., overall mood, outlook on life.' },
        ]
    },
    {
        title: 'My Top Goals',
        level: 2,
        subSections: [
            {
                title: 'This year (2025)',
                level: 3,
                fields: [
                    { id: 'goals_2025_career', label: 'Career', prompt: 'What specific career advancements are you aiming for?' },
                    { id: 'goals_2025_personal', label: 'Personal', prompt: 'What skills or habits do you want to develop?' },
                    { id: 'goals_2025_financial', label: 'Financial', prompt: 'What are your financial targets for the year?' },
                ]
            },
            {
                title: 'Long-term',
                level: 3,
                fields: [
                    { id: 'goals_longterm_big5', label: '"Big 5 for life"', prompt: 'What are the 5 biggest things you want to do, see, or experience in your life?' },
                ]
            }
        ],
        collapsedByDefault: true,
        collapseText: 'recommended',
    },
    {
        title: 'My Routines',
        level: 2,
        description: 'Habits you learned, and implemented to structure your day and engagements.',
        fields: [
            { id: 'routines_focus', label: 'Focus Blocks', prompt: 'How do you schedule deep work or focused time?' },
            { id: 'routines_learning', label: 'Learning System', prompt: 'How do you incorporate learning into your life?' },
            { id: 'routines_p_tm', label: 'Project-, Time Management', prompt: 'What systems do you use to manage your tasks and projects?' },
            { id: 'routines_health', label: 'Health Routine', prompt: 'What are your regular health and wellness practices?' },
            { id: 'routines_growth', label: 'Personal Growth', prompt: 'What activities do you do for personal growth (e.g., journaling, meditation)?' },
        ],
        collapsedByDefault: true,
        collapseText: 'optional',
    },
    {
        title: 'Current Challenges I\'m Thinking About',
        level: 2,
        fields: [
            { id: 'challenges_career', label: 'Career Direction', prompt: 'What questions or uncertainties do you have about your career path?' },
            { id: 'challenges_wlb', label: 'Work-Life Integration', prompt: 'Are you struggling to balance work and your personal life?' },
            { id: 'challenges_social', label: 'Social Engagements', prompt: 'What challenges are you facing in your social life?' },
            { id: 'challenges_growth', label: 'Personal Development', prompt: 'What is holding you back in your personal development?' },
        ],
        collapsedByDefault: true,
        collapseText: 'optional',
    }
];

export const getAllFieldIds = (): string[] => {
    const ids: string[] = [];
    questionnaireStructure.forEach(section => {
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