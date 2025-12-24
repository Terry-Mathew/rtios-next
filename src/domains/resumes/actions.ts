'use server';

import { cookies } from 'next/headers';
import { getSupabaseServer, storageServer } from '@/src/services/supabase';

export const getResumeSignedUrl = async (resumeId: string, expiresInSeconds: number = 900): Promise<string> => {
  const token = (await cookies()).get('sb-access-token')?.value;
  let actorId: string | null = null;
  if (token) {
    try {
      const b64 = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
      if (b64) {
        const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
        actorId = payload?.sub ?? null;
      }
    } catch { /* JWT parsing may fail - silently continue with null actorId */ }
  }
  if (!actorId) throw new Error('Unauthorized');
  const client = getSupabaseServer();
  const { data: resume, error: resumeErr } = await client
    .from('resumes')
    .select('id,user_id,storage_path')
    .eq('id', resumeId)
    .single();
  if (resumeErr) throw resumeErr;
  if (!resume || !resume.storage_path) throw new Error('Not Found');
  let allowed = resume.user_id === actorId;
  if (!allowed) {
    const { data: admin } = await client
      .from('beta_users')
      .select('role')
      .eq('user_id', actorId)
      .single();
    allowed = !!admin && admin.role === 'beta_admin';
  }
  if (!allowed) throw new Error('Forbidden');
  return storageServer.createSignedUrl(resume.storage_path, expiresInSeconds);
};
