import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Settings, CycleState, ExerciseWeight, WorkoutLog, CurrentSession } from "./types";
import * as storage from "./storage";

interface AppState {
  settings: Settings | null;
  cycleState: CycleState | null;
  weights: Record<string, ExerciseWeight>;
  history: WorkoutLog[];
  currentSession: CurrentSession | null;
  isLoading: boolean;
}

interface AppContextValue extends AppState {
  setSettings: (s: Settings) => Promise<void>;
  setCycleState: (c: CycleState) => Promise<void>;
  setWeights: (w: Record<string, ExerciseWeight>) => Promise<void>;
  addWorkout: (w: WorkoutLog) => Promise<void>;
  setCurrentSession: (s: CurrentSession | null) => Promise<void>;
  reload: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    settings: null, cycleState: null, weights: {}, history: [], currentSession: null, isLoading: true,
  });

  const load = async () => {
    const [settings, cycleState, weights, history, currentSession] = await Promise.all([
      storage.getSettings(), storage.getCycleState(), storage.getWeights(), storage.getHistory(), storage.getCurrentSession(),
    ]);
    setState({ settings, cycleState, weights: weights ?? {}, history, currentSession, isLoading: false });
  };

  useEffect(() => { load(); }, []);

  const value: AppContextValue = {
    ...state,
    setSettings: async (s) => { await storage.saveSettings(s); setState((prev) => ({ ...prev, settings: s })); },
    setCycleState: async (c) => { await storage.saveCycleState(c); setState((prev) => ({ ...prev, cycleState: c })); },
    setWeights: async (w) => { await storage.saveWeights(w); setState((prev) => ({ ...prev, weights: w })); },
    addWorkout: async (w) => { await storage.appendWorkout(w); setState((prev) => ({ ...prev, history: [...prev.history, w] })); },
    setCurrentSession: async (s) => { await storage.saveCurrentSession(s); setState((prev) => ({ ...prev, currentSession: s })); },
    reload: load,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be inside AppProvider");
  return ctx;
}
