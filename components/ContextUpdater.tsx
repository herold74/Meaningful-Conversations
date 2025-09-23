import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ProposedUpdate } from '../types';
import DiffViewer from './DiffViewer';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';

interface ContextUpdaterProps {
    originalContext: string;
    updates: ProposedUpdate[];
    onContextChange: (newContext: string) => void;
}

const applyUpdatesToContext = (originalContext: string, updates: ProposedUpdate[], appliedIndices: Set<number>): string => {
    if (appliedIndices.size === 0) {
        return originalContext;
    }

    let contextLines = originalContext.split('\n');

    const appliedUpdates = updates.filter((_, index) => appliedIndices.has(index));

    // A more robust way to apply changes without loops over loops
    appliedUpdates.forEach(update => {
        const headlineRegex = new RegExp(`^(#+)\\s*${update.headline.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i');
        const headlineIndex = contextLines.findIndex(line => headlineRegex.test(line));

        switch (update.type) {
            case 'create_headline':
                contextLines.push('', `## ${update.headline}`, '', update.content);
                break;
            case 'append':
                if (headlineIndex !== -1) {
                    const match = contextLines[headlineIndex].match(headlineRegex);
                    const level = match ? match[1].length : 0;
                    const nextHeadlineRegex = new RegExp(`^#{1,${level}}\\s`, 'i');
                    
                    let nextHeadlineIndex = contextLines.findIndex((line, i) => i > headlineIndex && nextHeadlineRegex.test(line));
                    if (nextHeadlineIndex === -1) {
                        nextHeadlineIndex = contextLines.length;
                    }
                    
                    contextLines.splice(nextHeadlineIndex, 0, update.content);
                } else {
                    // Fallback to create if headline not found
                    contextLines.push('', `## ${update.headline}`, '', update.content);
                }
                break;
            case 'replace_section':
                if (headlineIndex !== -1) {
                    const match = contextLines[headlineIndex].match(headlineRegex);
                    const level = match ? match[1].length : 0;
                    const nextHeadlineRegex = new RegExp(`^#{1,${level}}\\s`, 'i');
                    
                    let nextHeadlineIndex = contextLines.findIndex((line, i) => i > headlineIndex && nextHeadlineRegex.test(line));
                    if (nextHeadlineIndex === -1) {
                        nextHeadlineIndex = contextLines.length;
                    }
                    
                    contextLines.splice(headlineIndex + 1, nextHeadlineIndex - (headlineIndex + 1), update.content);
                } else {
                     // Fallback to create if headline not found
                    contextLines.push('', `## ${update.headline}`, '', update.content);
                }
                break;
        }
    });


    return contextLines.join('\n');
};


const ContextUpdater: React.FC<ContextUpdaterProps> = ({ originalContext, updates, onContextChange }) => {
    const [appliedIndices, setAppliedIndices] = useState<Set<number>>(() => new Set(updates.map((_, i) => i)));

    const handleToggle = (index: number) => {
        setAppliedIndices(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const newContext = useMemo(() => {
        return applyUpdatesToContext(originalContext, updates, appliedIndices);
    }, [originalContext, updates, appliedIndices]);
    
    useEffect(() => {
        onContextChange(newContext);
    }, [newContext, onContextChange]);

    const handleSelectAll = useCallback(() => {
        setAppliedIndices(new Set(updates.map((_, i) => i)));
    }, [updates]);
    
    const handleDeselectAll = useCallback(() => {
        setAppliedIndices(new Set());
    }, []);

    if (updates.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Proposed Changes</h3>
                <div className="flex items-center gap-4 mb-3">
                    <button onClick={handleSelectAll} className="text-sm text-green-400 hover:underline">Select All</button>
                    <button onClick={handleDeselectAll} className="text-sm text-yellow-400 hover:underline">Deselect All</button>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto p-3 bg-gray-900 border border-gray-700">
                    {updates.map((update, index) => (
                        <div key={index} className="flex items-start gap-3 p-2 bg-gray-800/50 border border-gray-700/50">
                            <input
                                type="checkbox"
                                id={`update-${index}`}
                                checked={appliedIndices.has(index)}
                                onChange={() => handleToggle(index)}
                                className="mt-1 h-5 w-5 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-600 cursor-pointer"
                            />
                            <label htmlFor={`update-${index}`} className="flex-1 cursor-pointer">
                                <span className={`text-sm font-mono px-2 py-0.5 rounded ${
                                    update.type === 'append' ? 'bg-blue-900 text-blue-300' :
                                    update.type === 'replace_section' ? 'bg-yellow-900 text-yellow-300' :
                                    'bg-purple-900 text-purple-300'
                                }`}>{update.type}</span>
                                <p className="mt-1 text-gray-300"><strong>Headline:</strong> {update.headline}</p>
                                <p className="mt-1 text-gray-400 text-sm whitespace-pre-wrap font-mono">{update.content}</p>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Context Diff</h3>
                 <div className="flex items-center gap-4 text-sm mb-2">
                    <div className="flex items-center gap-2"><span className="w-4 h-4 bg-red-900/40 border border-red-500"></span><span>Removed</span></div>
                    <div className="flex items-center gap-2"><span className="w-4 h-4 bg-green-900/40 border border-green-500"></span><span>Added</span></div>
                </div>
                <DiffViewer oldText={originalContext} newText={newContext} />
            </div>
        </div>
    );
};

export default ContextUpdater;
