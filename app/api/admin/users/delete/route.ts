import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/src/utils/supabase/server';
import { rateLimit, getRateLimitHeaders } from '@/src/utils/rateLimit';
import { logger } from '@/src/utils/logger';
import { validateRequestBody, deleteUserSchema } from '@/src/utils/validation/adminSchemas';

// Strict rate limiter: 5 deletes per minute (prevent mass wiper)
const limiter = rateLimit(5);

export async function POST(request: Request) {
    try {
        // 0. Validate Request Body
        const validation = await validateRequestBody(request, deleteUserSchema);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        const { userId } = validation.data;

        // 1. Authenticate Admin & Get Service Client
        const { user: adminUser, adminClient } = await getAuthenticatedAdmin();

        // 2. Rate Limit
        const limit = limiter.check(adminUser.id);
        const rateLimitHeaders = getRateLimitHeaders(limit);

        if (limit.isRateLimited) {
            return NextResponse.json(
                { error: 'Rate limit exceeded' },
                { status: 429, headers: rateLimitHeaders }
            );
        }

        // userId is already validated by Zod schema

        // 3. Log Audit Trail (before deletion)
        const { error: auditError } = await adminClient
            .from('audit_logs')
            .insert([{
                actor_user_id: adminUser.id,
                action: 'delete',
                entity_type: 'user',
                entity_id: userId,
                metadata: {}
            }]);

        if (auditError) {
            logger.error('CRITICAL: Audit log failed', {
                action: 'delete_user',
                userId,
                adminUserId: adminUser.id,
                error: auditError
            });
            throw new Error('Action aborted: Audit logging failed');
        }

        // 4. Delete from Auth (requires Service Role)
        const { error } = await adminClient.auth.admin.deleteUser(userId);
        if (error) throw error;

        // 5. Manual cleanup just in case Cascade isn't perfect (safe redundancy)
        await adminClient.from('users').delete().eq('id', userId);

        return NextResponse.json(
            { success: true },
            { headers: rateLimitHeaders }
        );

    } catch (error) {
        console.error('Error deleting user:', error);

        const message = error instanceof Error ? error.message : 'Internal Server Error';
        if (message.includes('Forbidden') || message.includes('Unauthorized')) {
            return NextResponse.json({ error: message }, { status: 403 });
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
