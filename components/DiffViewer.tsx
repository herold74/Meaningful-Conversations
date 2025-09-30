import React, { useMemo } from 'react';
import { createDiff, DiffResult } from '../utils/diff';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DiffViewerProps {
    oldText: string;
    newText: string;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ oldText, newText }) => {
    const diff = useMemo(() => createDiff(oldText, newText), [oldText, newText]);

    const renderLine = (line: DiffResult, index: number) => {
        let lineClass = 'flex items-baseline px-4 py-1 font-mono text-sm';
        let prefix = '  ';
        let lineContent = line.value;

        if (line.type === 'added') {
            lineClass += ' bg-green-100/50 dark:bg-green-900/40 text-green-800 dark:text-green-300';
            prefix = '+ ';
        } else if (line.type === 'removed') {
            lineClass += ' bg-red-100/50 dark:bg-red-900/40 text-red-800 dark:text-red-300 line-through';
            prefix = '- ';
        } else {
            lineClass += ' text-gray-500 dark:text-gray-400';
        }
        
        // Handle empty lines to ensure they are rendered correctly
        if (lineContent.trim() === '') {
            lineContent = '\u00A0'; // Non-breaking space
        }

        return (
            <div key={index} className={lineClass}>
                <span className="select-none mr-2">{prefix}</span>
                {/* FIX: The 'className' prop on ReactMarkdown is causing a type error, likely due to a type definition mismatch. Moved the classes to a wrapper div to resolve the issue while preserving styling. */}
                <div className="w-full whitespace-pre-wrap">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            // Render paragraphs as simple spans to inherit parent styles and prevent layout breaks.
                            p: ({node, ...props}) => <span {...props} />,
                            h1: ({node, ...props}) => <h1 className="text-xl font-bold" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-lg font-bold" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-base font-bold" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                            em: ({node, ...props}) => <em className="italic" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-5" {...props} />,
                        }}
                    >
                        {lineContent}
                    </ReactMarkdown>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
            {diff.map(renderLine)}
        </div>
    );
};

export default DiffViewer;