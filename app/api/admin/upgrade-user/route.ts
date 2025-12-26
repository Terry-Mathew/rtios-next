import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/src/utils/supabase/server';
import { rateLimit } from '@/src/utils/rateLimit';

// Moderate rate limit: 20 upgrades per minute
const limiter = rateLimit(20);

export async function POST(request: NextRequest) {
    try {
        const { userId, role } = await request.json();

        // 1. Authenticate Admin
        const { user: adminUser, supabase } = await getAuthenticatedAdmin();

        // 2. Rate Limit
        const limit = limiter.check(adminUser.id);
        if (limit.isRateLimited) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }

        if (!userId || !role) {
            return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 });
        }

        // 3. Validate role
        const validRoles = ['user', 'admin'];
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

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
        await supabase
            .from('audit_logs')
            .insert([{
                actor_user_id: adminUser.id,
                action: 'upgrade_role',
                entity_type: 'user',
                entity_id: userId,
                metadata: { new_role: role }
            }]);

        return NextResponse.json({ success: true, message: `User role updated to ${role}` });
    } catch (error) {
        console.error('Error in upgrade-user API:', error);

        const message = error instanceof Error ? error.message : 'Internal server error';
        if (message.includes('Forbidden') || message.includes('Unauthorized')) {
            return NextResponse.json({ error: message }, { status: 403 });
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
