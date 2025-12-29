import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/src/utils/supabase/server';
import { rateLimit } from '@/src/utils/rateLimit';
import { logger } from '@/src/utils/logger';

// Strict rate limiter: 10 bans per minute
const limiter = rateLimit(10);

export async function POST(request: Request) {
    try {
        const { userId, status } = await request.json(); // status: 'active' | 'banned'

        // 1. Authenticate Admin
        const { user: adminUser, supabase } = await getAuthenticatedAdmin();

        // 2. Rate Limit
        const limit = limiter.check(adminUser.id);
        if (limit.isRateLimited) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }

        if (!userId || !status) {
            return NextResponse.json({ error: 'Missing userId or status' }, { status: 400 });
        }

        // 3. Update User Status
        const { error } = await supabase
            .from('users')
            .update({ status })
            .eq('id', userId);

        if (error) throw error;

        // 4. Log Audit Trail
        const { error: auditError } = await supabase
            .from('audit_logs')
            .insert([{
                actor_user_id: adminUser.id,
                action: status === 'banned' ? 'ban' : 'unban',
                entity_type: 'user',
                entity_id: userId,
                metadata: { status }
            }]);

        if (auditError) {
            logger.error('CRITICAL: Audit log failed', {
                action: status === 'banned' ? 'ban_user' : 'unban_user',
                userId,
                status,
                adminUserId: adminUser.id,
                error: auditError
            });
            throw new Error('Action aborted: Audit logging failed');
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error banning user:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';

        if (message.includes('Forbidden') || message.includes('Unauthorized')) {
            return NextResponse.json({ error: message }, { status: 403 });
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
