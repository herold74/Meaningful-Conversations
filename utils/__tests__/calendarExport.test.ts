/**
 * Tests for Calendar Export Utility
 */

import { generateCalendarEvent, generateCalendarEventWithDate, CalendarEvent } from '../calendarExport';

// Mock the ics library
jest.mock('ics', () => ({
  createEvent: jest.fn((attributes, callback) => {
    // Simulate successful ICS generation
    const mockICSContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${attributes.start.join('')}T090000
DURATION:PT30M
SUMMARY:${attributes.title}
DESCRIPTION:${attributes.description}
END:VEVENT
END:VCALENDAR`;
    callback(null, mockICSContent);
  }),
}));

describe('calendarExport', () => {
  describe('generateCalendarEventWithDate', () => {
    test('generates calendar event with valid date', async () => {
      const action = 'Complete project proposal';
      const deadline = new Date(2025, 10, 20); // November 20, 2025
      
      const result = await generateCalendarEventWithDate(action, deadline, 'en');
      
      expect(result.error).toBeUndefined();
      expect(result.value).toBeDefined();
      expect(result.filename).toBeDefined();
      expect(result.filename).toContain('meaningful-conversations');
      expect(result.filename).toContain('.ics');
    });

    test('generates filename from action text', async () => {
      const action = 'Review Budget & Finances!';
      const deadline = new Date(2025, 10, 20);
      
      const result = await generateCalendarEventWithDate(action, deadline, 'en');
      
      expect(result.filename).toContain('review-budget-finances');
    });

    test('includes German description when language is de', async () => {
      const action = 'Projekt abschließen';
      const deadline = new Date(2025, 10, 20);
      
      const result = await generateCalendarEventWithDate(action, deadline, 'de');
      
      expect(result.error).toBeUndefined();
      expect(result.value).toBeDefined();
      expect(result.value).toContain('Erinnerung');
    });

    test('returns error for invalid date', async () => {
      const action = 'Complete task';
      const invalidDate = new Date('invalid');
      
      const result = await generateCalendarEventWithDate(action, invalidDate, 'en');
      
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid date');
    });

    test('includes full action in description and app link', async () => {
      const action = 'Team meeting to discuss Q4 goals';
      const deadline = new Date(2025, 10, 20);
      
      const result = await generateCalendarEventWithDate(action, deadline, 'en');
      
      expect(result.error).toBeUndefined();
      expect(result.value).toContain(action); // Full action in description
      expect(result.value).toContain('https://mc-app.manualmode.at'); // App link
      expect(result.value).toContain('SUMMARY:Team meeting to...'); // Shortened title
    });

    test('truncates long action names in filename', async () => {
      const longAction = 'This is a very long action name that should be truncated to fit within reasonable filename length limits';
      const deadline = new Date(2025, 10, 20);
      
      const result = await generateCalendarEventWithDate(longAction, deadline, 'en');
      
      expect(result.filename).toBeDefined();
      expect(result.filename!.length).toBeLessThan(100); // Reasonable filename length
    });

    test('truncates title to 3 words with ellipsis', async () => {
      const action = 'Research and sign up for a local drawing class';
      const deadline = new Date(2025, 10, 20);
      
      const result = await generateCalendarEventWithDate(action, deadline, 'en');
      
      expect(result.error).toBeUndefined();
      expect(result.value).toContain('SUMMARY:Research and sign...'); // Truncated to 3 words
      expect(result.value).toContain(action); // Full action in description
    });

    test('does not add ellipsis when action is 3 words or less', async () => {
      const action = 'Call doctor';
      const deadline = new Date(2025, 10, 20);
      
      const result = await generateCalendarEventWithDate(action, deadline, 'en');
      
      expect(result.error).toBeUndefined();
      expect(result.value).toContain('SUMMARY:Call doctor'); // No ellipsis
      expect(result.value).not.toContain('...'); // No ellipsis anywhere in title
    });
  });

  describe('generateCalendarEvent', () => {
    test('generates event for valid ISO date', async () => {
      const event: CalendarEvent = {
        action: 'Submit report',
        deadline: '2025-11-20'
      };
      
      const result = await generateCalendarEvent(event, 'en');
      
      expect(result.error).toBeUndefined();
      expect(result.needsManualInput).toBeUndefined();
      expect(result.value).toBeDefined();
      expect(result.filename).toBeDefined();
    });

    test('flags unparseable deadline for manual input', async () => {
      const event: CalendarEvent = {
        action: 'Complete task',
        deadline: 'sometime next month'
      };
      
      const result = await generateCalendarEvent(event, 'en');
      
      expect(result.needsManualInput).toBe(true);
      expect(result.error).toBeDefined();
    });

    test('handles deadline with prefix', async () => {
      const event: CalendarEvent = {
        action: 'Review documents',
        deadline: 'Deadline: 2025-11-20'
      };
      
      const result = await generateCalendarEvent(event, 'en');
      
      expect(result.error).toBeUndefined();
      expect(result.needsManualInput).toBeUndefined();
      expect(result.value).toBeDefined();
    });

    test('parses relative date "tomorrow"', async () => {
      const event: CalendarEvent = {
        action: 'Call client',
        deadline: 'tomorrow'
      };
      
      const result = await generateCalendarEvent(event, 'en');
      
      expect(result.error).toBeUndefined();
      expect(result.needsManualInput).toBeUndefined();
      expect(result.value).toBeDefined();
    });

    test('parses German relative date "morgen"', async () => {
      const event: CalendarEvent = {
        action: 'Kunde anrufen',
        deadline: 'morgen'
      };
      
      const result = await generateCalendarEvent(event, 'de');
      
      expect(result.error).toBeUndefined();
      expect(result.needsManualInput).toBeUndefined();
      expect(result.value).toBeDefined();
    });

    test('handles empty deadline string', async () => {
      const event: CalendarEvent = {
        action: 'Task',
        deadline: ''
      };
      
      const result = await generateCalendarEvent(event, 'en');
      
      expect(result.needsManualInput).toBe(true);
    });

    test('includes action in description and app link', async () => {
      const event: CalendarEvent = {
        action: 'Workshop on advanced topics',
        deadline: '2025-11-20'
      };
      
      const result = await generateCalendarEvent(event, 'en');
      
      expect(result.error).toBeUndefined();
      expect(result.value).toContain('Workshop on advanced topics'); // Full action in description
      expect(result.value).toContain('https://mc-app.manualmode.at'); // App link
    });
  });

  describe('Edge Cases', () => {
    test('handles special characters in action', async () => {
      const action = 'Review Q&A: Test "quotes" & symbols!';
      const deadline = new Date(2025, 10, 20);
      
      const result = await generateCalendarEventWithDate(action, deadline, 'en');
      
      expect(result.error).toBeUndefined();
      expect(result.filename).toBeDefined();
    });

    test('handles action with only spaces', async () => {
      const action = '   ';
      const deadline = new Date(2025, 10, 20);
      
      const result = await generateCalendarEventWithDate(action, deadline, 'en');
      
      expect(result.error).toBeUndefined();
      expect(result.filename).toBeDefined();
    });

    test('handles Unicode characters in action', async () => {
      const action = 'Café meeting ☕ with André';
      const deadline = new Date(2025, 10, 20);
      
      const result = await generateCalendarEventWithDate(action, deadline, 'en');
      
      expect(result.error).toBeUndefined();
      expect(result.filename).toBeDefined();
    });
  });
});

