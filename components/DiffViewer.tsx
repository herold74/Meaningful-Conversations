import React, { useMemo } from 'react';
import { createDiff, DiffResult } from '../utils/diff';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DiffViewerProps {
    oldText: string;
    newText: string;
}

type DiffGroup = {
    type: 'added' | 'removed' | 'unchanged';
    content: string;
};

const DiffViewer: React.FC<DiffViewerProps> = ({ oldText, newText }) => {
    const diff = useMemo(() => createDiff(oldText, newText), [oldText, newText]);

    const groupedDiff = useMemo(() => {
        if (!diff.length) return [];

        return diff.reduce((acc: DiffGroup[], current: DiffResult) => {
            // Don't add completely empty unchanged lines between blocks, as prose handles margins.
            if (current.type === 'unchanged' && current.value.trim() === '') {
                const lastGroup = acc.length > 0 ? acc[acc.length - 1] : null;
                // Add a single empty line if the last block wasn't also just an empty line, to preserve paragraph breaks
                if (lastGroup && lastGroup.content.trim() !== '') {
                    acc.push({ type: 'unchanged', content: '' });
                }
                return acc;
            }

            const lastGroup = acc.length > 0 ? acc[acc.length - 1] : null;
            if (lastGroup && lastGroup.type === current.type) {
                lastGroup.content += '\n' + current.value;
            } else {
                acc.push({ type: current.type, content: current.value });
            }
            return acc;
        }, []);
    }, [diff]);

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 h-96 overflow-y-auto rounded-lg">
            {groupedDiff.map((group, index) => {
                let groupClass = 'transition-colors';
                if (group.type === 'added') {
                    groupClass += ' bg-green-100/60 dark:bg-green-900/40';
                } else if (group.type === 'removed') {
                    groupClass += ' bg-red-100/60 dark:bg-red-900/40 line-through text-gray-500 dark:text-gray-500';
                }
                
                // If content is just whitespace, render a div to preserve the space without prose styling
                if (group.content.trim() === '') {
                    return <div key={index} className="h-4" />;
                }

                return (
                    <div key={index} className={groupClass}>
                        <div className="prose prose-sm dark:prose-invert max-w-none px-4 py-1">
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {group.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DiffViewer;
