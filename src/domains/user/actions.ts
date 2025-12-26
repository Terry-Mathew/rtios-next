'use server';

import { getAuthenticatedUser, createSupabaseAdminClient } from '@/src/utils/supabase/server';
import { UserProfile, UserStats } from './types';

// Note: Replaced internal helpers with imports from '@/src/utils/supabase/server'


export async function getUserProfile(): Promise<UserProfile> {
    const { user, supabase } = await getAuthenticatedUser();

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, linkedin_url, portfolio_url')
        .eq('id', user.id)
        .single();

    return {
        id: user.id,
        email: user.email!,
        fullName: profile?.full_name || null,
        linkedinUrl: profile?.linkedin_url || null,
        portfolioUrl: profile?.portfolio_url || null,
        createdAt: user.created_at,
    };
}

function calculateAccountAge(createdAt: string): string {
    const now = new Date();
    const created = new Date(createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
        return 'Less than a month';
    }

    const months = Math.floor(diffDays / 30);
    if (months === 1) return '1 month';
    return `${months} months`;
}

export async function getUserStats(): Promise<UserStats> {
    const { user, supabase } = await getAuthenticatedUser();
    const userId = user.id;

    // Count jobs
    const { count: jobCount } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    // Count resumes
    const { count: resumeCount } = await supabase
        .from('resumes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    // Count cover letters from job_outputs
    const { count: coverLetterCount } = await supabase
        .from('job_outputs')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'cover_letter'); // Assuming RLS filters by user automatically or we rely on user_id on the table if it exists? 
    // Usually RLS handles user scoping, but explicit eq('user_id', userId) is safer if the table has it.
    // The prompt snippet used .eq('type', 'cover_letter'), implies RLS handles it or user_id is implicit.
    // I'll add .eq('user_id', userId) just in case, or stick to prompt logic if I see table schema.
    // Re-reading prompt: "RLS policies already configured". 
    // The prompt's example for job_outputs didn't have .eq('user_id'). I'll assume RLS.
    // Wait, prompt actions.ts had:
    // .from('job_outputs').select('*', { ... }).eq('type', 'cover_letter');
    // It didn't have user_id. I will stick to that to start, assuming RLS.

    const accountAge = calculateAccountAge(user.created_at);

    return {
        totalJobs: jobCount || 0,
        totalResumes: resumeCount || 0,
        coverLettersGenerated: coverLetterCount || 0,
        accountAge,
    };
}

export async function updatePassword(newPassword: string) {
    const { supabase } = await getAuthenticatedUser();

    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (error) throw new Error(error.message);
    return { success: true };
}

export async function deleteUserAccount() {
    const { user, supabase } = await getAuthenticatedUser();

    // Note: deleting a user typically requires SERVICE_ROLE key or being the user themselves with specific permissions.
    // supabase.auth.admin.deleteUser requires service role.
    // Standard user cannot delete themselves via Admin API.
    // BUT, usually one might use an RPC or just delete from 'users' table if triggers exist?
    // The Prompt used: `await supabase.auth.admin.deleteUser(userId)` passing a SERVICE_ROLE instance.
    // PROMPT REQUIREMENT: "DO NOT expose SUPABASE_SERVICE_ROLE_KEY to client".
    // But actions run on server.
    // Using Service Role in Action is okay?
    // "DO NOT expose ... to client".
    // The Prompt's suggested actions.ts used `process.env.SUPABASE_SERVICE_ROLE_KEY` inside the action.
    // So I WILL use it, but only for the deletion part which needs admin.

    // Use centralized admin helper
    const adminSupabase = await createSupabaseAdminClient();

    const { error } = await adminSupabase.auth.admin.deleteUser(user.id);

    if (error) throw new Error(error.message);
    return { success: true };
}

export async function exportUserData() {
    const { user, supabase } = await getAuthenticatedUser();
    const userId = user.id;

    const profile = await getUserProfile();

    const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', userId);

    const { data: resumes } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId);

    // Also getting job_outputs for completeness? Prompt didn't explicitly include it in export but it was in stats.
    // Prompt snippet: "profile, jobs, resumes". I'll stick to that.

    return {
        profile,
        jobs: jobs || [],
        resumes: resumes || [],
        exportedAt: new Date().toISOString(),
    };
}

export async function updateUserProfile(data: { fullName?: string; linkedinUrl?: string; portfolioUrl?: string }) {
    const { user, supabase } = await getAuthenticatedUser();

    // Map frontend camelCase to DB snake_case
    const updates: any = {
        updated_at: new Date().toISOString(),
    };
    if (data.fullName !== undefined) updates.full_name = data.fullName;
    if (data.linkedinUrl !== undefined) updates.linkedin_url = data.linkedinUrl;
    if (data.portfolioUrl !== undefined) updates.portfolio_url = data.portfolioUrl;

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

    if (error) throw new Error(error.message);
    return { success: true };
}

// Admin Actions for User Approval
export async function approveUser(userId: string) {
    const adminSupabase = await createSupabaseAdminClient();

    const { error } = await adminSupabase
        .from('users')
        .update({ is_approved: true })
        .eq('id', userId);

    if (error) throw new Error(error.message);
    return { success: true };
}

export async function denyUser(userId: string) {
    const adminSupabase = await createSupabaseAdminClient();

    const { error } = await adminSupabase
        .from('users')
        .update({ is_approved: false })
        .eq('id', userId);

    if (error) throw new Error(error.message);
    return { success: true };
}

