import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { User, SupabaseClient } from '@supabase/supabase-js';

// Helper to create safe server client
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }

  // Note: We do NOT pass cookies here because this is for Admin actions, not user actions.
  // Using pure supabase-js client for service role operations.
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
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

  // 2. Verify Role via public.users
  const { data: roleData, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !roleData || roleData.role !== 'admin') {
    console.warn(`Unauthorized Admin Access Attempt by: ${user.id}`);
    throw new Error('Forbidden: Admin Access Required');
  }

  // 3. Return user + admin client (for elevated actions)
  const adminClient = await createSupabaseAdminClient();
  return { user, supabase, adminClient };
}
