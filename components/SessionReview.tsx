import React, { useState, useMemo, useEffect } from 'react';
import { ProposedUpdate, Bot, GamificationState } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import DiffViewer from './DiffViewer';
import { encrypt } from '../utils/encryption';

// A simplified and more robust regex pattern to capture both markdown and bolded headlines.
const headlinePatternString = '^(?:\\s*#{1,6}\\s.*|\\s*\\*\\*.*\\*\\*.*)';
const headlineRegex = new RegExp(headlinePatternString, 'gm');
const headlineSplitRegex = new RegExp(`(?=${headlinePatternString})`, 'gm');
const headlineFindRegex = new RegExp(headlinePatternString, 'm');


// A more robust function to extract the clean title from a full headline line.
const normalizeHeadline = (headline: string): string => {
    if (!headline || typeof headline !== 'string') return '';
    const cleanHeadline = headline.trim();

    if (cleanHeadline.startsWith('#')) {
        return cleanHeadline.replace(/^#+\s*/, '').trim();
    }
    
    // This correctly captures content within '**...**' and then cleans it up.
    const boldMatch = cleanHeadline.match(/^\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch[1]) {
        // Extract content from **...**, then trim it and any trailing colon.
        return boldMatch[1].trim().replace(/:$/, '').trim();
    }
    
    return cleanHeadline; // Fallback for non-matching lines
};

// A rewritten function to apply updates to the context reliably.
const buildUpdatedContext = (
    originalContext: string,
    updates: ProposedUpdate[],
    appliedUpdates: Map<number, { type: 'create_headline' | 'append' | 'replace_section', targetHeadline: string }>
): string => {
    if (appliedUpdates.size === 0) {
        return originalContext;
    }
    
    const formatContentForBlock = (content: string): string => {
        const trimmed = (content || '').trim();
        if (!trimmed) return '';
        // Ensure content starts on a new line and ends with one for proper spacing.
        return '\n' + trimmed + '\n';
    };

    let sections = originalContext.split(headlineSplitRegex);
    
    const prologue = sections.length > 0 && !headlineFindRegex.test(sections[0]) ? sections.shift() || '' : '';
    
    const normalizedHeadlineToIndexMap = new Map<string, number>();
    sections.forEach((section, index) => {
        if (!section) return;
        const match = section.match(headlineFindRegex);
        if (match && match[0]) {
            normalizedHeadlineToIndexMap.set(normalizeHeadline(match[0]), index);
        }
    });

    const newSectionsText: string[] = [];

    updates.forEach((update, index) => {
        const choice = appliedUpdates.get(index);
        if (!choice) return;

        const normalizedTarget = normalizeHeadline(choice.targetHeadline);
        let targetIndex = normalizedHeadlineToIndexMap.get(normalizedTarget);
        
        const originalSection = targetIndex !== undefined ? sections[targetIndex] : undefined;

        if (targetIndex !== undefined && typeof originalSection === 'string') {
            const headlineMatch = originalSection.match(headlineFindRegex);
            const headlineLine = headlineMatch?.[0] || choice.targetHeadline;

            if (choice.type === 'append') {
                sections[targetIndex] = originalSection.trimEnd() + formatContentForBlock(update.content);
            } else if (choice.type === 'replace_section') {
                let keyPart = headlineLine.trimEnd();
                 if (keyPart.trim().startsWith('**')) {
                    const keyMatch = keyPart.match(/^\s*(\*\*.+?\*\*[:]?)/);
                    if (keyMatch && keyMatch[1]) {
                        keyPart = keyMatch[1];
                        // If original was a single line, keep it that way.
                        if (!originalSection.trim().includes('\n')) {
                            sections[targetIndex] = keyPart + ' ' + update.content.trim();
                            return; // continue forEach
                        }
                    }
                }
                sections[targetIndex] = keyPart + formatContentForBlock(update.content);
            }
        } else { 
            const newHeadline = choice.targetHeadline.trim().startsWith('**')
                ? `**${normalizedTarget}**:`
                : `## ${normalizedTarget}`;
            const newContent = formatContentForBlock(update.content);
            newSectionsText.push(newHeadline + newContent);
        }
    });
    
    let finalDoc = prologue + sections.join('');
    if (newSectionsText.length > 0) {
        finalDoc = finalDoc.trimEnd() + '\n\n' + newSectionsText.join('\n');
    }

    return finalDoc.trim() ? finalDoc + '\n' : '';
};


interface SessionReviewProps {
    newFindings: string;
    proposedUpdates: ProposedUpdate[];
    nextSteps: { action: string; deadline: string }[];
    originalContext: string;
    selectedBot: Bot;
    onContinueSession: (newContext: string) => void;
    onSwitchCoach: (newContext: string) => void;
    onReturnToStart: () => void;
    gamificationState: GamificationState;
    accessKey: string;
    isAuthenticated: boolean;
}

const SessionReview: React.FC<SessionReviewProps> = ({
    newFindings,
    proposedUpdates,
    nextSteps,
    originalContext,
    selectedBot,
    onContinueSession,
    onSwitchCoach,
    onReturnToStart,
    gamificationState,
    accessKey,
    isAuthenticated,
}) => {
    
    const existingHeadlines = useMemo(() => {
        if (!originalContext) return [];
        const allHeadlines = originalContext.match(headlineRegex) || [];
        // Filter out unwanted general headlines from the dropdown.
        const headlinesToExclude = ['My Life Context', 'Background'];
        const uniqueHeadlines = [...new Set(allHeadlines.map(h => h.trim()))]; // Ensure uniqueness and trim
        return uniqueHeadlines.filter(h => !headlinesToExclude.includes(normalizeHeadline(h)));
    }, [originalContext]);

    const normalizedToOriginalHeadlineMap = useMemo(() => {
        return new Map(existingHeadlines.map((h): [string, string] => [normalizeHeadline(h), h]));
    }, [existingHeadlines]);
    
    const [appliedUpdates, setAppliedUpdates] = useState<Map<number, { type: 'create_headline' | 'append' | 'replace_section', targetHeadline: string }>>(() => {
        return new Map(proposedUpdates.map((update, index): [number, { type: 'create_headline' | 'append' | 'replace_section', targetHeadline: string }] => {
            const normalizedProposed = normalizeHeadline(update.headline);
            const matchingOriginal = normalizedToOriginalHeadlineMap.get(normalizedProposed);
            
            const targetHeadline = matchingOriginal || update.headline || 'New Section';
            const type = (matchingOriginal && update.type === 'create_headline') ? 'append' : update.type;

            return [index, { type, targetHeadline }];
        }));
    });
    const [editableContext, setEditableContext] = useState('');
    const [isFinalContextVisible, setIsFinalContextVisible] = useState(false);


    const handleToggleUpdate = (index: number) => {
        setAppliedUpdates(prev => {
            const newMap = new Map(prev);
            if (newMap.has(index)) {
                newMap.delete(index);
            } else {
                const originalUpdate = proposedUpdates[index];
                const normalizedProposed = normalizeHeadline(originalUpdate.headline);
                const matchingOriginal = normalizedToOriginalHeadlineMap.get(normalizedProposed);
                const targetHeadline = matchingOriginal || originalUpdate.headline || 'New Section';
                const type = (matchingOriginal && originalUpdate.type === 'create_headline') ? 'append' : originalUpdate.type;
                newMap.set(index, { type, targetHeadline });
            }
            return newMap;
        });
    };
    
    const handleActionChange = (index: number, newTargetHeadline: string) => {
        setAppliedUpdates(prev => {
            const newMap = new Map(prev);
            const originalUpdate = proposedUpdates[index];
            const existingNormalizedHeadlines = new Set(existingHeadlines.map(h => normalizeHeadline(h)));
            const isNewHeadline = !existingNormalizedHeadlines.has(normalizeHeadline(newTargetHeadline));

            let newType: ProposedUpdate['type'] = 'append'; // Default to append for existing
            if (isNewHeadline) {
                newType = 'create_headline';
            } else {
                if (originalUpdate.type === 'replace_section') {
                    newType = 'replace_section';
                }
            }
            
            newMap.set(index, {
                type: newType,
                targetHeadline: newTargetHeadline
            });

            return newMap;
        });
    };

    const newHeadlineProposals = useMemo(() => {
        const proposals = new Set<string>();
        const existingNormalized = new Set(existingHeadlines.map(normalizeHeadline));

        proposedUpdates.forEach(update => {
            const normalized = normalizeHeadline(update.headline);
            if (normalized && !existingNormalized.has(normalized)) {
                proposals.add(update.headline);
            }
        });
        return Array.from(proposals);
    }, [existingHeadlines, proposedUpdates]);


    const updatedContext = useMemo(() => {
        return buildUpdatedContext(originalContext, proposedUpdates, appliedUpdates);
    }, [originalContext, proposedUpdates, appliedUpdates]);

    useEffect(() => {
        // The streak key is added back during download/continuation, not here.
        // This ensures the textarea and diff view remain clean.
        setEditableContext(updatedContext);
    }, [updatedContext]);

    const addStreakToContext = (context: string): string => {
        const streakRegex = /<!-- do not delete: (.*?) -->/g;
        let finalContext = context.replace(streakRegex, '').trim();

        if (isAuthenticated && accessKey && gamificationState.lastSessionDate) {
            const dataToEncrypt = JSON.stringify({
                streak: gamificationState.streak,
                lastSessionDate: gamificationState.lastSessionDate,
            });
            const encryptedData = encrypt(dataToEncrypt, accessKey);
            const streakComment = `<!-- do not delete: ${encryptedData} -->`;
            if (finalContext) {
                finalContext = `${finalContext.trimEnd()}\n\n${streakComment}`;
            } else {
                finalContext = streakComment;
            }
        }
        return finalContext ? `${finalContext.trim()}\n` : '';
    };

    const handleDownloadContext = () => {
        const blob = new Blob([addStreakToContext(editableContext)], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Life_Context_Updated.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadSummary = () => {
        const blob = new Blob([newFindings], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Session_Summary.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col items-center justify-center py-10 animate-fadeIn">
            <div className="w-full max-w-4xl p-8 space-y-8 bg-transparent border border-gray-700">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-200 uppercase">Session Review</h1>
                    <p className="mt-2 text-lg text-gray-400">Review the insights and approve changes to your Life Context.</p>
                </div>

                <div className="p-4 bg-gray-900 border border-gray-700">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-300">Summary of New Findings</h2>
                        <button
                            onClick={handleDownloadSummary}
                            className="flex items-center gap-2 px-3 py-1 text-xs font-bold text-green-400 bg-transparent border border-green-400 uppercase hover:bg-green-400 hover:text-black"
                        >
                           <DownloadIcon className="w-4 h-4" /> Download Summary
                        </button>
                    </div>
                    <p className="mt-2 text-gray-400 whitespace-pre-wrap">{newFindings}</p>
                </div>

                {nextSteps && nextSteps.length > 0 && (
                    <div className="p-4 bg-gray-900 border border-green-500/50">
                        <h2 className="text-xl font-semibold text-gray-300">Your Next Steps</h2>
                        <p className="text-sm text-green-400 mt-1">Congratulations! You've earned a +50 XP bonus for defining clear actions.</p>
                        <ul className="mt-3 text-gray-400 space-y-2 list-disc list-inside">
                            {nextSteps.map((step, index) => (
                                <li key={index}>
                                    <strong>{step.action}</strong> (Deadline: {step.deadline})
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {proposedUpdates.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-300">Proposed Context Updates</h2>
                        <div className="space-y-3 max-h-96 overflow-y-auto p-3 bg-gray-900 border border-gray-700">
                            {proposedUpdates.map((update, index) => {
                                const currentApplied = appliedUpdates.get(index);
                                const actionType = currentApplied?.type || update.type;
                                const targetHeadline = currentApplied?.targetHeadline || update.headline;

                                return (
                                <div key={index} className="flex items-start gap-3 p-3 bg-gray-800/50 border border-gray-700/50">
                                    <input
                                        type="checkbox"
                                        id={`update-${index}`}
                                        checked={appliedUpdates.has(index)}
                                        onChange={() => handleToggleUpdate(index)}
                                        className="mt-1 h-5 w-5 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-600 cursor-pointer"
                                    />
                                    <div className="flex-1">
                                        <p className="font-mono whitespace-pre-wrap text-gray-400 text-sm">{update.content}</p>
                                        
                                        <div className="mt-2 flex items-center gap-2 text-sm flex-wrap">
                                            <span className={`font-mono px-2 py-0.5 rounded capitalize ${
                                                actionType === 'append' ? 'bg-blue-900 text-blue-300' :
                                                actionType === 'replace_section' ? 'bg-yellow-900 text-yellow-300' :
                                                'bg-purple-900 text-purple-300'
                                            }`}>{actionType.replace('_', ' ')}</span>
                                            <span className="text-gray-400">to</span>
                                            <select
                                                value={targetHeadline}
                                                onChange={(e) => handleActionChange(index, e.target.value)}
                                                className="bg-gray-700 border border-gray-600 text-white p-1 max-w-full"
                                            >
                                                <optgroup label="Add to existing section:">
                                                    {existingHeadlines.map(h => (
                                                        <option
                                                            key={h}
                                                            value={h}
                                                        >
                                                            {h.trim().startsWith('**') ? normalizeHeadline(h) : `» ${normalizeHeadline(h)}`}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                                {newHeadlineProposals.length > 0 && (
                                                    <optgroup label="Create new section:">
                                                        {newHeadlineProposals.map(h => (
                                                            <option
                                                                key={h}
                                                                value={h}
                                                            >
                                                                {h.trim().startsWith('**') ? normalizeHeadline(h) : `» ${normalizeHeadline(h)}`}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>
                )}

                {proposedUpdates.length > 0 && (
                     <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-300">Context Changes (Diff View)</h2>
                        <div className="flex items-center gap-4 text-sm mb-2">
                            <div className="flex items-center gap-2"><span className="w-4 h-4 bg-red-900/40 border border-red-500"></span><span>Removed</span></div>
                            <div className="flex items-center gap-2"><span className="w-4 h-4 bg-green-900/40 border border-green-500"></span><span>Added</span></div>
                        </div>
                        <DiffViewer oldText={originalContext} newText={updatedContext} />
                    </div>
                )}
                 
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-300">Final Updated Context</h2>
                        <button
                            onClick={() => setIsFinalContextVisible(prev => !prev)}
                            className="px-3 py-1 text-xs font-bold text-gray-400 bg-transparent border border-gray-700 uppercase hover:bg-gray-800"
                            aria-expanded={isFinalContextVisible}
                        >
                            {isFinalContextVisible ? 'Hide' : 'Show & Edit'}
                        </button>
                    </div>
                    {isFinalContextVisible && (
                        <textarea
                            value={editableContext}
                            onChange={(e) => setEditableContext(e.target.value)}
                            rows={10}
                            className="w-full p-3 font-mono text-sm bg-gray-900 text-gray-300 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-green-400 animate-fadeIn"
                            aria-label="Editable final context"
                        />
                    )}
                </div>


                <div className="pt-6 border-t border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
                     <button
                        onClick={handleDownloadContext}
                        className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 text-base font-bold text-green-400 bg-transparent border border-green-400 uppercase hover:bg-green-400 hover:text-black"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        Download Context
                    </button>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                         <button
                            onClick={() => onContinueSession(addStreakToContext(editableContext))}
                            className="w-full sm:w-auto px-6 py-3 text-base font-bold text-black bg-green-400 uppercase hover:bg-green-500"
                        >
                            Continue with {selectedBot.name}
                        </button>
                         <button
                            onClick={() => onSwitchCoach(addStreakToContext(editableContext))}
                            className="w-full sm:w-auto px-6 py-3 text-base font-bold text-gray-400 bg-transparent border border-gray-700 uppercase hover:bg-gray-800 hover:text-white"
                        >
                            Choose Different Coach
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionReview;