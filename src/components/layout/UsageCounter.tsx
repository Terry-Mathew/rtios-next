'use client';

import { useEffect, useState } from 'react';
import { getJobUsageStats, type JobLimitResult } from '@/src/utils/jobLimiter';
import { Zap } from 'lucide-react';

export default function UsageCounter() {
    const [usage, setUsage] = useState<JobLimitResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        getJobUsageStats()
            .then((limit) => {
                if (isMounted) {
                    setUsage(limit);
                    setIsLoading(false);
                }
            })
            .catch((err) => {
                console.error('Failed to get usage stats:', err);
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    // Refresh on job count changes (listen to custom event)
    useEffect(() => {
        const handleJobAdded = () => {
            getJobUsageStats().then(setUsage);
        };

        window.addEventListener('job-added', handleJobAdded);
        return () => window.removeEventListener('job-added', handleJobAdded);
    }, []);

    if (isLoading || !usage) return null;

    // Don't show for admin
    if (usage.isAdmin) return null;

    const percentage = (usage.totalUsed / usage.totalAllowed) * 100;
    const isLimitReached = usage.totalUsed >= usage.totalAllowed;
    const remaining = usage.totalAllowed - usage.totalUsed;

    return (
        <div className="px-4 py-3 border-b border-white/5">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-secondary font-interstate uppercase tracking-wider">
                    Free Trial
                </span>
                <span className="text-xs font-medium text-text-primary font-interstate">
                    {usage.totalUsed}/{usage.totalAllowed} jobs
                </span>
            </div>

            <div className="h-1.5 bg-surface-base rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-300 ${isLimitReached
                            ? 'bg-red-500'
                            : percentage >= 50
                                ? 'bg-yellow-500'
                                : 'bg-accent'
                        }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>

            {!isLimitReached && remaining > 0 && (
                <p className="mt-2 text-xs text-text-secondary font-interstate">
                    {remaining} application{remaining !== 1 ? 's' : ''} remaining
                </p>
            )}

            {isLimitReached && (
                <button
                    onClick={() => window.location.href = '/pricing'}
                    className="mt-3 w-full text-xs bg-accent/10 hover:bg-accent/20 text-accent py-2 rounded transition-colors flex items-center justify-center gap-1.5 font-interstate font-medium"
                >
                    <Zap className="w-3.5 h-3.5" />
                    Upgrade to Pro
                </button>
            )}
        </div>
    );
}
