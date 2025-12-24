import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
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
                        } catch { /* Cookie setting may fail in SSR - safe to ignore */ }
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ isAdmin: false });
        }

        const { data: appUser } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        return NextResponse.json({
            isAdmin: appUser?.role === 'admin'
        });
    } catch (error) {
        console.error('Error checking admin access:', error);
        return NextResponse.json({ isAdmin: false });
    }
}
