import { observable } from "@legendapp/state";
import { supabase } from "./supabase";

export const auth$ = observable<{ uid: string | null; loading: boolean }>({
  uid: null,
  loading: true,
});

export async function initAuth() {
  const { data } = await supabase.auth.getSession();
  auth$.uid.set(data.session?.user.id ?? null);
  auth$.loading.set(false);

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    auth$.uid.set(session?.user.id ?? null);
  });

  return () => subscription.unsubscribe();
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}
