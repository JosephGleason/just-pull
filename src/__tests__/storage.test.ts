import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getSettings,
  saveSettings,
  getCycleState,
  saveCycleState,
  getHistory,
  appendWorkout,
  getCurrentSession,
  saveCurrentSession,
  exportAllData,
  importAllData,
  clearAllData,
  isOnboardingComplete,
  setOnboardingComplete,
} from "../storage";
import { Settings, CycleState, WorkoutLog } from "../types";

beforeEach(async () => {
  await AsyncStorage.clear();
});

const mockSettings: Settings = {
  restTimerCompound: 180,
  restTimerAccessory: 90,
  units: "lb",
  increments: { bench_4: 5, squat_4: 10 },
  nutrition: null,
};

const mockCycleState: CycleState = {
  cycleNumber: 1,
  weekNumber: 1,
  nextDay: 1,
  isDeload: false,
};

describe("storage", () => {
  test("settings round-trip", async () => {
    expect(await getSettings()).toBeNull();
    await saveSettings(mockSettings);
    expect(await getSettings()).toEqual(mockSettings);
  });

  test("cycleState round-trip", async () => {
    expect(await getCycleState()).toBeNull();
    await saveCycleState(mockCycleState);
    expect(await getCycleState()).toEqual(mockCycleState);
  });

  test("history starts empty, appendWorkout adds entries", async () => {
    expect(await getHistory()).toEqual([]);
    const workout: WorkoutLog = {
      id: "test-1",
      date: "2026-05-12",
      day: 1,
      week: 1,
      cycle: 1,
      exercises: [],
      completedAt: null,
    };
    await appendWorkout(workout);
    const history = await getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe("test-1");
  });

  test("currentSession can be set and cleared", async () => {
    expect(await getCurrentSession()).toBeNull();
    await saveCurrentSession({
      startedAt: "2026-05-12T10:00:00Z",
      day: 1,
      week: 1,
      cycle: 1,
      exercises: [],
    });
    expect(await getCurrentSession()).not.toBeNull();
    await saveCurrentSession(null);
    expect(await getCurrentSession()).toBeNull();
  });

  test("onboarding flag", async () => {
    expect(await isOnboardingComplete()).toBe(false);
    await setOnboardingComplete();
    expect(await isOnboardingComplete()).toBe(true);
  });

  test("export and import round-trip", async () => {
    await saveSettings(mockSettings);
    await saveCycleState(mockCycleState);
    const exported = await exportAllData();
    await clearAllData();
    expect(await getSettings()).toBeNull();
    await importAllData(exported);
    expect(await getSettings()).toEqual(mockSettings);
    expect(await getCycleState()).toEqual(mockCycleState);
  });
});
