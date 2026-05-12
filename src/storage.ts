import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Settings,
  CycleState,
  ExerciseWeight,
  WorkoutLog,
  CurrentSession,
  BodyLog,
} from "./types";

const KEYS = {
  settings: "settings",
  cycleState: "cycleState",
  weights: "weights",
  history: "history",
  currentSession: "currentSession",
  onboardingComplete: "onboardingComplete",
  bodyLog: "bodyLog",
} as const;

async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

async function setJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getSettings(): Promise<Settings | null> {
  return getJSON<Settings>(KEYS.settings);
}

export async function saveSettings(settings: Settings): Promise<void> {
  return setJSON(KEYS.settings, settings);
}

export async function getCycleState(): Promise<CycleState | null> {
  return getJSON<CycleState>(KEYS.cycleState);
}

export async function saveCycleState(state: CycleState): Promise<void> {
  return setJSON(KEYS.cycleState, state);
}

export async function getWeights(): Promise<Record<string, ExerciseWeight> | null> {
  return getJSON<Record<string, ExerciseWeight>>(KEYS.weights);
}

export async function saveWeights(
  weights: Record<string, ExerciseWeight>
): Promise<void> {
  return setJSON(KEYS.weights, weights);
}

export async function getHistory(): Promise<WorkoutLog[]> {
  return (await getJSON<WorkoutLog[]>(KEYS.history)) ?? [];
}

export async function appendWorkout(workout: WorkoutLog): Promise<void> {
  const history = await getHistory();
  history.push(workout);
  return setJSON(KEYS.history, history);
}

export async function getCurrentSession(): Promise<CurrentSession | null> {
  return getJSON<CurrentSession>(KEYS.currentSession);
}

export async function saveCurrentSession(
  session: CurrentSession | null
): Promise<void> {
  if (session === null) {
    return AsyncStorage.removeItem(KEYS.currentSession);
  }
  return setJSON(KEYS.currentSession, session);
}

export async function isOnboardingComplete(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.onboardingComplete);
  return val === "true";
}

export async function setOnboardingComplete(): Promise<void> {
  return AsyncStorage.setItem(KEYS.onboardingComplete, "true");
}

export async function getBodyLog(): Promise<BodyLog[]> {
  return (await getJSON<BodyLog[]>(KEYS.bodyLog)) ?? [];
}

export async function appendBodyLog(entry: BodyLog): Promise<void> {
  const log = await getBodyLog();
  log.push(entry);
  return setJSON(KEYS.bodyLog, log);
}

export async function saveBodyLog(log: BodyLog[]): Promise<void> {
  return setJSON(KEYS.bodyLog, log);
}

export async function exportAllData(): Promise<string> {
  const keys = Object.values(KEYS);
  const pairs = await AsyncStorage.multiGet(keys);
  const data: Record<string, any> = {};
  for (const [key, value] of pairs) {
    if (value !== null) {
      data[key] = JSON.parse(value);
    }
  }
  return JSON.stringify(data, null, 2);
}

export async function importAllData(json: string): Promise<void> {
  const data = JSON.parse(json) as Record<string, any>;
  const pairs: [string, string][] = Object.entries(data).map(([key, value]) => [
    key,
    JSON.stringify(value),
  ]);
  await AsyncStorage.multiSet(pairs);
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
