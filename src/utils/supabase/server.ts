import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { User, SupabaseClient } from '@supabase/supabase-js';

// Helper to create safe server client
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  );
}

// Helper to get authenticated user
export async function getAuthenticatedUser(): Promise<{ user: User, supabase: SupabaseClient }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return { user, supabase };
}

// Helper to create Admin Client (Service Role)
export async function createSupabaseAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Missing SUPABASE_SECRET_KEY');
  }

  // Note: We do NOT pass cookies here because this is for Admin actions, not user actions.
  // Using pure supabase-js client for service role operations.
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// Helper to get authenticated ADMIN
export async function getAuthenticatedAdmin(): Promise<{ user: User, supabase: SupabaseClient, adminClient: SupabaseClient }> {
  // 1. Get standard user
  const { user, supabase } = await getAuthenticatedUser();

  // 2. Create admin client first (for secure role verification)
  const adminClient = await createSupabaseAdminClient();

  // 3. Verify role using service role client (bypasses RLS - secure)
  // SECURITY: Using adminClient ensures role check cannot be bypassed via RLS misconfiguration
  const { data: roleData, error } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !roleData || roleData.role !== 'admin') {
    console.warn(`Unauthorized Admin Access Attempt by: ${user.id}`);
    throw new Error('Forbidden: Admin Access Required');
  }

  // 4. Return user + admin client (for elevated actions)
  return { user, supabase, adminClient };
}
