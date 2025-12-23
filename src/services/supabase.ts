import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const getEnv = (key: string): string => {
  const v = process.env[key]
  if (!v) throw new Error(`Missing env: ${key}`)
  return v
}

const getAnyEnv = (keys: string[]): string => {
  for (const k of keys) {
    const v = process.env[k]
    if (v) return v
  }
  throw new Error(`Missing env: ${keys.join(' or ')}`)
}

// Lazy-initialized browser client to avoid SSR issues
let _supabaseBrowser: SupabaseClient | null = null;

export const getSupabaseBrowser = (): SupabaseClient => {
  if (_supabaseBrowser) return _supabaseBrowser;
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error(
      'Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local'
    );
  }
  
  _supabaseBrowser = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
    global: { headers: { 'x-client': 'rtios-next' } },
  });
  
  return _supabaseBrowser;
};

// Backward compatibility - but now lazy
export const supabaseBrowser: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabaseBrowser()[prop as keyof SupabaseClient];
  }
});

export const getSupabaseServer = (): SupabaseClient => {
  const url = getEnv('SUPABASE_URL')
  const key = getAnyEnv(['SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY'])
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-client': 'rtios-next' } },
  })
}

export const auth = {
  signUp: async (email: string, password: string) => {
    return supabaseBrowser.auth.signUp({ email, password })
  },
  signInWithPassword: async (email: string, password: string) => {
    return supabaseBrowser.auth.signInWithPassword({ email, password })
  },
  signInWithOAuth: async (provider: 'github' | 'google' | 'azure') => {
    return supabaseBrowser.auth.signInWithOAuth({ provider })
  },
  signOut: async () => {
    return supabaseBrowser.auth.signOut()
  },
}

export const realtime = {
  subscribeToJobs: (onChange: (payload: unknown) => void) => {
    return supabaseBrowser
      .channel('public:jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, onChange)
      .subscribe()
  },
  subscribeToBetaRequests: (onChange: (payload: unknown) => void) => {
    return supabaseBrowser
      .channel('public:beta_access_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'beta_access_requests' }, onChange)
      .subscribe()
  },
}

export const storage = {
  uploadResume: async (userId: string, file: File) => {
    const path = `${userId}/${Date.now()}_${file.name}`
    const { data, error } = await supabaseBrowser.storage.from('resumes').upload(path, file, {
      upsert: false,
    })
    if (error) throw error
    return data?.path
  },
}

export const storageServer = {
  createSignedUrl: async (path: string, expiresInSeconds: number = 900) => {
    const client = getSupabaseServer()
    const { data, error } = await client.storage.from('resumes').createSignedUrl(path, expiresInSeconds)
    if (error) throw error
    return data.signedUrl
  },
}

export const functions = {
  invoke: async <T = unknown>(name: string, payload: Record<string, unknown>): Promise<T> => {
    const { data, error } = await supabaseBrowser.functions.invoke(name, { body: payload })
    if (error) throw error
    return data as T
  },
}

