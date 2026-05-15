/**
 * Validates required Vite environment variables at startup.
 */
function requireEnv(name: string): string {
  const value = import.meta.env[name];
  if (!value || typeof value !== "string") {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env and set your Supabase credentials.`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: requireEnv("VITE_SUPABASE_URL"),
  supabaseAnonKey: requireEnv("VITE_SUPABASE_PUBLISHABLE_KEY"),
} as const;
