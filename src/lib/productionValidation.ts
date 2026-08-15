import { supabase } from "@/integrations/supabase/client";

/**
 * Non-invasive runtime checks used by admin/support tooling and diagnostics.
 * It never exposes secrets and never treats a failed dependency as success.
 */
export async function validateSupabaseSession(): Promise<{
  ok: boolean;
  userId: string | null;
  error: string | null;
}> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return { ok: false, userId: null, error: error.message };
  }

  return {
    ok: Boolean(data.session?.user),
    userId: data.session?.user.id ?? null,
    error: data.session?.user ? null : "Aucune session authentifiée.",
  };
}

export async function validateStorageBucket(bucket: string): Promise<{
  ok: boolean;
  error: string | null;
}> {
  const { data, error } = await supabase.storage.getBucket(bucket);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: Boolean(data?.name), error: data?.name ? null : "Bucket introuvable." };
}
