import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { useLocalization } from '../context/LocalizationContext';
import { InfoIcon } from './icons/InfoIcon';

interface InfoViewProps {
}

const de_markdown_part1 = `Möchten Sie die Erkenntnisse aus Ihrem Coaching im Alltag vertiefen oder suchen Sie einen unkomplizierten Weg zur Selbstreflexion? "Sinnstiftende Gespräche" wurde genau dafür entwickelt. Die App ist Ihre intelligente Ergänzung zum professionellen Coaching und eine moderne Alternative zum Selbsthilfebuch – ein persönlicher Raum für Ihre Weiterentwicklung, der Ihnen jederzeit zur Verfügung steht.

## Unsere Philosophie: Fragen statt Antworten

Wir sind überzeugt: Die besten Antworten tragen Sie bereits in sich. Unsere Mission ist es, Ihnen zu helfen, diese durch einen klaren und fokussierten Dialog zu finden. Basierend auf der stärkenorientierten Haltung der Positiven Psychologie schaffen wir einen absolut privaten Raum für Ihre Erkenntnisse. Wir stellen die richtigen Fragen, damit Sie wachsen können.
`;

const de_centered_text = `Ganz im Sinne von: **Do it yourself, but not alone\\!**`;

const de_markdown_part2 = `
## Wie es funktioniert

"Sinnstiftende Gespräche" verbindet Ihre persönlichen Notizen und Ziele mit der fortschrittlichen KI von Google. Stellen Sie sich einen privaten Coach mit einem großartigen Gedächtnis und vertraulichen Notizen vor: Die App arbeitet mit dem Kontext Ihrer bisherigen Gespräche. Das ermöglicht es Ihnen, Ziele zu verfolgen, Herausforderungen aus verschiedenen Blickwinkeln zu betrachten und Ihren Fortschritt nachhaltig zu reflektieren.
`;

const de_final_sentence = `Diese Anwendung ist ein Projekt, das aus Leidenschaft für persönliches Wachstum und Technologie entstanden ist. Wir hoffen, dass sie Ihnen auf Ihrem Weg eine wertvolle Unterstützung ist.`;

const de_highlight = `Und wenn Sie den direkten Austausch wünschen, können Sie über [**manualmode.at**](http://manualmode.at) jederzeit einen zertifizierten Lebens- und Sozialberater kontaktieren.`;

const en_markdown_part1 = `Do you want to deepen the insights from your coaching in your daily life or are you looking for a straightforward way to self-reflection? "Meaningful Conversations" was developed precisely for this purpose. The app is your intelligent complement to professional coaching and a modern alternative to a self-help book – a personal space for your development that is available to you at any time.

## Our philosophy: Questions instead of Answers

We are convinced: You already carry the best answers within you. Our mission is to help you find them through clear and focused dialogue. Based on the strengths-oriented approach of Positive Psychology, we create an absolutely private space for your insights. We ask the right questions so you can grow.
`;

const en_centered_text = `In the spirit of: **Do it yourself, but not alone\\!**`;

const en_markdown_part2 = `
## How it works

"Meaningful Conversations" connects your personal notes and goals with Google's advanced AI. Imagine a private coach with a great memory and confidential notes: The app works with the context of your previous conversations. This allows you to pursue goals, view challenges from different angles, and sustainably reflect on your progress.
`;

const en_final_sentence = `This application is a project born from a passion for personal growth and technology. We hope it serves as a valuable support on your journey.`;

const en_highlight = `And if you want direct exchange, you can contact a certified life and social counselor at any time via [**manualmode.at**](http://manualmode.at).`;


const AboutView: React.FC<InfoViewProps> = () => {
    const { t, language } = useLocalization();
    const markdownPart1 = language === 'de' ? de_markdown_part1 : en_markdown_part1;
    const centeredText = language === 'de' ? de_centered_text : en_centered_text;
    const markdownPart2 = language === 'de' ? de_markdown_part2 : en_markdown_part2;
    const finalSentence = language === 'de' ? de_final_sentence : en_final_sentence;
    const highlightContent = language === 'de' ? de_highlight : en_highlight;

    return (
        <div className="w-full max-w-3xl mx-auto p-8 space-y-6 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 my-10 animate-fadeIn rounded-lg shadow-lg">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('about_title')}</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Version 1.4.5</p>
            </div>
            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-4 leading-relaxed">
                 <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-8 mb-4 not-prose" {...props} />,
                    }}
                >
                    {markdownPart1}
                </ReactMarkdown>

                <div className="not-prose text-center my-6 text-lg italic text-gray-600 dark:text-gray-400">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({node, ...props}) => <p className="mb-0" {...props} />,
                        }}
                    >
                        {centeredText}
                    </ReactMarkdown>
                </div>
                
                 <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-8 mb-4 not-prose" {...props} />,
                    }}
                >
                    {markdownPart2}
                </ReactMarkdown>
                
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {finalSentence}
                </ReactMarkdown>
            </div>
            <div className="p-4 mt-6 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 dark:border-green-500 text-green-800 dark:text-green-300 flex items-start gap-4 not-prose">
                 <InfoIcon className="w-8 h-8 flex-shrink-0 mt-1" />
                 <div>
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({node, ...props}) => <p className="text-left" {...props} />,
                            a: ({node, ...props}) => <a className="font-semibold text-green-700 dark:text-green-300 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                        }}
                    >
                        {highlightContent}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
};

export default AboutView;