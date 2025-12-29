import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/src/utils/supabase/server';
import { rateLimit } from '@/src/utils/rateLimit';
import { logger } from '@/src/utils/logger';

// Strict rate limit for impersonation: 5 requests per minute per admin IP (or just per admin)
const limiter = rateLimit(5);

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        // 1. Authenticate & Authorize Admin
        // This helper handles checking cookies, checking the DB role, and throwing if invalid.
        // It also returns an 'adminClient' with service_role privileges.
        const { user: adminUser, adminClient } = await getAuthenticatedAdmin();

        // 2. Rate Limit (Per Admin ID)
        const limit = limiter.check(adminUser.id);
        if (limit.isRateLimited) {
            return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 });
        }

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // 3. Get Target User Email
        const { data: targetUser, error: userError } = await adminClient.auth.admin.getUserById(userId);

        if (userError || !targetUser.user?.email) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 4. Generate Magic Link
        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
            type: 'magiclink',
            email: targetUser.user.email,
        });

        if (linkError) {
            throw linkError;
        }

        // 5. Log Audit Trail
        const { error: auditError } = await adminClient
            .from('audit_logs')
            .insert([{
                actor_user_id: adminUser.id,
                action: 'impersonate',
                entity_type: 'user',
                entity_id: userId,
                metadata: { target_email: targetUser.user.email }
            }]);

        if (auditError) {
            logger.error('CRITICAL: Audit log failed', {
                action: 'impersonate_user',
                userId,
                targetEmail: targetUser.user.email,
                adminUserId: adminUser.id,
                error: auditError
            });
            throw new Error('Action aborted: Audit logging failed');
        }

        return NextResponse.json({
            url: linkData.properties.action_link
        });

    } catch (error) {
        console.error('Error generating impersonation link:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';

        if (message.includes('Forbidden') || message.includes('Unauthorized')) {
            return NextResponse.json({ error: message }, { status: 403 });
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
