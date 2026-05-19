import { observable } from "@legendapp/state";
import {
  configureSyncedSupabase,
  syncedSupabase,
} from "@legendapp/state/sync-plugins/supabase";
import { observablePersistAsyncStorage } from "@legendapp/state/persist-plugins/async-storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { supabase } from "./supabase";
import { auth$ } from "./auth";

const persistPlugin = observablePersistAsyncStorage({ AsyncStorage });

configureSyncedSupabase({
  changesSince: "all",
  fieldCreatedAt: "created_at",
  fieldUpdatedAt: "updated_at",
  fieldDeleted: "deleted",
});

// --- Single-row tables: as: 'value' ---
// generateId returns auth uid so Legend-State can track the row locally
const authId = () => auth$.uid.get()!;

// Single-row config: override global changesSince to 'all' (diff sync not useful for single rows)
const singleRowBase = {
  as: "value" as const,
  generateId: authId,
  changesSince: "all" as const,
  retry: { infinite: true },
  waitFor: auth$.uid,
};

// Profile row is created by DB trigger on signup — read + update only
export const profile$ = observable(
  syncedSupabase({
    supabase,
    collection: "profiles",
    ...singleRowBase,
    actions: ["read", "update"],
    filter: (select: any) => select.eq("id", auth$.uid.get()!),
    persist: { name: "ls_profiles", plugin: persistPlugin, retrySync: true },
  })
);

export const nutrition$ = observable(
  syncedSupabase({
    supabase,
    collection: "nutrition_settings",
    ...singleRowBase,
    filter: (select: any) => select.eq("id", auth$.uid.get()!),
    persist: { name: "ls_nutrition", plugin: persistPlugin, retrySync: true },
  })
);

export const cycle_state$ = observable(
  syncedSupabase({
    supabase,
    collection: "cycle_state",
    ...singleRowBase,
    realtime: true,
    filter: (select: any) => select.eq("id", auth$.uid.get()!),
    persist: {
      name: "ls_cycle_state",
      plugin: persistPlugin,
      retrySync: true,
    },
  })
);

// current_session is a single-row-per-user table that is fully deleted (not
// soft-deleted) when a workout finishes or is discarded.  We intentionally
// disable the global `fieldDeleted: "deleted"` setting here so that
// `current_session$.set(null)` issues a hard DELETE rather than setting a
// `deleted` flag.  This is correct because:
//   1. There is at most one row per user — no history to preserve.
//   2. Realtime subscriptions on other devices receive the DELETE event.
//   3. A soft-delete would leave a stale row that the next workout start
//      would need to un-delete, adding unnecessary complexity.
export const current_session$ = observable(
  syncedSupabase({
    supabase,
    collection: "current_session",
    ...singleRowBase,
    realtime: true,
    fieldDeleted: false as any, // intentional hard DELETE — see comment above
    filter: (select: any) => select.eq("id", auth$.uid.get()!),
    persist: {
      name: "ls_current_session",
      plugin: persistPlugin,
      retrySync: true,
    },
  })
);

// --- Collection tables: as: 'object', with generateId ---

export const weights$ = observable(
  syncedSupabase({
    supabase,
    collection: "exercise_weights",
    fieldId: "exercise_key",
    generateId: () => Crypto.randomUUID(),
    filter: (select: any) => select.eq("user_id", auth$.uid.get()!),
    realtime: true,
    persist: {
      name: "ls_exercise_weights",
      plugin: persistPlugin,
      retrySync: true,
    },
    retry: { infinite: true },
    waitFor: auth$.uid,
  })
);

export const increments$ = observable(
  syncedSupabase({
    supabase,
    collection: "increments",
    fieldId: "exercise_key",
    generateId: () => Crypto.randomUUID(),
    filter: (select: any) => select.eq("user_id", auth$.uid.get()!),
    persist: {
      name: "ls_increments",
      plugin: persistPlugin,
      retrySync: true,
    },
    retry: { infinite: true },
    waitFor: auth$.uid,
  })
);

export const workouts$ = observable(
  syncedSupabase({
    supabase,
    collection: "workouts",
    generateId: () => Crypto.randomUUID(),
    filter: (select: any) => select.eq("user_id", auth$.uid.get()!),
    persist: { name: "ls_workouts", plugin: persistPlugin, retrySync: true },
    retry: { infinite: true },
    waitFor: auth$.uid,
  })
);

export const body_log$ = observable(
  syncedSupabase({
    supabase,
    collection: "body_log",
    generateId: () => Crypto.randomUUID(),
    filter: (select: any) => select.eq("user_id", auth$.uid.get()!),
    persist: { name: "ls_body_log", plugin: persistPlugin, retrySync: true },
    retry: { infinite: true },
    waitFor: auth$.uid,
  })
);

// --- Derived state ---

export const is_ready$ = observable(() => {
  return (
    !auth$.loading.get() &&
    (auth$.uid.get() === null || profile$.get() !== undefined)
  );
});

// --- Local store cleanup ---

const PERSIST_KEYS = [
  "ls_profiles", "ls_profiles__m",
  "ls_nutrition", "ls_nutrition__m",
  "ls_cycle_state", "ls_cycle_state__m",
  "ls_current_session", "ls_current_session__m",
  "ls_exercise_weights", "ls_exercise_weights__m",
  "ls_increments", "ls_increments__m",
  "ls_workouts", "ls_workouts__m",
  "ls_body_log", "ls_body_log__m",
];

export async function clearLocalStores() {
  // Clear in-memory collection observables FIRST while Legend-State
  // metadata is still in AsyncStorage.  The caller is responsible for
  // ensuring Supabase rows are already deleted before calling this, so
  // any sync triggered by the .set() calls is a harmless no-op.
  weights$.set({} as any);
  increments$.set({} as any);
  workouts$.set({} as any);
  body_log$.set({} as any);
  // Then wipe AsyncStorage to remove Legend-State metadata and any
  // pending retrySync queue.
  await AsyncStorage.multiRemove(PERSIST_KEYS);
}
