import { jsonResponse } from "./cors.ts";

/**
 * Validates cron/admin invocations via shared secret header.
 * Set CRON_SECRET in Supabase Edge Function secrets.
 */
export function requireCronSecret(req: Request): Response | null {
  const expected = Deno.env.get("CRON_SECRET");
  if (!expected) {
    console.warn("CRON_SECRET not configured — admin endpoints are disabled");
    return jsonResponse({ error: "Service not configured" }, 503);
  }

  const provided = req.headers.get("x-cron-secret");
  if (provided !== expected) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  return null;
}
