/**
 * Validation Utility
 * Common validators and sanitizers for application inputs.
 */

/**
 * Checks if a string is a valid HTTP/HTTPS URL.
 * Uses the URL constructor but enforces http/s protocol to prevent recursive loops or local file access.
 */
export function isValidUrl(url: string | undefined | null): boolean {
    if (!url) return false;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Sanitizes input text:
 * 1. Trims whitespace
 * 2. Enforces maximum length to prevent DoS (payload DoS)
 * 3. Returns empty string if input is null/undefined
 */
export function sanitizeText(text: string | undefined | null, maxLength = 50000): string {
    if (!text) return '';
    const trimmed = text.trim();
    if (trimmed.length > maxLength) {
        return trimmed.substring(0, maxLength);
    }
    return trimmed;
}
