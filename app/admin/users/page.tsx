import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ArrowLeft, Users, Shield, RotateCcw, Eye } from 'lucide-react';
import Link from 'next/link';

// Client Components
import { UpgradeUserButton } from '@/app/admin/users/UpgradeUserButton';
import { ResetUsageButton } from '@/app/admin/users/ResetUsageButton';
import { ImpersonateButton } from '@/app/admin/users/ImpersonateButton';
import { BanUserButton } from '@/app/admin/users/BanUserButton';
import { DeleteUserButton } from '@/app/admin/users/DeleteUserButton';

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

async function getUsersWithUsage() {
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

    // Get all users
    const { data: appUsers } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

    if (!appUsers) return [];

    // Get job counts and EMAIL for each user
    // Note: We need email from auth.users (via admin usage in API or just rely on what we have)
    // IMPORTANT: public.users has 'email' column from our sync setup.
    const usersWithData = await Promise.all(
        appUsers.map(async (user) => {
            // Get job count
            const { count: jobCount } = await supabase
                .from('jobs')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            return {
                ...user,
                user_id: user.id, // compatibility
                jobs_created: jobCount || 0
            };
        })
    );

    return usersWithData;
}

export default async function UserManagement() {
    const isAdmin = await checkAdminAccess();

    if (!isAdmin) {
        redirect('/');
    }

    const users = await getUsersWithUsage();

    return (
        <div className="min-h-screen bg-app-dark p-8 font-interstate">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin"
                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-text-secondary" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-tiempos text-text-primary">User Management</h1>
                        <p className="text-text-secondary">Total users: {users.length}</p>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-surface-base border border-white/10 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Email</th>
                                    <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Role</th>
                                    <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Jobs Created</th>
                                    <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Joined</th>
                                    <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {users.map((user) => {
                                    const isAtLimit = user.jobs_created >= 2;
                                    const isUserAdmin = user.role === 'admin';

                                    return (
                                        <tr key={user.user_id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10">
                                                        <Users className="w-4 h-4 text-text-secondary" />
                                                    </div>
                                                    <span className="font-medium text-text-primary">{user.email}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${isUserAdmin
                                                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-text-primary">
                                                <span className={!isUserAdmin && isAtLimit ? 'text-red-400 font-bold' : ''}>
                                                    {user.jobs_created}
                                                </span>
                                                <span className="text-text-secondary">/2</span>
                                            </td>
                                            <td className="p-4">
                                                {isUserAdmin ? (
                                                    <span className="text-green-400 text-xs font-bold uppercase">Unlimited</span>
                                                ) : isAtLimit ? (
                                                    <span className="text-red-400 text-xs font-bold uppercase">Limit Reached</span>
                                                ) : (
                                                    <span className="text-yellow-400 text-xs font-bold uppercase">Active</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-text-secondary text-sm">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2 items-center">
                                                    <UpgradeUserButton userId={user.id} currentRole={user.role} />

                                                    {/* Admin Tools for Non-Admin Users */}
                                                    {!isUserAdmin && (
                                                        <>
                                                            <ResetUsageButton userId={user.id} />
                                                            <ImpersonateButton userId={user.id} />
                                                            <div className="w-px h-4 bg-white/10 mx-1"></div>
                                                            <BanUserButton userId={user.id} currentStatus={user.status || 'active'} />
                                                            <DeleteUserButton userId={user.id} />
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {users.length === 0 && (
                        <div className="p-12 text-center text-text-secondary">
                            <p>No users found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
