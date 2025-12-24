import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/src/utils/supabase/server';
import { rateLimit } from '@/src/utils/rate-limit';

// Strict rate limiter: 5 deletes per minute (prevent mass wiper)
const limiter = rateLimit(5);

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        // 1. Authenticate Admin & Get Service Client
        const { user: adminUser, adminClient } = await getAuthenticatedAdmin();

        // 2. Rate Limit
        const limit = limiter.check(adminUser.id);
        if (limit.isRateLimited) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // 3. Delete from Auth (requires Service Role)
        const { error } = await adminClient.auth.admin.deleteUser(userId);
        if (error) throw error;

        // 4. Manual cleanup just in case Cascade isn't perfect (safe redundancy)
        await adminClient.from('users').delete().eq('id', userId);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting user:', error);

        const message = error instanceof Error ? error.message : 'Internal Server Error';
        if (message.includes('Forbidden') || message.includes('Unauthorized')) {
            return NextResponse.json({ error: message }, { status: 403 });
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
