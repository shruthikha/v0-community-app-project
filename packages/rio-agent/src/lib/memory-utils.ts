/**
 * Utilities for parsing and manipulating Mastra working memory strings.
 * M12: Support for GDPR-compliant memory management/pruning.
 */

export function parseWorkingMemory(workingMemory: string | null | undefined): string[] {
    if (!workingMemory) return [];

    return workingMemory
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#')) // Filter out headers
        // Strip common markdown bullet prefixes
        .map(line => line.replace(/^[-*]\s+/, ''));
}

/**
 * Updates a fact at a specific index and returns the new fact array.
 */
export function updateFactAtIndex(facts: string[], index: number, newValue: string): string[] {
    if (index < 0 || index >= facts.length) return facts;
    const newFacts = [...facts];
    newFacts[index] = newValue;
    return newFacts;
}

/**
 * Removes a fact at a specific index and returns the new fact array.
 */
export function removeFactByIndex(facts: string[], index: number): string[] {
    if (index < 0 || index >= facts.length) return facts;
    const newFacts = [...facts];
    newFacts.splice(index, 1);
    return newFacts;
}

/**
 * Formats an array of facts back into a standard markdown list for Mastra working memory.
 */
export function formatWorkingMemory(facts: string[]): string {
    return facts.map(f => `- ${f}`).join('\n');
}
