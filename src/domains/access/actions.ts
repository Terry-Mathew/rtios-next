'use server';

import { getSupabaseServer } from '@/src/services/supabase';

export type AccessRequestStatus = 'pending' | 'approved' | 'denied';
export type AccessRole = 'beta_user' | 'beta_admin';

const ensureAdmin = async (userId: string) => {
  const client = getSupabaseServer();
  const { data, error } = await client
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  if (error) throw error;
  if (!data || data.role !== 'admin') {
    throw new Error('Forbidden: admin role required');
  }
};

export const submitAccessRequest = async (userId: string, requestedRole: AccessRole, reason?: string, permissions: Record<string, unknown> = {}) => {
  const client = getSupabaseServer();
  const { data, error } = await client
    .from('beta_access_requests')
    .insert([{ user_id: userId, requested_role: requestedRole, reason, permissions }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const listMyAccessRequests = async (userId: string) => {
  const client = getSupabaseServer();
  const { data, error } = await client
    .from('beta_access_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const listPendingAccessRequests = async () => {
  const client = getSupabaseServer();
  const { data, error } = await client
    .from('beta_access_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
};

export const listPendingAccessRequestsPaginated = async ({
  page,
  perPage,
  sortKey,
  sortDir,
  role,
}: {
  page: number;
  perPage: number;
  sortKey: string;
  sortDir: 'asc' | 'desc';
  role?: 'beta_user' | 'beta_admin' | 'all';
}) => {
  const client = getSupabaseServer();
  const from = Math.max(0, (page - 1) * perPage);
  const to = from + perPage - 1;
  let query = client
    .from('beta_access_requests')
    .select('*', { count: 'exact' })
    .eq('status', 'pending')
    .order(sortKey, { ascending: sortDir === 'asc' });
  if (role && role !== 'all') {
    query = query.eq('requested_role', role);
  }
  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { items: data || [], total: count || 0 };
};

export const approveAccessRequest = async (requestId: string, decidedByUserId: string, role: AccessRole = 'beta_user', permissions: Record<string, unknown> = {}) => {
  await ensureAdmin(decidedByUserId);
  const client = getSupabaseServer();
  const { data: req, error: reqErr } = await client
    .from('beta_access_requests')
    .update({ status: 'approved', decided_by: decidedByUserId, decided_at: new Date().toISOString(), permissions })
    .eq('id', requestId)
    .select()
    .single();
  if (reqErr) throw reqErr;
  const { error: userErr } = await client
    .from('users')
    .update({ role: role === 'beta_admin' ? 'admin' : 'user' })
    .eq('id', req.user_id);
  if (userErr) throw userErr;
  await logAudit(decidedByUserId, 'approve', 'beta_access_requests', requestId, { role, permissions });
  return req;
};

export const denyAccessRequest = async (requestId: string, decidedByUserId: string, denialReason?: string) => {
  await ensureAdmin(decidedByUserId);
  const client = getSupabaseServer();
  const { data, error } = await client
    .from('beta_access_requests')
    .update({ status: 'denied', decided_by: decidedByUserId, decided_at: new Date().toISOString(), denial_reason: denialReason })
    .eq('id', requestId)
    .select()
    .single();
  if (error) throw error;
  await logAudit(decidedByUserId, 'deny', 'beta_access_requests', requestId, { denialReason });
  return data;
};

export const listBetaUsers = async () => {
  const client = getSupabaseServer();
  const { data, error } = await client
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const logAudit = async (actorUserId: string, action: string, entityType: string, entityId: string, metadata: Record<string, unknown> = {}) => {
  const client = getSupabaseServer();
  const { error } = await client
    .from('audit_logs')
    .insert([{ actor_user_id: actorUserId, action, entity_type: entityType, entity_id: entityId, metadata }]);
  if (error) throw error;
};

