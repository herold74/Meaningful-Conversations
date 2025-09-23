import React, { useMemo } from 'react';
import { createDiff, DiffResult } from '../utils/diff';

interface DiffViewerProps {
    oldText: string;
    newText: string;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ oldText, newText }) => {
    const diff = useMemo(() => createDiff(oldText, newText), [oldText, newText]);

    const renderLine = (line: DiffResult, index: number) => {
        let lineClass = 'px-4 py-1 font-mono text-sm whitespace-pre-wrap block';
        let prefix = '  ';
        let lineContent = line.value;

        if (line.type === 'added') {
            lineClass += ' bg-green-900/40 text-green-300';
            prefix = '+ ';
        } else if (line.type === 'removed') {
            lineClass += ' bg-red-900/40 text-red-300 line-through';
            prefix = '- ';
        } else {
            lineClass += ' text-gray-400';
        }
        
        // Handle empty lines to ensure they are rendered correctly
        if (lineContent.trim() === '') {
            lineContent = '\u00A0'; // Non-breaking space
        }

        return (
            <span key={index} className={lineClass}>
                <span className="select-none mr-2">{prefix}</span>
                <span>{lineContent}</span>
            </span>
        );
    };

    return (
        <div className="bg-gray-900 border border-gray-700 max-h-96 overflow-y-auto">
            {diff.map(renderLine)}
        </div>
    );
};

export default DiffViewer;
