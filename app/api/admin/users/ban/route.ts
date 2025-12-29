import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/src/utils/supabase/server';
import { rateLimit, getRateLimitHeaders } from '@/src/utils/rateLimit';
import { logger } from '@/src/utils/logger';
import { validateRequestBody, banUserSchema } from '@/src/utils/validation/adminSchemas';

// Strict rate limiter: 10 bans per minute
const limiter = rateLimit(10);

export async function POST(request: Request) {
    try {
        // 0. Validate Request Body
        const validation = await validateRequestBody(request, banUserSchema);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        const { userId, status } = validation.data;

        // 1. Authenticate Admin
        const { user: adminUser, supabase } = await getAuthenticatedAdmin();

        // 2. Rate Limit
        const limit = limiter.check(adminUser.id);
        const rateLimitHeaders = getRateLimitHeaders(limit);

        if (limit.isRateLimited) {
            return NextResponse.json(
                { error: 'Rate limit exceeded' },
                { status: 429, headers: rateLimitHeaders }
            );
        }

        // userId and status are already validated by Zod schema

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

        return NextResponse.json(
            { success: true },
            { headers: rateLimitHeaders }
        );

    } catch (error) {
        console.error('Error banning user:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';

        if (message.includes('Forbidden') || message.includes('Unauthorized')) {
            return NextResponse.json({ error: message }, { status: 403 });
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
