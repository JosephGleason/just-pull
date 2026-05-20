import { useState, useRef, useCallback, useEffect } from "react";
import { AppState } from "react-native";
import * as Haptics from "expo-haptics";

interface TimerState {
  endAt: number;
  totalDuration: number;
  isRunning: boolean;
}

function computeSecondsLeft(endAt: number): number {
  return Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
}

export function useTimer() {
  const [state, setState] = useState<TimerState>({
    endAt: 0,
    totalDuration: 0,
    isRunning: false,
  });
  const [, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasFiredDoneRef = useRef(false);

  const secondsLeft = state.isRunning
    ? computeSecondsLeft(state.endAt)
    : 0;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (state.isRunning && secondsLeft <= 0 && !hasFiredDoneRef.current) {
      hasFiredDoneRef.current = true;
      clearTimer();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setState((prev) => ({ ...prev, isRunning: false }));
    }
  }, [state.isRunning, secondsLeft, clearTimer]);

  const start = useCallback(
    (seconds: number) => {
      clearTimer();
      hasFiredDoneRef.current = false;
      setState({
        endAt: Date.now() + seconds * 1000,
        totalDuration: seconds,
        isRunning: true,
      });
      intervalRef.current = setInterval(() => {
        setTick((t) => t + 1);
      }, 1000);
    },
    [clearTimer]
  );

  const dismiss = useCallback(() => {
    clearTimer();
    hasFiredDoneRef.current = true;
    setState((prev) => ({ ...prev, isRunning: false }));
  }, [clearTimer]);

  const adjust = useCallback((seconds: number) => {
    setState((prev) => {
      if (!prev.isRunning) return prev;
      const newEndAt = prev.endAt + seconds * 1000;
      return { ...prev, endAt: Math.max(Date.now(), newEndAt) };
    });
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        setTick((t) => t + 1);
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return {
    secondsLeft,
    isRunning: state.isRunning,
    totalDuration: state.totalDuration,
    progress:
      state.totalDuration > 0
        ? Math.max(0, Math.min(1, 1 - secondsLeft / state.totalDuration))
        : 0,
    start,
    dismiss,
    adjust,
  };
}
