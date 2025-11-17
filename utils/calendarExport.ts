import { createEvent, EventAttributes } from 'ics';

export interface CalendarEvent {
  action: string;
  deadline: string;
  description?: string;
}

/**
 * Parse deadline string from Life Context format
 * Supports formats:
 * - "Deadline: YYYY-MM-DD"
 * - "bis: DD.MM.YYYY" (German)
 * - "YYYY-MM-DD"
 * - "DD.MM.YYYY"
 */
const parseDeadline = (deadlineStr: string): Date | null => {
  // Remove common prefixes
  let cleaned = deadlineStr.replace(/^(Deadline:|bis:)\s*/i, '').trim();
  
  // Try ISO format first (YYYY-MM-DD)
  const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Try European format (DD.MM.YYYY)
  const euroMatch = cleaned.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (euroMatch) {
    const [, day, month, year] = euroMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Try slash format (MM/DD/YYYY or DD/MM/YYYY)
  const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const [, first, second, year] = slashMatch;
    // Assume DD/MM/YYYY format (European)
    return new Date(parseInt(year), parseInt(second) - 1, parseInt(first));
  }
  
  return null;
};

/**
 * Generate filename-safe slug from action text
 */
const generateSlug = (action: string): string => {
  return action
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
};

/**
 * Generate ICS calendar event for a single next step
 */
export const generateCalendarEvent = (
  event: CalendarEvent,
  language: 'en' | 'de' = 'en'
): Promise<{ error?: string; value?: string; filename?: string }> => {
  return new Promise((resolve) => {
    const deadline = parseDeadline(event.deadline);
    
    if (!deadline || isNaN(deadline.getTime())) {
      resolve({ error: `Invalid deadline format: ${event.deadline}` });
      return;
    }
    
    const reminderText = language === 'de'
      ? 'Erinnerung: Besuchen Sie die Meaningful Conversations App erneut, um Fortschritte zu verfolgen und Ihre Lebenskontext-Datei aktuell zu halten.'
      : 'Reminder: Revisit the Meaningful Conversations app to track progress and keep your Life Context file current.';
    
    const description = event.description || reminderText;
    
    // Set event to 9:00 AM on the deadline day
    const eventStart: [number, number, number, number, number] = [
      deadline.getFullYear(),
      deadline.getMonth() + 1,
      deadline.getDate(),
      9,
      0
    ];
    
    const eventAttributes: EventAttributes = {
      start: eventStart,
      duration: { minutes: 30 },
      title: event.action,
      description: description,
      status: 'CONFIRMED',
      busyStatus: 'FREE',
      alarms: [
        {
          action: 'display',
          description: event.action,
          trigger: { hours: 24, before: true } // 1 day before
        }
      ]
    };
    
    createEvent(eventAttributes, (error, value) => {
      if (error) {
        resolve({ error: error.message });
        return;
      }
      
      const filename = `meaningful-conversations-${generateSlug(event.action)}.ics`;
      resolve({ value, filename });
    });
  });
};

/**
 * Download ICS file to user's device
 */
export const downloadICSFile = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

/**
 * Export a single next step as calendar event
 */
export const exportSingleEvent = async (
  action: string,
  deadline: string,
  language: 'en' | 'de' = 'en'
): Promise<{ success: boolean; error?: string }> => {
  const result = await generateCalendarEvent({ action, deadline }, language);
  
  if (result.error || !result.value || !result.filename) {
    return { success: false, error: result.error || 'Failed to generate calendar event' };
  }
  
  downloadICSFile(result.value, result.filename);
  return { success: true };
};

/**
 * Export all next steps as separate calendar files
 */
export const exportAllEvents = async (
  nextSteps: { action: string; deadline: string }[],
  language: 'en' | 'de' = 'en'
): Promise<{ success: boolean; count: number; errors: string[] }> => {
  const errors: string[] = [];
  let successCount = 0;
  
  for (const step of nextSteps) {
    const result = await exportSingleEvent(step.action, step.deadline, language);
    if (result.success) {
      successCount++;
    } else {
      errors.push(`${step.action}: ${result.error}`);
    }
    
    // Small delay between downloads to avoid browser blocking
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return {
    success: successCount > 0,
    count: successCount,
    errors
  };
};

