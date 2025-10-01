import React, { useState } from 'react';
import { getQuestionnaireStructure } from './questionnaireStructure';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { useLocalization } from '../context/LocalizationContext';

const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

interface QuestionnaireProps {
    onSubmit: (context: string) => void;
    onBack: () => void;
    answers: Record<string, string>;
    onAnswersChange: (answers: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
}

const Questionnaire: React.FC<QuestionnaireProps> = ({ onSubmit, onBack, answers, onAnswersChange }) => {
    const { t } = useLocalization();
    const questionnaireStructure = getQuestionnaireStructure(t);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    const handleChange = (id: string, value: string) => {
        onAnswersChange(prev => ({ ...prev, [id]: value }));
    };

    const toggleSection = (title: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(title)) {
                newSet.delete(title);
            } else {
                newSet.add(title);
            }
            return newSet;
        });
    };

    const generateMarkdown = (): string => {
        let md = `# ${t('questionnaire_main_title')}\n\n`;

        questionnaireStructure.forEach((section, index) => {
            md += `## ${section.title}\n`;
            if (section.description) {
                md += `*${section.description}*\n\n`;
            } else {
                md += '\n';
            }

            if (section.fields) {
                section.fields.forEach(field => {
                    const answer = answers[field.id]?.trim() || '';
                    md += `**${field.label}**: ${answer}\n\n`;
                });
            }

            if (section.subSections) {
                section.subSections.forEach(subSection => {
                    md += `### ${subSection.title}\n`;
                    if (subSection.description) {
                        md += `*${subSection.description}*\n\n`;
                    } else {
                        md += '\n';
                    }
                    subSection.fields.forEach(field => {
                        const answer = answers[field.id]?.trim() || '';
                        md += `**${field.label}**: ${answer}\n\n`;
                    });
                });
            }

            // Add a separator line if it's not the last main section
            if (index < questionnaireStructure.length - 1) {
                md += '\n---\n\n';
            }
        });

        return (md.replace(/\n{3,}/g, '\n\n').trim() + '\n');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const markdownContent = generateMarkdown();
        onSubmit(markdownContent);
    };

    return (
        <div className="relative w-full max-w-3xl mx-auto p-8 space-y-8 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 my-10 animate-fadeIn">
            <button onClick={onBack} className="absolute left-4 top-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ArrowLeftIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
            <div className="text-center mb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('questionnaire_title')}</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{t('questionnaire_subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {questionnaireStructure.map((section, sIndex) => {

                    if (section.collapsedByDefault) {
                        const isExpanded = expandedSections.has(section.title);
                        return (
                            <div key={sIndex} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection(section.title)}
                                    className="w-full p-4 flex justify-between items-center text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    aria-expanded={isExpanded}
                                    aria-controls={`section-content-${sIndex}`}
                                >
                                    <div>
                                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-300">{section.title}</h2>
                                        {!isExpanded && section.collapseText && <p className="text-gray-500 dark:text-gray-400 italic mt-1 text-sm">{t('questionnaire_collapsible_prompt', { type: section.collapseText })}</p>}
                                    </div>
                                    <ChevronDownIcon className={`w-6 h-6 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                                {isExpanded && (
                                    <div id={`section-content-${sIndex}`} className="p-4 pt-0 space-y-4 animate-fadeIn">
                                        <div className="border-t border-gray-200 dark:border-gray-600 mt-4 pt-4 space-y-4">
                                            {section.description && <p className="text-gray-600 dark:text-gray-400 italic">{section.description}</p>}
                                            {section.fields?.map(field => (
                                                <div key={field.id}>
                                                    <label htmlFor={field.id} className="block text-lg font-medium text-gray-700 dark:text-gray-300">{field.label}</label>
                                                    <textarea
                                                        id={field.id}
                                                        rows={3}
                                                        value={answers[field.id] || ''}
                                                        onChange={e => handleChange(field.id, e.target.value)}
                                                        placeholder={field.prompt}
                                                        className="mt-2 w-full p-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 dark:focus:ring-green-400"
                                                    />
                                                </div>
                                            ))}
                                             {section.subSections?.map((subSection, ssIndex) => (
                                                <div key={ssIndex} className="ml-4 space-y-4 pt-4">
                                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-300">{subSection.title}</h3>
                                                    {subSection.description && <p className="text-gray-600 dark:text-gray-400 italic">{subSection.description}</p>}
                                                    {subSection.fields.map(field => (
                                                        <div key={field.id}>
                                                            <label htmlFor={field.id} className="block text-lg font-medium text-gray-700 dark:text-gray-300">{field.label}</label>
                                                            <textarea
                                                                id={field.id}
                                                                rows={3}
                                                                value={answers[field.id] || ''}
                                                                onChange={e => handleChange(field.id, e.target.value)}
                                                                placeholder={field.prompt}
                                                                className="mt-2 w-full p-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 dark:focus:ring-green-400"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    }


                    return (
                        <div key={sIndex} className="space-y-4">
                            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">{section.title}</h2>
                            {section.description && <p className="text-gray-600 dark:text-gray-400 italic">{section.description}</p>}
                            
                            {section.fields?.map(field => (
                                <div key={field.id}>
                                    <label htmlFor={field.id} className="block text-lg font-medium text-gray-700 dark:text-gray-300">{field.label}</label>
                                    <textarea
                                        id={field.id}
                                        rows={3}
                                        value={answers[field.id] || ''}
                                        onChange={e => handleChange(field.id, e.target.value)}
                                        placeholder={field.prompt}
                                        className="mt-2 w-full p-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 dark:focus:ring-green-400"
                                    />
                                </div>
                            ))}

                            {section.subSections?.map((subSection, ssIndex) => (
                                <div key={ssIndex} className="ml-4 space-y-4">
                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-300">{subSection.title}</h3>
                                    {subSection.description && <p className="text-gray-600 dark:text-gray-400 italic">{subSection.description}</p>}
                                    {subSection.fields.map(field => (
                                        <div key={field.id}>
                                            <label htmlFor={field.id} className="block text-lg font-medium text-gray-700 dark:text-gray-300">{field.label}</label>
                                            <textarea
                                                id={field.id}
                                                rows={3}
                                                value={answers[field.id] || ''}
                                                onChange={e => handleChange(field.id, e.target.value)}
                                                placeholder={field.prompt}
                                                className="mt-2 w-full p-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 dark:focus:ring-green-400"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    );
                })}
                
                <button
                    type="submit"
                    className="w-full mt-8 px-6 py-3 text-base font-bold text-black bg-green-400 uppercase hover:bg-green-500 disabled:bg-gray-800 focus:outline-none transition-colors duration-200"
                >
                    {t('questionnaire_generateFile')}
                </button>
            </form>
        </div>
    );
};

export default Questionnaire;