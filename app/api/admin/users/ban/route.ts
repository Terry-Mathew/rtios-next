import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { userId, status } = await request.json(); // status: 'active' | 'banned'
        const cookieStore = await cookies();

        // 1. Verify Admin Access
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
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: admin } = await supabase.from('users').select('role').eq('id', user.id).single();
        if (admin?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Update User Status
        const { error } = await supabase
            .from('users')
            .update({ status })
            .eq('id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error banning user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
