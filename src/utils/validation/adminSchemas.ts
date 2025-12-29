/**
 * Zod validation schemas for admin API routes
 * Provides runtime type safety and input validation
 */

import { z } from 'zod';

/**
 * UUID validation regex
 * Matches standard UUID format: 8-4-4-4-12 hex digits
 */
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Common validation helpers
 */
export const commonSchemas = {
  /**
   * Valid UUID (user ID, job ID, etc.)
   */
  uuid: z.string().regex(uuidRegex, 'Invalid UUID format'),

  /**
   * User role (only 'user' or 'admin' allowed)
   */
  userRole: z.enum(['user', 'admin'], 'Role must be either "user" or "admin"'),

  /**
   * User status (active or banned)
   */
  userStatus: z.enum(['active', 'banned'], 'Status must be either "active" or "banned"'),
};

/**
 * DELETE user schema
 * POST /api/admin/users/delete
 */
export const deleteUserSchema = z.object({
  userId: commonSchemas.uuid,
});

export type DeleteUserInput = z.infer<typeof deleteUserSchema>;

/**
 * BAN/UNBAN user schema
 * POST /api/admin/users/ban
 */
export const banUserSchema = z.object({
  userId: commonSchemas.uuid,
  status: commonSchemas.userStatus,
});

export type BanUserInput = z.infer<typeof banUserSchema>;

/**
 * UPGRADE user role schema
 * POST /api/admin/upgrade-user
 */
export const upgradeUserSchema = z.object({
  userId: commonSchemas.uuid,
  role: commonSchemas.userRole,
});

export type UpgradeUserInput = z.infer<typeof upgradeUserSchema>;

/**
 * RESET user usage schema
 * POST /api/admin/reset-usage
 */
export const resetUsageSchema = z.object({
  userId: commonSchemas.uuid,
});

export type ResetUsageInput = z.infer<typeof resetUsageSchema>;

/**
 * IMPERSONATE user schema
 * POST /api/admin/impersonate
 */
export const impersonateUserSchema = z.object({
  userId: commonSchemas.uuid,
});

export type ImpersonateUserInput = z.infer<typeof impersonateUserSchema>;

/**
 * Helper function to safely parse and validate request body
 * Returns parsed data or null with error message
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      // Format Zod errors into a readable message
      const errorMessage = result.error.message || 'Validation failed';

      return {
        success: false,
        error: errorMessage,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid JSON body',
    };
  }
}

/**
 * Type guard to check if validation result is successful
 */
export function isValidationSuccess<T>(
  result: { success: true; data: T } | { success: false; error: string }
): result is { success: true; data: T } {
  return result.success === true;
}
