import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();
        const cookieStore = await cookies();

        // 1. Verify Admin Access (using Standard Client)
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

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { data: admin } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (admin?.role !== 'admin') {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        // 2. Generate Magic Link (using Service Role Client)
        // We need service_role to generate links for OTHER users
        const supabaseAdmin = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!,
            {
                cookies: {
                    getAll: () => [],
                    setAll: () => { },
                },
            }
        );

        // Get the user's email first
        const { data: targetUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

        if (userError || !targetUser.user?.email) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: targetUser.user.email,
        });

        if (linkError) {
            throw linkError;
        }

        return NextResponse.json({
            url: linkData.properties.action_link
        });

    } catch (error) {
        console.error('Error generating impersonation link:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
    }
}
