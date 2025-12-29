import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/src/utils/supabase/server';
import { rateLimit, getRateLimitHeaders } from '@/src/utils/rateLimit';
import { logger } from '@/src/utils/logger';
import { validateRequestBody, upgradeUserSchema } from '@/src/utils/validation/adminSchemas';

// Moderate rate limit: 20 upgrades per minute
const limiter = rateLimit(20);

export async function POST(request: NextRequest) {
    try {
        // 0. Validate Request Body
        const validation = await validateRequestBody(request, upgradeUserSchema);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        const { userId, role } = validation.data;

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

        // userId and role are already validated by Zod schema (only 'user' or 'admin' allowed)

        // 4. Update User Role
        const { error } = await supabase
            .from('users')
            .update({ role })
            .eq('id', userId);

        if (error) {
            console.error('Error updating user role:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 5. Log Audit Trail
        const { error: auditError } = await supabase
            .from('audit_logs')
            .insert([{
                actor_user_id: adminUser.id,
                action: 'upgrade_role',
                entity_type: 'user',
                entity_id: userId,
                metadata: { new_role: role }
            }]);

        if (auditError) {
            logger.error('CRITICAL: Audit log failed', {
                action: 'upgrade_user_role',
                userId,
                newRole: role,
                adminUserId: adminUser.id,
                error: auditError
            });
            throw new Error('Action aborted: Audit logging failed');
        }

        return NextResponse.json(
            { success: true, message: `User role updated to ${role}` },
            { headers: rateLimitHeaders }
        );
    } catch (error) {
        console.error('Error in upgrade-user API:', error);

        const message = error instanceof Error ? error.message : 'Internal server error';
        if (message.includes('Forbidden') || message.includes('Unauthorized')) {
            return NextResponse.json({ error: message }, { status: 403 });
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
