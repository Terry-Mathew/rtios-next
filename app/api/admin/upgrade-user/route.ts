import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { userId, role } = await request.json();

        if (!userId || !role) {
            return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 });
        }

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

        // Verify admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: admin } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (admin?.role !== 'admin') {
            return NextResponse.json({ error: 'Not authorized - Admin access required' }, { status: 403 });
        }

        // Update user role
        const { error } = await supabase
            .from('users')
            .update({ role })
            .eq('id', userId);

        if (error) {
            console.error('Error updating user role:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: `User role updated to ${role}` });
    } catch (error) {
        console.error('Error in upgrade-user API:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}
