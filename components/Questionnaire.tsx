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
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (id: string, value: string) => {
        onAnswersChange(prev => ({ ...prev, [id]: value }));
        if (id === 'background_name' && value.trim()) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors['background_name'];
                return newErrors;
            });
        }
    };

    const toggleSection = (sectionTitle: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionTitle)) {
                newSet.delete(sectionTitle);
            } else {
                newSet.add(sectionTitle);
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
                    // Only include the label in markdown if it's not empty
                    if (field.label) {
                        md += `**${field.label}**: ${answer}\n\n`;
                    } else {
                        md += `${answer}\n\n`;
                    }
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
                         if (field.label) {
                            md += `**${field.label}**: ${answer}\n\n`;
                        } else {
                            md += `${answer}\n\n`;
                        }
                    });
                });
            }

            if (index < questionnaireStructure.length - 1) {
                md += '\n---\n\n';
            }
        });

        return (md.replace(/\n{3,}/g, '\n\n').trim() + '\n');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!answers['background_name']?.trim()) {
            setErrors({ 'background_name': t('questionnaire_error_name_required') });
            return;
        }
        const markdownContent = generateMarkdown();
        onSubmit(markdownContent);
    };

    return (
        <div className="relative w-full max-w-3xl mx-auto p-8 space-y-8 bg-background-secondary dark:bg-transparent border border-border-secondary dark:border-border-primary my-10 animate-fadeIn rounded-lg shadow-lg">
            <button onClick={onBack} className="absolute left-4 top-4 p-2 rounded-full bg-background-tertiary dark:bg-background-tertiary hover:bg-border-primary dark:hover:bg-border-primary transition-colors">
                <ArrowLeftIcon className="w-6 h-6 text-content-secondary" />
            </button>
            <div className="text-center mb-4">
                <h1 className="text-3xl font-bold text-content-primary uppercase">{t('questionnaire_title')}</h1>
                <p className="mt-2 text-content-secondary">{t('questionnaire_subtitle')}</p>
                <p className="mt-1 text-sm text-content-subtle">{t('questionnaire_required_fields')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {questionnaireStructure.map((section, sIndex) => {

                    if (section.collapsedByDefault) {
                        const isExpanded = expandedSections.has(section.title);
                        return (
                            <div key={sIndex} className="bg-background-primary dark:bg-background-tertiary/50 border border-border-primary dark:border-border-primary rounded-lg overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection(section.title)}
                                    className="w-full p-4 flex justify-between items-center text-left hover:bg-background-tertiary dark:hover:bg-background-tertiary transition-colors"
                                    aria-expanded={isExpanded}
                                    aria-controls={`section-content-${sIndex}`}
                                >
                                    <div>
                                        <h2 className="text-2xl font-semibold text-content-primary">{section.title}</h2>
                                        {!isExpanded && section.collapseText && <p className="text-content-subtle italic mt-1 text-sm">{t('questionnaire_collapsible_prompt', { type: section.collapseText })}</p>}
                                    </div>
                                    <ChevronDownIcon className={`w-6 h-6 text-content-subtle transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                                {isExpanded && (
                                    <div id={`section-content-${sIndex}`} className="p-4 pt-0 space-y-4 animate-fadeIn">
                                        <div className="border-t border-border-primary dark:border-border-secondary mt-4 pt-4 space-y-4">
                                            {section.description && <p className="text-content-secondary italic">{section.description}</p>}
                                            {section.fields?.map(field => (
                                                <div key={field.id}>
                                                    {field.label && <label htmlFor={field.id} className="block text-lg font-medium text-content-secondary">{field.label}</label>}
                                                    <textarea
                                                        id={field.id}
                                                        rows={field.rows || 3}
                                                        value={answers[field.id] || ''}
                                                        onChange={e => handleChange(field.id, e.target.value)}
                                                        placeholder={field.prompt}
                                                        className={`${field.label ? 'mt-2' : ''} w-full p-3 bg-background-secondary dark:bg-background-primary text-content-primary border border-border-secondary dark:border-border-secondary focus:outline-none focus:ring-1 focus:ring-accent-primary`}
                                                    />
                                                </div>
                                            ))}
                                             {section.subSections?.map((subSection, ssIndex) => (
                                                <div key={ssIndex} className="ml-4 space-y-4 pt-4">
                                                    <h3 className="text-xl font-semibold text-content-primary">{subSection.title}</h3>
                                                    {subSection.description && <p className="text-content-secondary italic">{subSection.description}</p>}
                                                    {subSection.fields.map(field => (
                                                        <div key={field.id}>
                                                            {field.label && <label htmlFor={field.id} className="block text-lg font-medium text-content-secondary">{field.label}</label>}
                                                            <textarea
                                                                id={field.id}
                                                                rows={field.rows || 3}
                                                                value={answers[field.id] || ''}
                                                                onChange={e => handleChange(field.id, e.target.value)}
                                                                placeholder={field.prompt}
                                                                className={`${field.label ? 'mt-2' : ''} w-full p-3 bg-background-secondary dark:bg-background-primary text-content-primary border border-border-secondary dark:border-border-secondary focus:outline-none focus:ring-1 focus:ring-accent-primary`}
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
                            <h2 className="text-2xl font-semibold text-content-primary border-b border-border-primary dark:border-border-primary pb-2">{section.title}</h2>
                            {section.description && <p className="text-content-secondary italic">{section.description}</p>}
                            
                            {section.fields?.map(field => {
                                if (field.id === 'background_name') {
                                    return (
                                        <div key={field.id}>
                                            <div className="flex items-center gap-4">
                                                <label htmlFor={field.id} className="text-lg font-medium text-content-secondary shrink-0">
                                                    {field.label} <span className="text-status-danger-foreground">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    id={field.id}
                                                    value={answers[field.id] || ''}
                                                    onChange={e => handleChange(field.id, e.target.value)}
                                                    placeholder={field.prompt}
                                                    className={`w-full p-3 bg-background-secondary dark:bg-background-primary text-content-primary border ${errors['background_name'] ? 'border-status-danger-border' : 'border-border-secondary dark:border-border-secondary'} focus:outline-none focus:ring-1 focus:ring-accent-primary`}
                                                    aria-required="true"
                                                    aria-invalid={!!errors['background_name']}
                                                    aria-describedby={errors['background_name'] ? 'name-error' : undefined}
                                                />
                                            </div>
                                            {errors['background_name'] && <p id="name-error" className="text-status-danger-foreground text-sm mt-1 text-right">{errors['background_name']}</p>}
                                        </div>
                                    );
                                }
                                return (
                                    <div key={field.id}>
                                        {field.label && <label htmlFor={field.id} className="block text-lg font-medium text-content-secondary">{field.label}</label>}
                                        <textarea
                                            id={field.id}
                                            rows={field.rows || 3}
                                            value={answers[field.id] || ''}
                                            onChange={e => handleChange(field.id, e.target.value)}
                                            placeholder={field.prompt}
                                            className={`${field.label ? 'mt-2' : ''} w-full p-3 bg-background-secondary dark:bg-background-primary text-content-primary border border-border-secondary dark:border-border-secondary focus:outline-none focus:ring-1 focus:ring-accent-primary`}
                                        />
                                    </div>
                                );
                            })}

                            {section.subSections?.map((subSection, ssIndex) => (
                                <div key={ssIndex} className="ml-4 space-y-4">
                                    <h3 className="text-xl font-semibold text-content-primary">{subSection.title}</h3>
                                    {subSection.description && <p className="text-content-secondary italic">{subSection.description}</p>}
                                    {subSection.fields.map(field => (
                                        <div key={field.id}>
                                            {field.label && <label htmlFor={field.id} className="block text-lg font-medium text-content-secondary">{field.label}</label>}
                                            <textarea
                                                id={field.id}
                                                rows={field.rows || 3}
                                                value={answers[field.id] || ''}
                                                onChange={e => handleChange(field.id, e.target.value)}
                                                placeholder={field.prompt}
                                                className={`${field.label ? 'mt-2' : ''} w-full p-3 bg-background-secondary dark:bg-background-primary text-content-primary border border-border-secondary dark:border-border-secondary focus:outline-none focus:ring-1 focus:ring-accent-primary`}
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
                    className="w-full mt-8 px-6 py-3 text-base font-bold text-button-foreground-on-accent bg-accent-primary uppercase hover:bg-accent-primary-hover disabled:bg-gray-800 focus:outline-none transition-colors duration-200 rounded-lg shadow-md"
                >
                    {t('questionnaire_generateFile')}
                </button>
            </form>
        </div>
    );
};

export default Questionnaire;