import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Users, Briefcase, Zap } from 'lucide-react';

async function checkAdminAccess() {
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
    if (!user) return false;

    const { data: betaUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    return betaUser?.role === 'admin';
}

async function getAnalytics() {
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

    // Get signups by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentSignups } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

    // Get jobs by day (last 7 days)
    const { data: recentJobs } = await supabase
        .from('jobs')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

    // Count AI outputs (estimate: job_outputs table)
    const { count: totalOutputs } = await supabase
        .from('job_outputs')
        .select('*', { count: 'exact', head: true });

    // Get most active users (top 5 by job count)
    const { data: allUsers } = await supabase
        .from('users')
        .select('id');

    const userJobCounts = await Promise.all(
        (allUsers || []).map(async (u) => {
            const { count } = await supabase
                .from('jobs')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', u.id);
            return { userId: u.id, count: count || 0 };
        })
    );

    const topUsers = userJobCounts
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return {
        signupsByDay: recentSignups || [],
        jobsByDay: recentJobs || [],
        totalAIOutputs: totalOutputs || 0,
        topUsers
    };
}

export default async function AdminAnalyticsPage() {
    const isAdmin = await checkAdminAccess();

    if (!isAdmin) {
        redirect('/admin');
    }

    const analytics = await getAnalytics();

    // Group signups by day
    const signupCounts = analytics.signupsByDay.reduce((acc: Record<string, number>, signup) => {
        const date = new Date(signup.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});

    // Group jobs by day
    const jobCounts = analytics.jobsByDay.reduce((acc: Record<string, number>, job) => {
        const date = new Date(job.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});

    const totalSignupsLast7Days = Object.values(signupCounts).reduce((a, b) => a + b, 0);
    const totalJobsLast7Days = Object.values(jobCounts).reduce((a, b) => a + b, 0);

    return (
        <div className="min-h-screen bg-surface-base text-text-primary p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center gap-4">
                    <Link
                        href="/admin"
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="font-tiempos text-2xl font-bold">Analytics</h1>
                        <p className="text-sm text-text-secondary mt-1">
                            Usage statistics and insights
                        </p>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-surface-elevated border border-white/10 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-text-secondary text-sm font-interstate uppercase tracking-wider">Signups (7d)</span>
                            <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <p className="text-3xl font-bold">{totalSignupsLast7Days}</p>
                    </div>

                    <div className="bg-surface-elevated border border-white/10 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-text-secondary text-sm font-interstate uppercase tracking-wider">Jobs Created (7d)</span>
                            <Briefcase className="w-5 h-5 text-green-400" />
                        </div>
                        <p className="text-3xl font-bold">{totalJobsLast7Days}</p>
                    </div>

                    <div className="bg-surface-elevated border border-white/10 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-text-secondary text-sm font-interstate uppercase tracking-wider">AI Outputs</span>
                            <Zap className="w-5 h-5 text-yellow-400" />
                        </div>
                        <p className="text-3xl font-bold">{analytics.totalAIOutputs}</p>
                    </div>

                    <div className="bg-surface-elevated border border-white/10 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-text-secondary text-sm font-interstate uppercase tracking-wider">Avg Jobs/User</span>
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                        </div>
                        <p className="text-3xl font-bold">
                            {analytics.topUsers.length > 0
                                ? (analytics.topUsers.reduce((sum, u) => sum + u.count, 0) / analytics.topUsers.length).toFixed(1)
                                : '0'}
                        </p>
                    </div>
                </div>

                {/* Charts Placeholders */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-surface-elevated border border-white/10 rounded-lg p-6">
                        <h3 className="font-tiempos text-lg font-bold mb-4">Daily Signups (Last 7 Days)</h3>
                        <div className="space-y-3">
                            {Object.entries(signupCounts).map(([date, count]) => (
                                <div key={date} className="flex items-center justify-between">
                                    <span className="text-sm text-text-secondary">{date}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-32 h-2 bg-surface-base rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500"
                                                style={{ width: `${(count / Math.max(...Object.values(signupCounts))) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-surface-elevated border border-white/10 rounded-lg p-6">
                        <h3 className="font-tiempos text-lg font-bold mb-4">Daily Jobs Created (Last 7 Days)</h3>
                        <div className="space-y-3">
                            {Object.entries(jobCounts).map(([date, count]) => (
                                <div key={date} className="flex items-center justify-between">
                                    <span className="text-sm text-text-secondary">{date}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-32 h-2 bg-surface-base rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500"
                                                style={{ width: `${(count / Math.max(...Object.values(jobCounts))) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Users */}
                <div className="bg-surface-elevated border border-white/10 rounded-lg p-6">
                    <h3 className="font-tiempos text-lg font-bold mb-4">Most Active Users</h3>
                    <div className="space-y-3">
                        {analytics.topUsers.map((user, index) => (
                            <div key={user.userId} className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                                    {index + 1}
                                </div>
                                <div className="flex-1 flex items-center justify-between">
                                    <span className="text-sm text-text-secondary font-mono">{user.userId.slice(0, 8)}...</span>
                                    <span className="text-sm font-medium">{user.count} jobs</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
