import { createHash } from 'node:crypto';

/**
 * Generates a SHA-256 hash of a string.
 * Used for PII-safe telemetry IDs (User/Tenant IDs) in PostHog.
 * 
 * @param data - The string to hash
 * @returns A 64-character hex string
 */
export function sha256(data: string): string {
    if (!data) return '';
    return createHash('sha256').update(data).digest('hex');
}
