import { listPendingAccessRequestsPaginated, approveAccessRequest, denyAccessRequest } from '@/src/domains/access/actions';
import { revalidatePath } from 'next/cache';
import React from 'react';
import { ToastContainer } from '@/src/components/ui/ToastContainer';
import { cookies } from 'next/headers';
import { getSupabaseServer } from '@/src/services/supabase';
import { RealtimeRefresher, RowActions } from './ClientComponents';

async function approveRequestAction(id: string, decidedBy: string, role: 'beta_user' | 'beta_admin') {
  'use server';
  await approveAccessRequest(id, decidedBy, role);
  revalidatePath('/admin/requests');
}

async function denyRequestAction(id: string, decidedBy: string, reason: string) {
  'use server';
  await denyAccessRequest(id, decidedBy, reason);
  revalidatePath('/admin/requests');
}

interface AccessRequest {
  id: string;
  user_id: string;
  requested_role: 'beta_user' | 'beta_admin';
  created_at: string;
  status: string;
}

export default async function AdminRequestsPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const resolvedSearchParams = await searchParams;
  const token = (await cookies()).get('sb-access-token')?.value;
  let actorId: string | null = null;
  if (token) {
    try {
      const b64 = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
      if (b64) {
        const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
        actorId = payload?.sub ?? null;
      }
    } catch { }
  }
  let isAdmin = false;
  if (actorId) {
    const client = getSupabaseServer();
    const { data } = await client
      .from('beta_users')
      .select('role')
      .eq('user_id', actorId)
      .single();
    isAdmin = !!data && data.role === 'beta_admin';
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-surface-base text-text-primary p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-tiempos text-2xl font-bold">Access Restricted</h1>
          <p className="font-interstate text-sm text-text-secondary mt-2">You must be a beta admin to view this page.</p>
        </div>
      </div>
    );
  }
  const page = Number(resolvedSearchParams?.page || 1);
  const perPage = Number(resolvedSearchParams?.perPage || 25);
  const filterRole = resolvedSearchParams?.role || 'all';
  const sortKey = resolvedSearchParams?.sort || 'created_at';
  const sortDir = (resolvedSearchParams?.dir || 'asc') as 'asc' | 'desc';

  const { items: pageItems, total } = await listPendingAccessRequestsPaginated({
    page,
    perPage,
    sortKey,
    sortDir,
    role: filterRole as 'beta_user' | 'beta_admin' | 'all',
  });
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const currentQuery = new URLSearchParams({ page: String(page), perPage: String(perPage), role: filterRole, sort: sortKey, dir: sortDir }).toString();

  return (
    <div className="min-h-screen bg-surface-base text-text-primary p-6">
      <RealtimeRefresher />
      <div className="max-w-6xl mx-auto space-y-4">
        <ToastContainer />
        <div className="flex items-center justify-between">
          <h1 className="font-tiempos text-2xl font-bold">Pending Access Requests</h1>
          <div className="font-interstate text-xs text-text-secondary">
            Total: {total} • Page {page}
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <form className="flex gap-3">
            <select name="role" defaultValue={filterRole} className="bg-surface-elevated border border-white/10 rounded px-3 py-2 text-sm">
              <option value="all">All Roles</option>
              <option value="beta_user">Beta User</option>
              <option value="beta_admin">Beta Admin</option>
            </select>
            <select name="sort" defaultValue={sortKey} className="bg-surface-elevated border border-white/10 rounded px-3 py-2 text-sm">
              <option value="created_at">Submission Date</option>
              <option value="requested_role">Request Type</option>
              <option value="user_id">Requester</option>
            </select>
            <select name="dir" defaultValue={sortDir} className="bg-surface-elevated border border-white/10 rounded px-3 py-2 text-sm">
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
            <input type="hidden" name="page" value="1" />
            <button className="bg-accent text-surface-base rounded px-3 py-2 text-xs font-bold">Apply</button>
          </form>
        </div>

        <div className="bg-surface-elevated border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-3">Requester</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Submitted</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((r: AccessRequest) => (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="p-3">{r.user_id}</td>
                  <td className="p-3">{r.requested_role}</td>
                  <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3">{r.status}</td>
                  <td className="p-3">
                    <RowActions id={r.id} defaultRole={r.requested_role} approveAction={approveRequestAction} denyAction={denyRequestAction} query={currentQuery} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <form>
            <input type="hidden" name="page" value={Math.max(1, page - 1)} />
            <input type="hidden" name="role" value={filterRole} />
            <input type="hidden" name="sort" value={sortKey} />
            <input type="hidden" name="dir" value={sortDir} />
            <button className="bg-white/10 hover:bg-white/20 rounded px-3 py-2 text-xs">Previous</button>
          </form>
          <div className="flex items-center gap-2">
            {Array.from({ length: pageCount }).map((_, i) => {
              const p = i + 1;
              return (
                <form key={p}>
                  <input type="hidden" name="page" value={p} />
                  <input type="hidden" name="role" value={filterRole} />
                  <input type="hidden" name="sort" value={sortKey} />
                  <input type="hidden" name="dir" value={sortDir} />
                  <input type="hidden" name="perPage" value={perPage} />
                  <button className={`rounded px-2 py-1 text-xs ${p === page ? 'bg-accent text-surface-base' : 'bg-white/10 hover:bg-white/20'}`}>{p}</button>
                </form>
              );
            })}
          </div>
          <form>
            <input type="hidden" name="page" value={Math.min(pageCount, page + 1)} />
            <input type="hidden" name="role" value={filterRole} />
            <input type="hidden" name="sort" value={sortKey} />
            <input type="hidden" name="dir" value={sortDir} />
            <input type="hidden" name="perPage" value={perPage} />
            <button className="bg-white/10 hover:bg-white/20 rounded px-3 py-2 text-xs">Next</button>
          </form>
        </div>

        <div className="space-y-2">
          {pageItems.map((r: AccessRequest) => (
            <details key={`${r.id}-details`} className="bg-surface-elevated border border-white/10 rounded-lg p-4">
              <summary className="cursor-pointer font-interstate text-xs uppercase text-text-secondary">
                Request {r.id} details
              </summary>
              <pre className="mt-2 text-xs bg-surface-base p-3 rounded">{JSON.stringify(r, null, 2)}</pre>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
