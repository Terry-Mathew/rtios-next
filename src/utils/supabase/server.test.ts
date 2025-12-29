import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAuthenticatedAdmin, createSupabaseAdminClient } from './server';

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));

// Mock Supabase clients
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

const mockAdminClient = {
  from: vi.fn(),
  auth: {
    admin: {
      getUserById: vi.fn(),
      deleteUser: vi.fn(),
      generateLink: vi.fn(),
    },
  },
};

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockAdminClient),
}));

describe('Admin Authentication Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuthenticatedAdmin', () => {
    it('should successfully authenticate admin user', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'admin-user-id', email: 'admin@example.com' },
        },
        error: null,
      });

      // Mock admin role verification using service role client
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: 'admin' },
            error: null,
          }),
        }),
      });

      mockAdminClient.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await getAuthenticatedAdmin();

      expect(result.user.id).toBe('admin-user-id');
      expect(result.adminClient).toBeDefined();
      expect(mockAdminClient.from).toHaveBeenCalledWith('users');
    });

    it('should reject non-admin user', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'regular-user-id', email: 'user@example.com' },
        },
        error: null,
      });

      // Mock non-admin role
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: 'user' },
            error: null,
          }),
        }),
      });

      mockAdminClient.from.mockReturnValue({
        select: mockSelect,
      });

      await expect(getAuthenticatedAdmin()).rejects.toThrow('Forbidden: Admin Access Required');
    });

    it('should reject unauthenticated user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      await expect(getAuthenticatedAdmin()).rejects.toThrow('Unauthorized');
    });

    it('should reject when role verification fails', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'user-id', email: 'user@example.com' },
        },
        error: null,
      });

      // Mock role verification error
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        }),
      });

      mockAdminClient.from.mockReturnValue({
        select: mockSelect,
      });

      await expect(getAuthenticatedAdmin()).rejects.toThrow('Forbidden: Admin Access Required');
    });

    it('should use service role client for role verification (security requirement)', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'admin-user-id', email: 'admin@example.com' },
        },
        error: null,
      });

      // Mock admin role verification
      const mockSingle = vi.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      mockAdminClient.from.mockReturnValue({
        select: mockSelect,
      });

      await getAuthenticatedAdmin();

      // Verify that admin client was used (not regular client)
      expect(mockAdminClient.from).toHaveBeenCalledWith('users');
      expect(mockSelect).toHaveBeenCalledWith('role');
      expect(mockEq).toHaveBeenCalledWith('id', 'admin-user-id');
    });
  });

  describe('createSupabaseAdminClient', () => {
    it('should throw error if SUPABASE_SECRET_KEY is missing', async () => {
      const originalKey = process.env.SUPABASE_SECRET_KEY;
      delete process.env.SUPABASE_SECRET_KEY;

      await expect(createSupabaseAdminClient()).rejects.toThrow('Missing SUPABASE_SECRET_KEY');

      process.env.SUPABASE_SECRET_KEY = originalKey;
    });

    it('should create admin client with service role key', async () => {
      const client = await createSupabaseAdminClient();
      expect(client).toBeDefined();
    });
  });
});
