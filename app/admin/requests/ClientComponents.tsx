'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { realtime, supabaseBrowser } from '@/src/services/supabase';
import { useToastStore } from '@/src/stores/toastStore';

export function RealtimeRefresher() {
  const router = useRouter();
  useEffect(() => {
    const sub = realtime.subscribeToBetaRequests(() => {
      router.refresh();
    });
    return () => {
      try { sub.unsubscribe(); } catch { /* Unsubscribe may fail - safe to ignore */ }
    };
  }, [router]);
  return null;
}

export function RowActions({ id, defaultRole, approveAction, denyAction, query }: { id: string, defaultRole: 'beta_user' | 'beta_admin', approveAction: (id: string, decidedBy: string, role: 'beta_user' | 'beta_admin') => Promise<void>, denyAction: (id: string, decidedBy: string, reason: string) => Promise<void>, query: string }) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [role, setRole] = useState<'beta_user' | 'beta_admin'>(defaultRole);
  const [reason, setReason] = useState('');
  const [pending, startTransition] = useTransition();
  const [actorUserId, setActorUserId] = useState<string | null>(null);

  useEffect(() => {
    supabaseBrowser.auth.getUser().then((res: { data: { user: { id: string } | null } }) => {
      setActorUserId(res.data.user?.id ?? null);
    }).catch(() => setActorUserId(null));
  }, []);

  const onApprove = async () => {
    const ok = typeof window !== 'undefined' ? window.confirm('Approve this request?') : true;
    if (!ok) return;
    if (!actorUserId) {
      addToast({ type: 'error', message: 'You must be signed in as admin', duration: 5000 });
      return;
    }
    startTransition(async () => {
      try {
        await approveAction(id, actorUserId, role);
        addToast({ type: 'success', message: 'Request approved', duration: 4000 });
        router.replace(`/admin/requests?${query}`);
        router.refresh();
      } catch {
        addToast({ type: 'error', message: 'Approval failed', duration: 5000 });
      }
    });
  };

  const onDeny = async () => {
    const ok = typeof window !== 'undefined' ? window.confirm('Deny this request?') : true;
    if (!ok) return;
    if (!actorUserId) {
      addToast({ type: 'error', message: 'You must be signed in as admin', duration: 5000 });
      return;
    }
    startTransition(async () => {
      try {
        await denyAction(id, actorUserId, reason);
        addToast({ type: 'success', message: 'Request denied', duration: 4000 });
        router.replace(`/admin/requests?${query}`);
        router.refresh();
      } catch {
        addToast({ type: 'error', message: 'Denial failed', duration: 5000 });
      }
    });
  };

  return (
    <div className="flex gap-2 items-center">
      <select value={role} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRole(e.target.value as 'beta_user' | 'beta_admin')} className="bg-surface-base border border-white/10 rounded px-2 py-1 text-xs mr-2">
        <option value="beta_user">beta_user</option>
        <option value="beta_admin">beta_admin</option>
      </select>
      <button onClick={onApprove} disabled={pending} className="bg-green-500/80 hover:bg-green-500 text-surface-base rounded px-3 py-1 text-xs font-bold">Approve</button>
      <input value={reason} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)} placeholder="Reason" className="bg-surface-base border border-white/10 rounded px-2 py-1 text-xs mr-2" />
      <button onClick={onDeny} disabled={pending} className="bg-red-500/80 hover:bg-red-500 text-surface-base rounded px-3 py-1 text-xs font-bold">Deny</button>
    </div>
  );
}
