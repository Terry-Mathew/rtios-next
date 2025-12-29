'use server';

/**
 * Job Creation Rate Limiter
 * Free tier: 2 jobs LIFETIME (not renewable)
 * Admin: Unlimited
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export interface JobLimitResult {
    allowed: boolean;
    totalUsed: number;
    totalAllowed: number;
    message?: string;
    isAdmin?: boolean;
}

/**
 * Check if user can create a new job application
 * Enforces lifetime limit of 2 jobs for free tier
 */
export async function checkJobCreationLimit(): Promise<JobLimitResult> {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch { /* Cookie setting may fail in SSR - safe to ignore */ }
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {
            allowed: false,
            totalUsed: 0,
            totalAllowed: 2,
            message: 'Please sign in to continue'
        };
    }

    // Check if admin (unlimited access)
    const { data: appUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    const isAdmin = appUser?.role === 'admin';

    if (isAdmin) {
        return {
            allowed: true,
            totalUsed: 0,
            totalAllowed: 999,
            message: 'Admin: Unlimited access',
            isAdmin: true
        };
    }

    // Count total jobs created by this user (LIFETIME)
    const { count: jobCount } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    const totalUsed = jobCount || 0;
    const totalAllowed = 2;

    if (totalUsed >= totalAllowed) {
        return {
            allowed: false,
            totalUsed,
            totalAllowed,
            message: `You have used all ${totalAllowed} free job applications. Upgrade for unlimited access!`,
            isAdmin: false
        };
    }

    return {
        allowed: true,
        totalUsed,
        totalAllowed,
        isAdmin: false
    };
}

/**
 * Get current usage stats for display
 */
export async function getJobUsageStats(): Promise<JobLimitResult> {
    return checkJobCreationLimit();
}
