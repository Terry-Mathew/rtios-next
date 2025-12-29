import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/src/utils/supabase/server';
import { rateLimit } from '@/src/utils/rateLimit';
import { logger } from '@/src/utils/logger';

// Strict rate limiter: 5 deletes per minute
const limiter = rateLimit(5);

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();

        // 1. Authenticate Admin
        const { user: adminUser, supabase } = await getAuthenticatedAdmin();

        // 2. Rate Limit
        const limit = limiter.check(adminUser.id);
        if (limit.isRateLimited) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // 3. Get job count before deletion (for audit log)
        const { count } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        // 4. Reset Usage (Delete all jobs)
        const { error } = await supabase
            .from('jobs')
            .delete()
            .eq('user_id', userId);

        if (error) {
            console.error('Error resetting user usage:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 5. Log Audit Trail
        const { error: auditError } = await supabase
            .from('audit_logs')
            .insert([{
                actor_user_id: adminUser.id,
                action: 'reset_usage',
                entity_type: 'user',
                entity_id: userId,
                metadata: { jobs_deleted: count || 0 }
            }]);

        if (auditError) {
            logger.error('CRITICAL: Audit log failed', {
                action: 'reset_user_usage',
                userId,
                jobsDeleted: count || 0,
                adminUserId: adminUser.id,
                error: auditError
            });
            throw new Error('Action aborted: Audit logging failed');
        }

        return NextResponse.json({
            success: true,
            message: 'User job count reset successfully. All jobs deleted.'
        });
    } catch (error) {
        console.error('Error in reset-usage API:', error);

        const message = error instanceof Error ? error.message : 'Internal server error';
        if (message.includes('Forbidden') || message.includes('Unauthorized')) {
            return NextResponse.json({ error: message }, { status: 403 });
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
