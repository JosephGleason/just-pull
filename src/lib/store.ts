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

export const current_session$ = observable(
  syncedSupabase({
    supabase,
    collection: "current_session",
    ...singleRowBase,
    realtime: true,
    fieldDeleted: false as any,
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
