import { createBrowserClient } from "@supabase/ssr";

const FALLBACK_URL = "https://sfacvjuujqowhyyymrlr.supabase.co";
const FALLBACK_KEY = "sb_publishable_kpmUAdhTi0v0hZfqnrZBbQ_mjp8phAV";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    FALLBACK_KEY;

  return createBrowserClient(supabaseUrl, supabaseKey);
}
