import { ProposedUpdate } from '../types';

export type AppliedUpdatePayload = { type: 'create_headline' | 'append' | 'replace_section', targetHeadline: string };

const headlinePatternString = '^(?:\\s*#{1,6}\\s[^\r\n]*|\\s*\\*\\*.*?\\*\\*:[^\r\n]*)';
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

            if (choice.type === 'append') {
                sections[targetIndex] = originalSection.trimEnd() + formatContentForBlock(update.content);
            } else if (choice.type === 'replace_section') {
                const content = (update.content || '').trim();
                const separatorMatch = originalSection.match(/\n(\s*---\s*\n*)$/);
                const separator = separatorMatch ? separatorMatch[0] : null;
                const sectionWithoutSeparator = separator ? originalSection.substring(0, originalSection.lastIndexOf(separator)) : originalSection;
                
                let newSectionBody;
                const isSingleLineBold = headlineLine.trim().startsWith('**') && !sectionWithoutSeparator.trim().includes('\n');

                if (isSingleLineBold) {
                    const keyPart = headlineLine.trimEnd();
                    const colonIndex = keyPart.indexOf(':');
                    if (colonIndex > -1) {
                        const actualKey = keyPart.substring(0, colonIndex + 1);
                        newSectionBody = actualKey + ' ' + content;
                    } else {
                        newSectionBody = keyPart + ' ' + content;
                    }
                } else {
                    // This logic is for multi-line sections (e.g., ## Headline).
                    // It preserves the main headline and an optional italicized subtitle line that follows it.
                    const headerBlockRegex = /^(#{1,6}\s[^\r\n]*\r?\n?(?:\s*\*.*?\*\s*\r?\n?)?)/m;
                    const headerMatch = sectionWithoutSeparator.match(headerBlockRegex);
                    
                    // Use the matched header block, or fall back to just the headline if the regex fails.
                    const headerBlock = headerMatch ? headerMatch[0] : (headlineLine.trimEnd() + '\n');
                    
                    // Construct the new section body by preserving the header and adding the new content.
                    newSectionBody = headerBlock.trimEnd() + '\n\n' + content;
                }
                sections[targetIndex] = newSectionBody + (separator || '\n\n');
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