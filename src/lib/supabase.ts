import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabase_url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabase_anon_key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const isServer = typeof window === "undefined";

const storage = isServer
  ? { getItem: () => null, setItem: () => {}, removeItem: () => {} }
  : AsyncStorage;

export const supabase = createClient(supabase_url, supabase_anon_key, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: !isServer,
    detectSessionInUrl: false,
  },
});
