import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Users, Activity, Settings, Shield } from 'lucide-react';

async function checkAdminAccess() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch { }
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

async function getAdminStats() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch { }
                },
            },
        }
    );

    // Total users
    const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

    // Total jobs
    const { count: totalJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true });

    // Pending requests
    const { count: pendingRequests } = await supabase
        .from('access_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    // Users at limit
    const { data: allUsers } = await supabase
        .from('users')
        .select('id');

    let usersAtLimit = 0;
    if (allUsers) {
        for (const user of allUsers) {
            const { count } = await supabase
                .from('jobs')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);
            if (count && count >= 2) usersAtLimit++;
        }
    }

    return {
        totalUsers: totalUsers || 0,
        totalJobs: totalJobs || 0,
        pendingRequests: pendingRequests || 0,
        usersAtLimit
    };
}

export default async function AdminDashboard() {
    const isAdmin = await checkAdminAccess();

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-surface-base text-text-primary flex items-center justify-center p-6">
                <div className="max-w-md text-center">
                    <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="font-tiempos text-2xl font-bold mb-2">Access Denied</h1>
                    <p className="text-text-secondary mb-6">
                        You must be an admin to access this page.
                    </p>
                    <Link
                        href="/app"
                        className="inline-block bg-accent hover:bg-accent/90 text-surface-base px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const stats = await getAdminStats();

    return (
        <div className="min-h-screen bg-surface-base text-text-primary p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="font-tiempos text-3xl font-bold mb-2">Admin Dashboard</h1>
                    <p className="text-text-secondary">
                        System overview and management
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-surface-elevated border border-white/10 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-text-secondary text-sm font-interstate uppercase tracking-wider">Total Users</span>
                            <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <p className="text-3xl font-bold">{stats.totalUsers}</p>
                    </div>

                    <div className="bg-surface-elevated border border-white/10 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-text-secondary text-sm font-interstate uppercase tracking-wider">Total Jobs</span>
                            <Activity className="w-5 h-5 text-green-400" />
                        </div>
                        <p className="text-3xl font-bold">{stats.totalJobs}</p>
                    </div>

                    <div className="bg-surface-elevated border border-white/10 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-text-secondary text-sm font-interstate uppercase tracking-wider">Pending Requests</span>
                            <Shield className="w-5 h-5 text-yellow-400" />
                        </div>
                        <p className="text-3xl font-bold">{stats.pendingRequests}</p>
                    </div>

                    <div className="bg-surface-elevated border border-white/10 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-text-secondary text-sm font-interstate uppercase tracking-wider">Users at Limit</span>
                            <Settings className="w-5 h-5 text-red-400" />
                        </div>
                        <p className="text-3xl font-bold">{stats.usersAtLimit}</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link
                        href="/admin/users"
                        className="bg-surface-elevated border border-white/10 rounded-lg p-6 hover:bg-white/5 transition-colors"
                    >
                        <Users className="w-8 h-8 text-blue-400 mb-3" />
                        <h3 className="font-tiempos text-lg font-bold mb-2">User Management</h3>
                        <p className="text-sm text-text-secondary">
                            View all users, manage roles, reset usage limits
                        </p>
                    </Link>

                    <Link
                        href="/admin/requests"
                        className="bg-surface-elevated border border-white/10 rounded-lg p-6 hover:bg-white/5 transition-colors"
                    >
                        <Shield className="w-8 h-8 text-yellow-400 mb-3" />
                        <h3 className="font-tiempos text-lg font-bold mb-2">Beta Requests</h3>
                        <p className="text-sm text-text-secondary">
                            Approve or deny pending access requests
                        </p>
                    </Link>

                    <Link
                        href="/admin/analytics"
                        className="bg-surface-elevated border border-white/10 rounded-lg p-6 hover:bg-white/5 transition-colors"
                    >
                        <Activity className="w-8 h-8 text-green-400 mb-3" />
                        <h3 className="font-tiempos text-lg font-bold mb-2">Analytics</h3>
                        <p className="text-sm text-text-secondary">
                            Usage stats, signups, and AI generation metrics
                        </p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
