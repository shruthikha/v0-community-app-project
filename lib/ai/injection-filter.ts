/**
 * lib/ai/injection-filter.ts
 * 
 * Simple regex-based guard to prevent basic prompt injection attacks 
 * in the persona and policies fields.
 */

const INJECTION_PATTERNS = [
    /ignore (?:all )?previous instructions/i,
    /disregard (?:all )?previous instructions/i,
    /you are (?:now|henceforth) a/i,
    /acting as/i,
    /new role/i,
    /system override/i,
    /dan mode/i,
    /jailbreak/i,
    /forget everything/i,
];

/**
 * Validates a prompt string against common injection patterns.
 * Returns true if the prompt is safe, false if it contains an injection pattern.
 */
export function validatePrompt(text?: string | null): { safe: boolean; pattern?: string } {
    if (!text) return { safe: true };

    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(text)) {
            return { safe: false, pattern: pattern.source };
        }
    }

    return { safe: true };
}
