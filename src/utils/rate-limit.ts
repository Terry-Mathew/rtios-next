/**
 * Simple In-Memory Rate Limiter
 * 
 * Uses a Map to track request counts within a time window.
 * Useful for limiting sensitive routes like Admin APIs.
 * 
 * note: This storage is ephemeral (resets on server restart).
 */

const trackers = new Map<string, { count: number; expiresAt: number }>();

interface RateLimitConfig {
    interval: number; // Window size in milliseconds
    uniqueTokenPerInterval?: number; // Max unique tokens (simplistic Cleanup)
}

export const rateLimit = (
    checkLimit = 10, // Max requests
    config: RateLimitConfig = { interval: 60 * 1000 } // Default: 1 minute window
) => {
    return {
        check: (token: string) => {
            const now = Date.now();
            const record = trackers.get(token);

            // Cleanup expired
            if (record && now > record.expiresAt) {
                trackers.delete(token);
            }

            const currentRecord = trackers.get(token) || { count: 0, expiresAt: now + config.interval };

            // Increment
            currentRecord.count += 1;

            // Save
            trackers.set(token, currentRecord);

            // Check
            const isRateLimited = currentRecord.count > checkLimit;

            return {
                isRateLimited,
                currentUsage: currentRecord.count,
                limit: checkLimit,
                remaining: Math.max(0, checkLimit - currentRecord.count)
            };
        },
    };
};
