import { buildUpdatedContext, AppliedUpdatePayload } from '../contextUpdater';
import { ProposedUpdate } from '../../types';

describe('contextUpdater - Edge Case: Removing Empty Next Steps Section', () => {
    it('should keep the Next Steps section structure but clear tasks when all tasks are completed', () => {
        const originalContext = `# My Life Context

## 👤 Core Profile
**I am...**: A software developer

---

## ✅ Achievable Next Steps
*Specific, actionable tasks I have committed to.*

* Talk to my manager about workload (Deadline: 2025-11-15)

---

## 🧭 Life Domains
Some other content here.`;

        const updates: ProposedUpdate[] = [
            {
                type: 'replace_section',
                headline: 'Achievable Next Steps',
                content: '', // Empty content = all tasks completed
            }
        ];

        const appliedUpdates = new Map<number, AppliedUpdatePayload>();
        appliedUpdates.set(0, {
            type: 'replace_section',
            targetHeadline: 'Achievable Next Steps|7', // Line 7 in the original context
        });

        const result = buildUpdatedContext(originalContext, updates, appliedUpdates);

        // The section structure (headline + subtitle) should be preserved
        expect(result).toContain('## ✅ Achievable Next Steps');
        expect(result).toContain('*Specific, actionable tasks I have committed to.*');
        
        // But the task itself should be removed
        expect(result).not.toContain('Talk to my manager');
        
        // Other sections should remain intact
        expect(result).toContain('## 👤 Core Profile');
    });

    it('should keep the Next Steps section when there are remaining tasks', () => {
        const originalContext = `# My Life Context

## 👤 Core Profile
**I am...**: A software developer

---

## ✅ Achievable Next Steps
*A specific, actionable task I have committed to.*

* Talk to my manager about workload (Deadline: 2025-11-15)
* Review project timeline (Deadline: 2025-11-20)

---`;

        const updates: ProposedUpdate[] = [
            {
                type: 'replace_section',
                headline: 'Achievable Next Steps',
                content: '* Review project timeline (Deadline: 2025-11-20)', // One task remains
            }
        ];

        const appliedUpdates = new Map<number, AppliedUpdatePayload>();
        appliedUpdates.set(0, {
            type: 'replace_section',
            targetHeadline: 'Achievable Next Steps|7',
        });

        const result = buildUpdatedContext(originalContext, updates, appliedUpdates);

        // The section should still exist
        expect(result).toContain('## ✅ Achievable Next Steps');
        expect(result).toContain('Review project timeline');
        expect(result).not.toContain('Talk to my manager');
    });

    it('should handle completed task with new tasks added', () => {
        const originalContext = `# My Life Context

## 👤 Core Profile
**I am...**: A software developer

---

## ✅ Achievable Next Steps
*Specific, actionable tasks I have committed to.*

* Talk to my manager about workload (Deadline: 2025-11-15)

---`;

        const updates: ProposedUpdate[] = [
            {
                type: 'replace_section',
                headline: 'Achievable Next Steps',
                content: '* Prepare presentation for team meeting (Deadline: 2025-11-25)', // New task
            }
        ];

        const appliedUpdates = new Map<number, AppliedUpdatePayload>();
        appliedUpdates.set(0, {
            type: 'replace_section',
            targetHeadline: 'Achievable Next Steps|7',
        });

        const result = buildUpdatedContext(originalContext, updates, appliedUpdates);

        // The section should exist with the new task
        expect(result).toContain('## ✅ Achievable Next Steps');
        expect(result).toContain('Prepare presentation for team meeting');
        expect(result).not.toContain('Talk to my manager');
    });

    it('should preserve German Next Steps section structure when all tasks are completed', () => {
        const originalContext = `# Lebenskontext

## 👤 Kernprofil
**Ich bin...**: Ein Softwareentwickler

---

## ✅ Realisierbare nächste Schritte
*Spezifische, umsetzbare Aufgaben, zu denen ich mich verpflichtet habe.*

* Gespräch mit meinem Manager über Arbeitsbelastung (bis: 2025-11-15)

---`;

        const updates: ProposedUpdate[] = [
            {
                type: 'replace_section',
                headline: 'Realisierbare nächste Schritte',
                content: '', // Empty content = all tasks completed
            }
        ];

        const appliedUpdates = new Map<number, AppliedUpdatePayload>();
        appliedUpdates.set(0, {
            type: 'replace_section',
            targetHeadline: 'Realisierbare nächste Schritte|7',
        });

        const result = buildUpdatedContext(originalContext, updates, appliedUpdates);

        // The section structure should be preserved
        expect(result).toContain('## ✅ Realisierbare nächste Schritte');
        expect(result).toContain('*Spezifische, umsetzbare Aufgaben, zu denen ich mich verpflichtet habe.*');
        
        // But the task should be removed
        expect(result).not.toContain('Gespräch mit meinem Manager');
    });
});

