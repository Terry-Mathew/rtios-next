import { isValidUrl, sanitizeText } from './validation';
import { describe, it, expect } from 'vitest';

describe('Validation Utils', () => {
    describe('isValidUrl', () => {
        it('should validate correct URLs', () => {
            expect(isValidUrl('https://google.com')).toBe(true);
            expect(isValidUrl('http://example.com/path')).toBe(true);
        });

        it('should reject invalid URLs', () => {
            expect(isValidUrl('not-a-url')).toBe(false);
            expect(isValidUrl('ftp://example.com')).toBe(false); // Only http/s allowed
            expect(isValidUrl('')).toBe(false);
            expect(isValidUrl(null)).toBe(false);
        });
    });

    describe('sanitizeText', () => {
        it('should trim whitespace', () => {
            expect(sanitizeText('  hello  ')).toBe('hello');
        });

        it('should truncate long text', () => {
            const longText = 'a'.repeat(100);
            expect(sanitizeText(longText, 50)).toBe('a'.repeat(50));
        });

        it('should handle empty/null inputs', () => {
            expect(sanitizeText(null)).toBe('');
            expect(sanitizeText(undefined)).toBe('');
            expect(sanitizeText('')).toBe('');
        });
    });
});
