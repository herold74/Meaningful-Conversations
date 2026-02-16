import React, { useState } from 'react';
import { getQuestionnaireStructure } from './questionnaireStructure';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { useLocalization } from '../context/LocalizationContext';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import Button from './shared/Button';

interface QuestionnaireProps {
    onSubmit: (context: string) => void;
    onBack: () => void;
    answers: Record<string, string>;
    onAnswersChange: (answers: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
}

const Questionnaire: React.FC<QuestionnaireProps> = ({ onSubmit, onBack, answers, onAnswersChange }) => {
    const { t } = useLocalization();
    const questionnaireStructure = getQuestionnaireStructure(t);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([questionnaireStructure[0]?.title]));
    const [expandedSubSections, setExpandedSubSections] = useState<Set<string>>(new Set());
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (id: string, value: string) => {
        onAnswersChange(prev => ({ ...prev, [id]: value }));
        if (id === 'profile_name' && value.trim()) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors['profile_name'];
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

    const toggleSubSection = (subSectionTitle: string) => {
        setExpandedSubSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(subSectionTitle)) {
                newSet.delete(subSectionTitle);
            } else {
                newSet.add(subSectionTitle);
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
                    if (field.type === 'list') {
                        const listItems = answer.split('\n').map(line => line.trim()).filter(line => line).map(line => line.startsWith('*') ? line : `* ${line}`).join('\n');
                        md += field.label ? `**${field.label}**:\n${listItems || ''}\n\n` : `${listItems || ''}\n\n`;
                    } else { // text type
                        md += field.label ? `**${field.label}**: ${answer}\n\n` : `${answer}\n\n`;
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
                        if (field.type === 'list') {
                            const listItems = answer.split('\n').map(line => line.trim()).filter(line => line).map(line => line.startsWith('*') ? line : `* ${line}`).join('\n');
                            md += field.label ? `**${field.label}**:\n${listItems || ''}\n\n` : `${listItems || ''}\n\n`;
                        } else { // text type
                            md += field.label ? `**${field.label}**: ${answer}\n\n` : `${answer}\n\n`;
                        }
                    });
                });
            }

            if (index < questionnaireStructure.length - 1) {
                md += '---\n\n';
            }
        });

        return md.replace(/\n{3,}/g, '\n\n').trim() + '\n';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!answers['profile_name']?.trim()) {
            setErrors({ 'profile_name': t('questionnaire_error_name_required') });
            setExpandedSections(prev => new Set(prev).add(questionnaireStructure[0].title));
            return;
        }
        const markdownContent = generateMarkdown();
        onSubmit(markdownContent);
    };

    return (
        <div className="relative w-full max-w-3xl mx-auto p-8 space-y-8 bg-background-secondary dark:bg-transparent border border-border-secondary dark:border-border-primary mt-4 mb-10 animate-fadeIn rounded-lg shadow-lg">
            <button onClick={onBack} className="absolute left-4 top-4 p-2 rounded-full bg-background-tertiary dark:bg-background-tertiary hover:bg-border-primary dark:hover:bg-border-primary transition-colors">
                <ArrowLeftIcon className="w-6 h-6 text-content-secondary" />
            </button>
            <div className="text-center mb-4">
                <h1 className="text-3xl font-bold text-content-primary uppercase">{t('questionnaire_title')}</h1>
                <p className="mt-2 text-content-secondary">{t('questionnaire_subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {questionnaireStructure.map((section, sIndex) => {
                    const isExpanded = expandedSections.has(section.title);
                    return (
                        <div key={sIndex} className="border border-border-primary dark:border-border-primary rounded-lg overflow-hidden">
                           <button 
                                type="button"
                                onClick={() => toggleSection(section.title)}
                                className="w-full flex justify-between items-center p-4 text-left bg-background-tertiary dark:bg-background-tertiary/50 hover:bg-border-primary dark:hover:bg-border-primary/50"
                                aria-expanded={isExpanded}
                            >
                                <h2 className="text-xl font-semibold text-content-primary">{section.title}</h2>
                                <ChevronDownIcon className={`w-6 h-6 text-content-secondary transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isExpanded && (
                                <div className="p-4 space-y-4 animate-fadeIn">
                                    {section.description && <p className="text-content-secondary italic">{section.description}</p>}
                                    
                                    {section.fields?.map(field => {
                                        if (field.id === 'profile_name') {
                                            return (
                                                <div key={field.id}>
                                                    <div className="flex items-center gap-4">
                                                        <label htmlFor={field.id} className="text-lg font-medium text-content-secondary shrink-0">
                                                            {field.label} <span className="text-sm text-status-danger-foreground font-semibold ml-1">({t('required_field_indicator')})</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id={field.id}
                                                            value={answers[field.id] || ''}
                                                            onChange={e => handleChange(field.id, e.target.value)}
                                                            placeholder={field.prompt}
                                                            className={`w-full p-3 bg-background-secondary dark:bg-background-primary text-content-primary border placeholder:italic ${errors['profile_name'] ? 'border-status-danger-border' : 'border-border-secondary dark:border-border-secondary'} focus:outline-none focus:ring-1 focus:ring-accent-primary`}
                                                            aria-required="true"
                                                            aria-invalid={!!errors['profile_name']}
                                                            aria-describedby={errors['profile_name'] ? 'name-error' : undefined}
                                                        />
                                                    </div>
                                                    {errors['profile_name'] && <p id="name-error" className="text-status-danger-foreground text-sm mt-1 text-right">{errors['profile_name']}</p>}
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
                                                    className={`${field.label ? 'mt-2' : ''} w-full p-3 bg-background-secondary dark:bg-background-primary text-content-primary border border-border-secondary dark:border-border-secondary focus:outline-none focus:ring-1 focus:ring-accent-primary placeholder:italic`}
                                                />
                                            </div>
                                        );
                                    })}

                                    {section.subSections?.map((subSection, ssIndex) => {
                                        const isSubSectionExpanded = expandedSubSections.has(subSection.title);
                                        return (
                                            <div key={ssIndex} className="space-y-4 border-l-2 border-border-primary pl-4">
                                                <button 
                                                    type="button"
                                                    onClick={() => toggleSubSection(subSection.title)}
                                                    className="w-full flex justify-between items-center text-left"
                                                    aria-expanded={isSubSectionExpanded}
                                                >
                                                    <h3 className="text-xl font-semibold text-content-primary">{subSection.title}</h3>
                                                    <ChevronDownIcon className={`w-5 h-5 text-content-secondary transition-transform duration-300 ${isSubSectionExpanded ? 'rotate-180' : ''}`} />
                                                </button>
                                                
                                                {isSubSectionExpanded && (
                                                    <div className="space-y-4 animate-fadeIn">
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
                                                                    className={`${field.label ? 'mt-2' : ''} w-full p-3 bg-background-secondary dark:bg-background-primary text-content-primary border border-border-secondary dark:border-border-secondary focus:outline-none focus:ring-1 focus:ring-accent-primary placeholder:italic`}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
                
                <Button type="submit" size="lg" fullWidth className="mt-8" disabled={!answers['profile_name']?.trim()}>
                    {t('questionnaire_generateFile')}
                </Button>
            </form>
        </div>
    );
};

export default Questionnaire;