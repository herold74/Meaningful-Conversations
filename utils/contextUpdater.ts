import { ProposedUpdate } from '../types';

export type AppliedUpdatePayload = { type: 'create_headline' | 'append' | 'replace_section', targetHeadline: string };

const headlinePatternString = '^(?:\\s*#{1,6}\\s[^\r\n]*|\\s*\\*\\*.*?\\*\\*:)';
const headlineRegex = new RegExp(headlinePatternString, 'gm');
const headlineSplitRegex = new RegExp(`(?=${headlinePatternString})`, 'gm');
const headlineFindRegex = new RegExp(headlinePatternString, 'm');

export const normalizeHeadline = (headline: unknown): string => {
    if (typeof headline !== 'string' || !headline) return '';
    const cleanHeadline = headline.trim();

    if (cleanHeadline.startsWith('#')) {
        return cleanHeadline.replace(/^#+\s*/, '').trim();
    }
    
    const boldMatch = cleanHeadline.match(/^\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch[1]) {
        return boldMatch[1].trim().replace(/:$/, '').trim();
    }
    
    return cleanHeadline;
};

export const getExistingHeadlines = (context: string): string[] => {
    if (!context) return [];
    const allHeadlines = context.match(headlineRegex) || [];
    const headlinesToExclude = ['My Life Context'];
    const uniqueHeadlines = [...new Set(allHeadlines.map(h => h.trim()))];
    return uniqueHeadlines.filter(h => !headlinesToExclude.includes(normalizeHeadline(h)));
};


export const buildUpdatedContext = (
    originalContext: string,
    updates: ProposedUpdate[],
    appliedUpdates: Map<number, AppliedUpdatePayload>
): string => {
    if (appliedUpdates.size === 0) {
        return originalContext;
    }
    
    const formatContentForBlock = (content: string): string => {
        const trimmed = (content || '').trim();
        if (!trimmed) return '';
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
            const separatorMatch = originalSection.match(/\n(\s*---\s*\n*)$/);
            const separator = separatorMatch ? separatorMatch[0] : null;
            
            if (choice.type === 'append') {
                sections[targetIndex] = originalSection.trimEnd() + formatContentForBlock(update.content);
            } else if (choice.type === 'replace_section') {
                const content = (update.content || '').trim();

                if (headlineLine.trim().startsWith('**')) {
                    // This logic now correctly handles both single-line and multi-line bold sections.
                    const keyPart = headlineLine.trim(); // This is just '**Key**:'
                    
                    // The AI's proposed content might sometimes mistakenly include the key.
                    // We strip it to get just the value.
                    const normalizedKey = normalizeHeadline(keyPart);
                    const keyRegex = new RegExp(`^(\\s*\\*\\*\\s*)?${normalizedKey}(\\s*\\*\\*\\s*)?:?`, 'i');
                    const valuePart = keyRegex.test(content) ? content.replace(keyRegex, '').trim() : content;
                    
                    // Reconstruct: key + space + value
                    const newSectionBody = keyPart + ' ' + valuePart;
                    sections[targetIndex] = newSectionBody + (separator || '\n\n');

                } else {
                    // This handles #-style headlines.
                    const newSectionBody = headlineLine.trim() + '\n\n' + content;
                    sections[targetIndex] = newSectionBody + (separator || '\n\n');
                }
            }
        } else { // Handle 'create_headline'
            const newHeadline = choice.targetHeadline.trim().startsWith('**')
                ? `**${normalizedTarget}**:`
                : `## ${normalizedTarget}`;
            const newContent = formatContentForBlock(update.content);
            newSectionsText.push(newHeadline + newContent);
        }
    });
    
    let finalDoc = prologue + sections.join('');
    if (newSectionsText.length > 0) {
        finalDoc = finalDoc.trimEnd() + '\n\n---\n\n' + newSectionsText.join('\n\n---\n\n');
    }

    return finalDoc.trim() ? finalDoc + '\n' : '';
};