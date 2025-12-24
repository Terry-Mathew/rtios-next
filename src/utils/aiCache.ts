/**
 * Simple LRU Cache for Gemini API Responses
 * Reduces API calls for repeated requests
 */

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

class LRUCache<T> {
    private cache = new Map<string, CacheEntry<T>>();
    private maxSize: number;
    private ttlMs: number;

    constructor(maxSize: number = 100, ttlMs: number = 60 * 60 * 1000) {
        this.maxSize = maxSize;
        this.ttlMs = ttlMs;
    }

    set(key: string, value: T, customTTL?: number): void {
        const expiresAt = Date.now() + (customTTL || this.ttlMs);

        // Remove oldest entry if at capacity
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            const firstKey = this.cache.keys().next().value as string | undefined;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }

        // Delete and re-add to maintain LRU order
        this.cache.delete(key);
        this.cache.set(key, { value, expiresAt });
    }

    get(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) return null;

        // Check expiration
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, entry);

        return entry.value;
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}

/**
 * Cache instances for different AI operations
 */
export const aiCache = {
    // Company research - 24 hour TTL (research doesn't change often)
    companyResearch: new LRUCache(50, 24 * 60 * 60 * 1000),

    // Resume analysis - 1 hour TTL (same resume + job should be cached)
    resumeAnalysis: new LRUCache(100, 60 * 60 * 1000),

    // Job extraction - 24 hour TTL (job postings don't change often)
    jobExtraction: new LRUCache(100, 24 * 60 * 60 * 1000),

    // Interview questions - 6 hour TTL
    interviewPrep: new LRUCache(50, 6 * 60 * 60 * 1000),

    // Cover letters and LinkedIn messages - NOT CACHED (too personalized)
};

/**
 * Generate cache key from request parameters
 */
export function generateCacheKey(operation: string, params: Record<string, unknown>): string {
    // Sort keys for consistent hashing
    const sortedKeys = Object.keys(params).sort();
    const normalizedParams = sortedKeys.map(k => `${k}:${params[k]}`).join('|');
    return `${operation}::${normalizedParams}`;
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
    aiCache.companyResearch.clear();
    aiCache.resumeAnalysis.clear();
    aiCache.jobExtraction.clear();
    aiCache.interviewPrep.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
    return {
        companyResearch: aiCache.companyResearch.size(),
        resumeAnalysis: aiCache.resumeAnalysis.size(),
        jobExtraction: aiCache.jobExtraction.size(),
        interviewPrep: aiCache.interviewPrep.size(),
    };
}
