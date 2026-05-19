import { useState, useRef, useCallback, useEffect } from "react";
import * as Haptics from "expo-haptics";

interface TimerState {
  secondsLeft: number;
  isRunning: boolean;
  totalSeconds: number;
}

export function useTimer() {
  const [state, setState] = useState<TimerState>({
    secondsLeft: 0,
    isRunning: false,
    totalSeconds: 0,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (seconds: number) => {
      clear();
      setState({ secondsLeft: seconds, isRunning: true, totalSeconds: seconds });
      intervalRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.secondsLeft <= 1) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return { ...prev, secondsLeft: 0, isRunning: false };
          }
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        });
      }, 1000);
    },
    [clear]
  );

  const dismiss = useCallback(() => {
    clear();
    setState((prev) => ({ ...prev, secondsLeft: 0, isRunning: false }));
  }, [clear]);

  // Only increase secondsLeft — totalSeconds stays at the original value so
  // the progress bar continues from where it was rather than jumping backwards.
  const extend = useCallback((extraSeconds: number) => {
    setState((prev) => ({
      ...prev,
      secondsLeft: prev.secondsLeft + extraSeconds,
    }));
  }, []);

  useEffect(() => {
    return clear;
  }, [clear]);

  return {
    secondsLeft: state.secondsLeft,
    isRunning: state.isRunning,
    totalSeconds: state.totalSeconds,
    progress:
      state.totalSeconds > 0
        ? Math.max(0, Math.min(1, 1 - state.secondsLeft / state.totalSeconds))
        : 0,
    start,
    dismiss,
    extend,
  };
}
