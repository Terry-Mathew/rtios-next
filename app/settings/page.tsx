import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserProfile, getUserStats } from '@/src/domains/user/actions';
import SettingsView from '@/src/features/Settings/SettingsView';

export default async function SettingsPage() {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('[SettingsPage] User Check:', { user: user?.id, error: authError });

    if (!user) {
        console.log('[SettingsPage] No user found, redirecting to /');
        redirect('/');
    }

    // Fetch data in parallel
    const [profile, stats] = await Promise.all([
        getUserProfile(),
        getUserStats(),
    ]);

    return <SettingsView profile={profile} stats={stats} />;
}
