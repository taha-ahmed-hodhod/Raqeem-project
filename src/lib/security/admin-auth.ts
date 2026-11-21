import { getServerEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminDenialReason =
  | "unauthenticated"
  | "email_not_allowlisted"
  | "not_project_admin"
  | "rpc_error";

export interface AdminAccessResult {
  authorized: boolean;
  userId: string | null;
  email: string | null;
  reason?: AdminDenialReason;
}

export class UnauthorizedAdminError extends Error {
  public readonly reason: AdminDenialReason;

  constructor(reason: AdminDenialReason) {
    super(`Admin access denied: ${reason}`);
    this.name = "UnauthorizedAdminError";
    this.reason = reason;
  }
}

export interface AdminCheckClient {
  auth: {
    getUser: () => PromiseLike<{
      data: { user: { id: string; email?: string | null } | null };
      error: unknown;
    }>;
  };
  rpc: (fn: "is_project_admin") => PromiseLike<{
    data: boolean | null;
    error: unknown;
  }>;
}

/**
 * Pure verification helper that enforces both:
 * 1) Active Supabase Auth user session
 * 2) Optional server-env email allowlist (`ADMIN_ALLOWED_EMAIL`) if configured
 * 3) Database allowlist check (`public.is_project_admin()` -> `private.is_admin()` against `public.admin_account`)
 */
export async function evaluateAdminAccess(
  supabase: AdminCheckClient,
  allowedEmail?: string,
): Promise<AdminAccessResult> {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    return {
      authorized: false,
      userId: null,
      email: null,
      reason: "unauthenticated",
    };
  }

  const user = authData.user;
  const userEmail = user.email?.toLowerCase().trim() ?? null;

  if (
    allowedEmail &&
    (!userEmail || userEmail !== allowedEmail.toLowerCase().trim())
  ) {
    return {
      authorized: false,
      userId: user.id,
      email: userEmail,
      reason: "email_not_allowlisted",
    };
  }

  const { data: isAdmin, error: rpcError } =
    await supabase.rpc("is_project_admin");

  if (rpcError) {
    return {
      authorized: false,
      userId: user.id,
      email: userEmail,
      reason: "rpc_error",
    };
  }

  if (isAdmin !== true) {
    return {
      authorized: false,
      userId: user.id,
      email: userEmail,
      reason: "not_project_admin",
    };
  }

  return {
    authorized: true,
    userId: user.id,
    email: userEmail,
  };
}

export async function verifyAdminAccess(): Promise<AdminAccessResult> {
  const env = getServerEnv();
  const supabase = await createSupabaseServerClient();
  return evaluateAdminAccess(supabase, env.ADMIN_ALLOWED_EMAIL);
}

export async function requireAdminAccess(): Promise<{
  userId: string;
  email: string | null;
}> {
  const result = await verifyAdminAccess();
  if (!result.authorized || !result.userId) {
    throw new UnauthorizedAdminError(result.reason ?? "unauthenticated");
  }
  return { userId: result.userId, email: result.email };
}
