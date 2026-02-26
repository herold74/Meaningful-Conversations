/**
 * Tests for diff utility
 */

import { createDiff, type DiffResult } from '../diff';

describe('diff', () => {
  describe('createDiff', () => {
    test('identical text produces only unchanged lines', () => {
      const text = 'line1\nline2\nline3';
      const result = createDiff(text, text);
      expect(result).toHaveLength(3);
      expect(result.every((r) => r.type === 'unchanged')).toBe(true);
      expect(result.map((r) => r.value)).toEqual(['line1', 'line2', 'line3']);
    });

    test('completely different text produces removed and added', () => {
      const oldText = 'a\nb\nc';
      const newText = 'x\ny\nz';
      const result = createDiff(oldText, newText);
      const removed = result.filter((r) => r.type === 'removed');
      const added = result.filter((r) => r.type === 'added');
      expect(removed).toHaveLength(3);
      expect(added).toHaveLength(3);
      expect(removed.map((r) => r.value)).toEqual(['a', 'b', 'c']);
      expect(added.map((r) => r.value)).toEqual(['x', 'y', 'z']);
    });

    test('additions only', () => {
      const oldText = 'line1';
      const newText = 'line1\nline2\nline3';
      const result = createDiff(oldText, newText);
      expect(result.find((r) => r.type === 'unchanged' && r.value === 'line1')).toBeDefined();
      expect(result.find((r) => r.type === 'added' && r.value === 'line2')).toBeDefined();
      expect(result.find((r) => r.type === 'added' && r.value === 'line3')).toBeDefined();
    });

    test('deletions only', () => {
      const oldText = 'line1\nline2\nline3';
      const newText = 'line1';
      const result = createDiff(oldText, newText);
      expect(result.find((r) => r.type === 'unchanged' && r.value === 'line1')).toBeDefined();
      expect(result.find((r) => r.type === 'removed' && r.value === 'line2')).toBeDefined();
      expect(result.find((r) => r.type === 'removed' && r.value === 'line3')).toBeDefined();
    });

    test('mixed changes', () => {
      const oldText = 'a\nb\nc';
      const newText = 'a\nx\nc';
      const result = createDiff(oldText, newText);
      expect(result).toContainEqual({ type: 'unchanged', value: 'a' });
      expect(result).toContainEqual({ type: 'removed', value: 'b' });
      expect(result).toContainEqual({ type: 'added', value: 'x' });
      expect(result).toContainEqual({ type: 'unchanged', value: 'c' });
    });

    test('empty old text', () => {
      const result = createDiff('', 'line1\nline2');
      expect(result.filter((r) => r.type === 'added').map((r) => r.value)).toContain('line1');
      expect(result.filter((r) => r.type === 'added').map((r) => r.value)).toContain('line2');
    });

    test('empty new text', () => {
      const result = createDiff('line1\nline2', '');
      expect(result.filter((r) => r.type === 'removed').map((r) => r.value)).toContain('line1');
      expect(result.filter((r) => r.type === 'removed').map((r) => r.value)).toContain('line2');
    });

    test('both empty', () => {
      const result = createDiff('', '');
      expect(result.length).toBeLessThanOrEqual(1);
    });
  });
});
