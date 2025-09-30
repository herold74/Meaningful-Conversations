import React from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { useLocalization } from '../context/LocalizationContext';

interface InfoViewProps {
    onBack: () => void;
}

const UserGuideView: React.FC<InfoViewProps> = ({ onBack }) => {
    const { t } = useLocalization();

    // Helper to convert simple HTML tags in translation strings to Markdown for the download.
    const toMarkdown = (str: string): string => {
        if (!str) return '';
        return str
            .replace(/<strong>/g, '**')
            .replace(/<\/strong>/g, '**')
            .replace(/<code>/g, '`')
            .replace(/<\/code>/g, '`');
    };

    const guideContent = [
        `# ${t('userGuide_title')}`,
        toMarkdown(t('userGuide_p1')),
        '---',

        `## ${toMarkdown(t('userGuide_s1_title'))}`,
        toMarkdown(t('userGuide_s1_p1')),
        toMarkdown(t('userGuide_s1_p2')),
        '---',

        `## ${toMarkdown(t('userGuide_s2_title'))}`,
        `### ${toMarkdown(t('userGuide_s2_step1_title'))}`,
        toMarkdown(t('userGuide_s2_step1_p1')),
        `- ${toMarkdown(t('userGuide_s2_step1_li1'))}`,
        `- ${toMarkdown(t('userGuide_s2_step1_li2'))}`,
        `### ${toMarkdown(t('userGuide_s2_step2_title'))}`,
        toMarkdown(t('userGuide_s2_step2_p1')),
        `### ${toMarkdown(t('userGuide_s2_step3_title'))}`,
        toMarkdown(t('userGuide_s2_step3_p1')),
        '---',

        `## ${toMarkdown(t('userGuide_s3_title'))}`,
        `### ${t('userGuide_s3_interface_title')}`,
        toMarkdown(t('userGuide_s3_interface_p1')),
        `#### ${t('userGuide_s3_text_title')}`,
        `- ${toMarkdown(t('userGuide_s3_text_li1'))}`,
        `- ${toMarkdown(t('userGuide_s3_text_li2'))}`,
        `#### ${t('userGuide_s3_voice_title')}`,
        `- ${toMarkdown(t('userGuide_s3_voice_li1'))}`,
        `- ${toMarkdown(t('userGuide_s3_voice_li2'))}`,
        `- ${toMarkdown(t('userGuide_s3_voice_li3'))}`,
        `### ${toMarkdown(t('userGuide_s3_ending_title'))}`,
        toMarkdown(t('userGuide_s3_ending_p1')),
        '---',

        `## ${toMarkdown(t('userGuide_s4_title'))}`,
        toMarkdown(t('userGuide_s4_p1')),
        `- ${toMarkdown(t('userGuide_s4_li1'))}`,
        `- ${toMarkdown(t('userGuide_s4_li2'))}`,
        `- ${toMarkdown(t('userGuide_s4_li3'))}`,
        `- ${toMarkdown(t('userGuide_s4_li4'))}`,
        `- ${toMarkdown(t('userGuide_s4_li5'))}`,
        `### ${toMarkdown(t('userGuide_s4_blockages_title'))}`,
        toMarkdown(t('userGuide_s4_blockages_p1')),
        `- ${toMarkdown(t('userGuide_s4_blockages_li1'))}`,
        `- ${toMarkdown(t('userGuide_s4_blockages_li2'))}`,
        '---',

        `## ${toMarkdown(t('userGuide_s5_title'))}`,
        toMarkdown(t('userGuide_s5_p1')),
        toMarkdown(t('userGuide_s5_p2')),
        `- ${toMarkdown(t('userGuide_s5_li1_context'))}`,
        `- ${toMarkdown(t('userGuide_s5_li2_summary'))}`,
        `- ${toMarkdown(t('userGuide_s5_li3_next'))}`,
        toMarkdown(t('userGuide_s5_p3')),
        `    - ${toMarkdown(t('userGuide_s5_p3_li1'))}`,
        `    - ${toMarkdown(t('userGuide_s5_p3_li2'))}`,
        '---',

        `## ${toMarkdown(t('userGuide_s6_title'))}`,
        toMarkdown(t('userGuide_s6_p1')),
        `- ${toMarkdown(t('userGuide_s6_li1'))}`,
        `- ${toMarkdown(t('userGuide_s6_li2'))}`,
        `- ${toMarkdown(t('userGuide_s6_li3'))}`,
        '---',

        `## ${toMarkdown(t('userGuide_s7_title'))}`,
        `- ${toMarkdown(t('userGuide_s7_li1'))}`,
        `- ${toMarkdown(t('userGuide_s7_li2'))}`,
        '',
        `**${t('userGuide_footer')}**`
    ].join('\n\n');

    const handleDownload = () => {
        const blob = new Blob([guideContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Meaningful_Conversations_User_Guide.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full max-w-3xl mx-auto p-8 space-y-6 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 my-10 animate-fadeIn">
            <div className="relative text-center">
                <button onClick={onBack} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Go back">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-500 dark:text-gray-400"/>
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('userGuide_title')}</h1>
            </div>
            
            <div className="flex justify-end">
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-green-600 dark:text-green-400 bg-transparent border border-green-600 dark:border-green-400 uppercase hover:bg-green-600 dark:hover:bg-green-400 hover:text-white dark:hover:text-black"
                >
                    <DownloadIcon className="w-4 h-4" />
                    {t('userGuide_download')}
                </button>
            </div>

            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-4 leading-relaxed">
                <p dangerouslySetInnerHTML={{ __html: t('userGuide_p1') }} />
                
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: t('userGuide_s1_title') }} />
                <p dangerouslySetInnerHTML={{ __html: t('userGuide_s1_p1') }} />
                <p dangerouslySetInnerHTML={{ __html: t('userGuide_s1_p2') }} />
                
                <hr className="border-gray-200 dark:border-gray-700"/>

                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: t('userGuide_s2_title') }} />
                <h3 className="font-semibold" dangerouslySetInnerHTML={{ __html: t('userGuide_s2_step1_title') }} />
                <p>{t('userGuide_s2_step1_p1')}</p>
                <ul className="list-disc list-inside space-y-1">
                    <li dangerouslySetInnerHTML={{ __html: t('userGuide_s2_step1_li1') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('userGuide_s2_step1_li2') }} />
                </ul>
                <h3 className="font-semibold" dangerouslySetInnerHTML={{ __html: t('userGuide_s2_step2_title') }} />
                <p dangerouslySetInnerHTML={{ __html: t('userGuide_s2_step2_p1') }} />
                <h3 className="font-semibold" dangerouslySetInnerHTML={{ __html: t('userGuide_s2_step3_title') }} />
                <p>{t('userGuide_s2_step3_p1')}</p>

                <hr className="border-gray-200 dark:border-gray-700"/>

                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: t('userGuide_s3_title') }} />
                <h3 className="font-semibold">{t('userGuide_s3_interface_title')}</h3>
                <p>{t('userGuide_s3_interface_p1')}</p>
                <h4 className="font-semibold">{t('userGuide_s3_text_title')}</h4>
                 <ul className="list-disc list-inside space-y-1">
                    <li>{t('userGuide_s3_text_li1')}</li>
                    <li dangerouslySetInnerHTML={{ __html: t('userGuide_s3_text_li2') }} />
                </ul>
                <h4 className="font-semibold">{t('userGuide_s3_voice_title')}</h4>
                 <ul className="list-disc list-inside space-y-1">
                    <li dangerouslySetInnerHTML={{ __html: t('userGuide_s3_voice_li1') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('userGuide_s3_voice_li2') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('userGuide_s3_voice_li3') }} />
                </ul>
                <h3 className="font-semibold" dangerouslySetInnerHTML={{ __html: t('userGuide_s3_ending_title') }} />
                <p dangerouslySetInnerHTML={{ __html: t('userGuide_s3_ending_p1') }} />
                
                <hr className="border-gray-200 dark:border-gray-700"/>

                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: t('userGuide_s4_title') }} />
                <p>{t('userGuide_s4_p1')}</p>
                <ul className="list-disc list-inside space-y-1">
                    <li dangerouslySetInnerHTML={{ __html: t('userGuide_s4_li1') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('userGuide_s4_li2') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('userGuide_s4_li3') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('userGuide_s4_li4') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('userGuide_s4_li5') }} />
                </ul>
                <h3 className="font-semibold" dangerouslySetInnerHTML={{ __html: t('userGuide_s4_blockages_title') }} />
                <p dangerouslySetInnerHTML={{ __html: t('userGuide_s4_blockages_p1') }} />
                <ul className="list-disc list-inside space-y-1">
                    <li dangerouslySetInnerHTML={{ __html: t('userGuide_s4_blockages_li1') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('userGuide_s4_blockages_li2') }} />
                </ul>

                <hr className="border-gray-200 dark:border-gray-700"/>

                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: t('userGuide_s5_title') }} />
                <p className="font-bold text-lg text-yellow-600 dark:text-yellow-400" dangerouslySetInnerHTML={{ __html: t('userGuide_s5_p1') }} />
                <p dangerouslySetInnerHTML={{ __html: t('userGuide_s5_p2') }} />
                <ul className="list-disc list-inside space-y-1">
                    <li dangerouslySetInnerHTML={{ __html: t('userGuide_s5_li1_context') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('userGuide_s5_li2_summary') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('userGuide_s5_li3_next') }}/>
                </ul>
                <p>{t('userGuide_s5_p3')}</p>
                 <ul className="list-disc list-inside space-y-1">
                    <li dangerouslySetInnerHTML={{ __html: t('userGuide_s5_p3_li1') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('userGuide_s5_p3_li2') }} />
                </ul>

                <hr className="border-gray-200 dark:border-gray-700"/>

                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: t('userGuide_s6_title') }} />
                <p>{t('userGuide_s6_p1')}</p>
                <ul className="list-disc list-inside space-y-1">
                    <li dangerouslySetInnerHTML={{ __html: t('userGuide_s6_li1') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('userGuide_s6_li2') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('userGuide_s6_li3') }} />
                </ul>

                <hr className="border-gray-200 dark:border-gray-700"/>

                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: t('userGuide_s7_title') }} />
                <ul className="list-disc list-inside space-y-1">
                    <li dangerouslySetInnerHTML={{ __html: t('userGuide_s7_li1') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('userGuide_s7_li2') }} />
                </ul>
                <p className="pt-4 font-semibold">{t('userGuide_footer')}</p>
            </div>
        </div>
    );
};

export default UserGuideView;