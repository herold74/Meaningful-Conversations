import { ProposedUpdate } from '../types';

export type AppliedUpdatePayload = { type: 'create_headline' | 'append' | 'replace_section', targetHeadline: string };

export type HeadlineOption = {
    value: string;           // e.g., "**Goals**:|25" (Unique value for updates)
    label: string;           // e.g., "   Goals" (Formatted for display)
    hierarchicalKey: string; // e.g., "Career & Work > Goals" (Unique key for mapping)
};

/**
 * Assigns an appropriate emoji icon based on keywords found in a headline.
 * @param headline The clean headline string.
 * @returns An emoji string.
 */
const getEmojiForHeadline = (headline: string): string => {
    const lowerHeadline = headline.toLowerCase();
    if (lowerHeadline.includes('career') || lowerHeadline.includes('work') || lowerHeadline.includes('beruf')) return '💼';
    if (lowerHeadline.includes('growth') || lowerHeadline.includes('learning') || lowerHeadline.includes('wachstum')) return '💡';
    if (lowerHeadline.includes('relationship') || lowerHeadline.includes('social') || lowerHeadline.includes('beziehung')) return '👨‍👩‍👧‍👦';
    if (lowerHeadline.includes('health') || lowerHeadline.includes('wellness') || lowerHeadline.includes('gesundheit')) return '🌱';
    if (lowerHeadline.includes('mindset') || lowerHeadline.includes('belief') || lowerHeadline.includes('einstellung')) return '🧠';
    if (lowerHeadline.includes('finance') || lowerHeadline.includes('finanzen')) return '💰';
    if (lowerHeadline.includes('project') || lowerHeadline.includes('projekt')) return '🛠️';
    if (lowerHeadline.includes('hobby') || lowerHeadline.includes('leisure') || lowerHeadline.includes('freizeit')) return '🎨';
    return '📌'; // A generic pin as a fallback
};


/**
 * Normalizes a headline string for display or comparison.
 * It removes markdown characters (#, *, :), emojis, and the unique line-number identifier.
 * E.g., "## 💼 Career & Work" becomes "Career & Work".
 * @param headline The raw headline string.
 * @returns A clean, human-readable string.
 */
export const normalizeHeadline = (headline: unknown): string => {
    if (typeof headline !== 'string' || !headline) return '';
    
    return headline
        .replace(/\|.*$/, '') // Remove the line number identifier (e.g., |25)
        .replace(/^\s*#+\s*/, '') // Remove markdown heading characters
        .replace(/[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // Remove a wide range of emojis
        .replace(/^\s*\*\*(.*?)\*\*:.*/, '$1') // Extract key from bolded lines, discarding content
        .trim();
};


/**
 * Checks if a given line of text is formatted as a markdown headline.
 * @param line The line of text to check.
 * @returns True if the line is a headline, false otherwise.
 */
const isHeadline = (line: string): boolean => {
    if (!line) return false;
    const trimmedLine = line.trim();
    const hashHeadlineRegex = /^\s*#{1,6}\s.*/;
    const boldHeadlineRegex = /^\s*\*\*.*?\*\*:/;
    return hashHeadlineRegex.test(trimmedLine) || boldHeadlineRegex.test(trimmedLine);
};


/**
 * Scans the context file and extracts all headlines, creating unique and readable data for each.
 * This function understands the document hierarchy to generate descriptive labels.
 * @param context The full string content of the life context file.
 * @returns An array of HeadlineOption objects.
 */
export const getExistingHeadlines = (context: string): HeadlineOption[] => {
    if (!context) return [];
    
    const allHeadlines: HeadlineOption[] = [];
    const lines = context.split('\n');
    
    const h3HeadlineRegex = /^\s*###\s.*/;
    const h2HeadlineRegex = /^\s*##\s.*/;
    const boldHeadlineRegex = /^\s*\*\*.*?\*\*:/;

    let currentParentKey: string | null = null;

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        const lineNumber = index + 1;

        if (!isHeadline(trimmedLine)) return;

        // This block handles H2 and H3, which can act as parents.
        if (h2HeadlineRegex.test(trimmedLine) || h3HeadlineRegex.test(trimmedLine)) {
            const headlineText = trimmedLine;
            const uniqueIdentifier = `${headlineText}|${lineNumber}`;
            const normalizedName = normalizeHeadline(headlineText);
            
            // SET the current parent key.
            currentParentKey = normalizedName;
            
            allHeadlines.push({
                value: uniqueIdentifier,
                label: h2HeadlineRegex.test(trimmedLine) ? `- ${normalizedName}` : `  - ${normalizedName}`,
                hierarchicalKey: normalizedName, // For H2/H3, the key is just its own name
            });
    
        // This block handles bolded keys, which are children.
        } else if (boldHeadlineRegex.test(trimmedLine)) {
            const headlineText = trimmedLine;
            const uniqueIdentifier = `${headlineText}|${lineNumber}`;
            const normalizedName = normalizeHeadline(headlineText);

            const hierarchicalKey = currentParentKey 
                ? `${currentParentKey} > ${normalizedName}` 
                : normalizedName;
            
            allHeadlines.push({
                value: uniqueIdentifier,
                label: `   ${normalizedName}`,
                hierarchicalKey: hierarchicalKey,
            });
        }
    });

    const headlinesToExclude = ['My Life Context', 'Mein Lebenskontext', 'Life Domains', 'Lebensbereiche'];
    
    return allHeadlines.filter(h => !headlinesToExclude.includes(normalizeHeadline(h.value)));
};


/**
 * Constructs the new life context string by applying a set of user-approved updates
 * to the original context. This function is robust against duplicate headline names by
 * using line-number-based targeting.
 * @param originalContext The original string content of the life context file.
 * @param updates The array of all AI-proposed updates from the session.
 * @param appliedUpdates A Map where keys are indices from the `updates` array and values
 *                       are the user's choices for how and where to apply them.
 * @returns The new, updated life context string.
 */
export const buildUpdatedContext = (
    originalContext: string,
    updates: ProposedUpdate[],
    appliedUpdates: Map<number, AppliedUpdatePayload>
): string => {
    if (appliedUpdates.size === 0) {
        return originalContext;
    }

    const originalLines = originalContext.split('\n');
    const nextStepsRegex = /^\s*##\s*✅\s*(Achievable Next Steps|Realisierbare nächste Schritte)/;

    // 1. Isolate nextStepsLines and mainDocLines
    let mainDocLines: string[] = [];
    let nextStepsLines: string[] = [];
    
    let nextStepsSectionStartIndex = -1;
    originalLines.forEach((line, index) => {
        if (nextStepsRegex.test(line)) {
            nextStepsSectionStartIndex = index;
        }
    });
    
    if (nextStepsSectionStartIndex !== -1) {
        let separatorIndex = -1;
        for (let i = nextStepsSectionStartIndex - 1; i >= 0; i--) {
            const trimmedLine = originalLines[i].trim();
            if (trimmedLine === '---') {
                separatorIndex = i;
                break;
            }
            if (trimmedLine !== '') {
                break;
            }
        }
        const extractionStartIndex = separatorIndex !== -1 ? separatorIndex : nextStepsSectionStartIndex;
        mainDocLines = originalLines.slice(0, extractionStartIndex);
        nextStepsLines = originalLines.slice(nextStepsSectionStartIndex);
    } else {
        mainDocLines = originalLines;
        // nextStepsLines remains empty
    }

    // 2. Segregate appliedUpdates
    const mainDocModifyUpdates: {
        lineNumber: number;
        lineIndex: number;
        type: 'append' | 'replace_section';
        content: string;
        originalHeadline: string;
    }[] = [];
    const mainDocCreateUpdates = new Map<string, { subHeadline: string; content: string }[]>();
    const nextStepsModifyUpdates: { type: 'append' | 'replace_section', content: string }[] = [];

    appliedUpdates.forEach((payload, updateIndex) => {
        const update = updates[updateIndex];
        const normalizedTarget = normalizeHeadline(payload.targetHeadline);

        if (normalizedTarget === 'Achievable Next Steps' || normalizedTarget === 'Realisierbare nächste Schritte') {
            nextStepsModifyUpdates.push({
                type: payload.type as 'append' | 'replace_section',
                content: update.content,
            });
        } else if (payload.type === 'create_headline') {
            const target = payload.targetHeadline;
            if (target.includes(' > ')) {
                const [parent, child] = target.split(' > ');
                if (!mainDocCreateUpdates.has(parent)) {
                    mainDocCreateUpdates.set(parent, []);
                }
                mainDocCreateUpdates.get(parent)!.push({ subHeadline: child, content: update.content.trim() });
            } else {
                if (!mainDocCreateUpdates.has(target)) {
                    mainDocCreateUpdates.set(target, []);
                }
                mainDocCreateUpdates.get(target)!.push({ subHeadline: '', content: update.content.trim() });
            }
        } else { // append or replace_section for main doc
            const [headlineText, lineNumStr] = payload.targetHeadline.split('|');
            if (!lineNumStr) return;
            const lineNumber = parseInt(lineNumStr, 10);
            mainDocModifyUpdates.push({
                lineNumber,
                lineIndex: lineNumber - 1,
                type: payload.type as 'append' | 'replace_section',
                content: update.content,
                originalHeadline: headlineText,
            });
        }
    });

    // 3. Process mainDocUpdates
    mainDocModifyUpdates.sort((a, b) => b.lineNumber - a.lineNumber);

    for (const mod of mainDocModifyUpdates) {
        let endLineIndex = mainDocLines.length;
        for (let i = mod.lineIndex + 1; i < mainDocLines.length; i++) {
            const trimmedLine = mainDocLines[i].trim();
            if (isHeadline(trimmedLine) || trimmedLine.startsWith('---')) {
                endLineIndex = (i > 0 && mainDocLines[i - 1].trim() === '') ? i - 1 : i;
                break;
            }
        }

        const headlineLine = mainDocLines[mod.lineIndex];
        if (mod.type === 'replace_section') {
            const content = (mod.content || '').trim();
            if (headlineLine.trim().startsWith('**')) {
                const keyMatch = mod.originalHeadline.match(/^\s*(\*\*.*?\*\*:\s*)/);
                const key = keyMatch ? keyMatch[0] : mod.originalHeadline;
                const newSectionContent = content.startsWith('*') ? [key.trim(), ...content.split('\n')] : [`${key} ${content}`];
                mainDocLines.splice(mod.lineIndex, endLineIndex - mod.lineIndex, ...newSectionContent);
            } else {
                // For ## headlines: Keep the headline and any descriptive subtitle, even if content is empty
                const newSectionContent = [headlineLine];
                
                // Check if the next line after the headline is a descriptive subtitle (italic line starting with *)
                if (mod.lineIndex + 1 < mainDocLines.length) {
                    const nextLine = mainDocLines[mod.lineIndex + 1].trim();
                    if (nextLine.startsWith('*') && !nextLine.startsWith('* ')) {
                        // This is a descriptive subtitle like "*Specific, actionable tasks I have committed to.*"
                        newSectionContent.push(mainDocLines[mod.lineIndex + 1]);
                    }
                }
                
                // Add an empty line after subtitle if present
                if (newSectionContent.length > 1) {
                    newSectionContent.push('');
                }
                
                // Add the content if not empty
                if (content) {
                    newSectionContent.push('');
                    newSectionContent.push(...content.split('\n'));
                }
                
                mainDocLines.splice(mod.lineIndex, endLineIndex - mod.lineIndex, ...newSectionContent);
            }
        } else if (mod.type === 'append') {
            const contentToAppend = mod.content.trim();
            if (!contentToAppend) continue;
            let insertIndex = -1;
            for (let i = endLineIndex - 1; i >= mod.lineIndex; i--) {
                if (mainDocLines[i].trim() !== '') { insertIndex = i + 1; break; }
            }
            if (insertIndex === -1) { insertIndex = mod.lineIndex + 1; }
            const needsNewlineBefore = (mainDocLines[insertIndex - 1] || '').trim().startsWith('**') && !(mainDocLines[insertIndex - 1] || '').includes('\n') && !(mainDocLines[insertIndex - 1] || '').endsWith(':');
            mainDocLines.splice(insertIndex, 0, ...(needsNewlineBefore ? ['', ...contentToAppend.split('\n')] : contentToAppend.split('\n')));
        }
    }
    
    let mainDocString = mainDocLines.join('\n').trimEnd();

    if (mainDocCreateUpdates.size > 0) {
        const newSections: string[] = [];
        mainDocCreateUpdates.forEach((children, parent) => {
            const normalizedParent = normalizeHeadline(parent);
            const emoji = getEmojiForHeadline(normalizedParent);
            let sectionString = `### ${emoji} ${normalizedParent}`;
            
            const template: { [key: string]: string } = {
               'Current Situation': '',
               'Routines & Systems': '',
               'Goals': '',
               'Challenges': ''
            };
            const isLifeDomain = children.some(child => template.hasOwnProperty(normalizeHeadline(child.subHeadline)));

            if (isLifeDomain) {
                children.forEach(child => {
                   const normalizedSubHeadline = normalizeHeadline(child.subHeadline);
                   if (template.hasOwnProperty(normalizedSubHeadline)) {
                       template[normalizedSubHeadline] = child.content;
                   }
                });
                for (const [key, value] of Object.entries(template)) {
                    let formattedValue = value;
                    if (value) {
                         const valueLines = value.split('\n').map(l => l.trim());
                         formattedValue = valueLines.map(l => (l && !l.startsWith('*')) ? `* ${l}` : l).join('\n');
                    }
                    sectionString += `\n\n**${key}**: ${formattedValue || ''}`;
                }
            } else {
                children.forEach(child => {
                    let contentToAppend = child.content.trim();
                    // Robustness Fix: Check if the AI included a duplicate headline in the content.
                    // This regex matches a markdown headline (###), optional emoji, and the parent name, case-insensitively.
                    const headlineRegex = new RegExp(`^\\s*#{1,6}\\s*${emoji}?\\s*${normalizedParent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n?`, 'i');
                    
                    // If a duplicate is found, remove it from the content before appending.
                    contentToAppend = contentToAppend.replace(headlineRegex, '').trim();

                    if (contentToAppend) {
                        sectionString += `\n\n${contentToAppend}`;
                    }
                });
            }
            newSections.push(sectionString);
        });
        const newSectionsBlock = newSections.join('\n\n');
        if (mainDocString.trim()) {
            mainDocString = mainDocString.trimEnd() + '\n\n' + newSectionsBlock;
        } else {
            mainDocString = newSectionsBlock;
        }
    }

    // 4. Process nextStepsUpdates
    if (nextStepsModifyUpdates.length > 0 && nextStepsLines.length === 0) {
        const isGerman = originalContext.includes('# Mein Lebenskontext') || originalContext.includes('# Lebenskontext');
        const nextStepsHeader = isGerman ? '## ✅ Realisierbare nächste Schritte' : '## ✅ Achievable Next Steps';
        const nextStepsDesc = isGerman ? '*Spezifische, umsetzbare Aufgaben, zu denen ich mich verpflichtet habe.*' : '*Specific, actionable tasks I have committed to.*';
        nextStepsLines.push(nextStepsHeader, nextStepsDesc);
    }

    for (const mod of nextStepsModifyUpdates) {
        if (mod.type === 'append') {
            if (nextStepsLines.length > 0 && nextStepsLines[nextStepsLines.length - 1].trim() !== '') {
                nextStepsLines.push('');
            }
            nextStepsLines.push(...mod.content.trim().split('\n'));
        } else if (mod.type === 'replace_section') {
            const header = nextStepsLines[0] || '';
            const desc = nextStepsLines[1] || '';
            nextStepsLines = [header, desc, '', ...mod.content.trim().split('\n')].filter(l => l);
        }
    }
    
    // 5. Combine everything
    let finalDoc = mainDocString.trim();
    const nextStepsString = nextStepsLines.join('\n').trim();

    if (nextStepsString) {
        if (finalDoc) {
            finalDoc += '\n\n---\n\n' + nextStepsString;
        } else {
            finalDoc = nextStepsString;
        }
    }

    // 6. Final cleanup.
    finalDoc = finalDoc.replace(/\n{3,}/g, '\n\n');

    return finalDoc.trim() ? finalDoc.trim() + '\n' : '';
};