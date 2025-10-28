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
            const separatorMatch = originalSection.match(/\n(\s*---\s*\n*)$/);
            const separator = separatorMatch ? separatorMatch[0] : null;
            const sectionWithoutSeparator = separator ? originalSection.substring(0, originalSection.lastIndexOf(separator)) : originalSection;
            
            const isSingleLineBold = headlineLine.trim().startsWith('**') && !sectionWithoutSeparator.trim().includes('\n');
            const isBulletedAppend = choice.type === 'append' && ((update.content || '').trim().startsWith('*') || (update.content || '').trim().startsWith('-'));

            // Smart handling for single-line bold items (e.g., **Career Goal:**).
            // Both 'append' and 'replace_section' are treated as a value replacement to prevent duplication.
            // EXCEPTION: If we are appending a bullet point, treat it as a multi-line append to preserve formatting.
            if (isSingleLineBold && !isBulletedAppend) {
                const content = (update.content || '').trim();
                const normalizedKey = normalizeHeadline(headlineLine);
                // Regex to find the key (bold or not, with or without colon) at the start of the content. Case-insensitive.
                const keyRegex = new RegExp(`^(\\s*\\*\\*\\s*)?${normalizedKey}(\\s*\\*\\*\\s*)?:?`, 'i');
                
                let valuePart;
                if (keyRegex.test(content)) {
                    // AI's content includes the key. Strip it to get just the new value.
                    valuePart = content.replace(keyRegex, '').trim();
                } else {
                    // AI's content is just the value.
                    valuePart = content;
                }
                
                // Reconstruct the line using the original key and the new value.
                const keyPart = headlineLine.trim().split(':')[0] + ':'; // e.g., "**Career Goal**:"
                const newSectionBody = keyPart + ' ' + valuePart;
                
                sections[targetIndex] = newSectionBody + (separator || '\n\n');

            } else if (choice.type === 'append') {
                // Standard append for multi-line sections.
                sections[targetIndex] = originalSection.trimEnd() + formatContentForBlock(update.content);

            } else if (choice.type === 'replace_section') {
                // Standard replace for multi-line sections.
                const content = (update.content || '').trim();
                const headerBlockRegex = /^(#{1,6}\s[^\r\n]*\r?\n?(?:\s*\*.*?\*\s*\r?\n?)?)/m;
                const headerMatch = sectionWithoutSeparator.match(headerBlockRegex);
                const headerBlock = headerMatch ? headerMatch[0] : (headlineLine.trimEnd() + '\n');
                const newSectionBody = headerBlock.trimEnd() + '\n\n' + content;
                sections[targetIndex] = newSectionBody + (separator || '\n\n');
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