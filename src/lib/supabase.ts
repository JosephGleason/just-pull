import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabase_url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabase_anon_key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

let _supabase: SupabaseClient;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const AsyncStorage =
      Platform.OS === "web"
        ? undefined
        : require("@react-native-async-storage/async-storage").default;

    _supabase = createClient(supabase_url, supabase_anon_key, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});
