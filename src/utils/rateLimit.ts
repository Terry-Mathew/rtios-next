/**
 * Rate Limiting Utility for Gemini API Calls
 * Prevents quota abuse by limiting requests per user per time window
 */

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store (upgrade to Redis for production/multi-instance)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configs by operation type
 */
export const RATE_LIMITS = {
    // Expensive operations (with Google Search)
    companyResearch: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
    jobExtraction: { maxRequests: 5, windowMs: 60 * 60 * 1000 },    // 5 per hour

    // Medium operations
    coverLetter: { maxRequests: 20, windowMs: 60 * 60 * 1000 },     // 20 per hour
    linkedInMessage: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
    interviewPrep: { maxRequests: 15, windowMs: 60 * 60 * 1000 },   // 15 per hour

    // Light operations
    resumeExtraction: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
    resumeAnalysis: { maxRequests: 30, windowMs: 60 * 60 * 1000 },   // 30 per hour
} as const;

/**
 * Check if user is within rate limit for operation
 * @throws Error if rate limit exceeded
 */
export async function checkRateLimit(
    userId: string,
    operation: keyof typeof RATE_LIMITS
): Promise<void> {
    const config = RATE_LIMITS[operation];
    const key = `${userId}:${operation}`;
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    // First request or window expired
    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + config.windowMs,
        });
        return;
    }

    // Within window - check count
    if (entry.count >= config.maxRequests) {
        const resetInMinutes = Math.ceil((entry.resetTime - now) / 60000);
        throw new Error(
            `Rate limit exceeded for ${operation}. ` +
            `Maximum ${config.maxRequests} requests per hour. ` +
            `Try again in ${resetInMinutes} minute${resetInMinutes !== 1 ? 's' : ''}.`
        );
    }

    // Increment count
    entry.count += 1;
    rateLimitStore.set(key, entry);
}

/**
 * Get current rate limit status for user
 */
export function getRateLimitStatus(userId: string, operation: keyof typeof RATE_LIMITS) {
    const config = RATE_LIMITS[operation];
    const key = `${userId}:${operation}`;
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
        return {
            remaining: config.maxRequests,
            resetAt: new Date(now + config.windowMs),
            limit: config.maxRequests,
        };
    }

    return {
        remaining: Math.max(0, config.maxRequests - entry.count),
        resetAt: new Date(entry.resetTime),
        limit: config.maxRequests,
    };
}

/**
 * Clear rate limits for a user (admin function)
 */
export function clearRateLimit(userId: string, operation?: keyof typeof RATE_LIMITS) {
    if (operation) {
        rateLimitStore.delete(`${userId}:${operation}`);
    } else {
        // Clear all operations for user
        for (const key of rateLimitStore.keys()) {
            if (key.startsWith(`${userId}:`)) {
                rateLimitStore.delete(key);
            }
        }
    }
}

// Cleanup expired entries every 10 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of rateLimitStore.entries()) {
            if (now > entry.resetTime) {
                rateLimitStore.delete(key);
            }
        }
    }, 10 * 60 * 1000);
}
