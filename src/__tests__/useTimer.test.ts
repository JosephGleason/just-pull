(global as any).IS_REACT_ACT_ENVIRONMENT = true;

import React from "react";
import { act, create } from "react-test-renderer";

let mockAppStateCallback: ((state: string) => void) | null = null;

jest.mock("react-native", () => ({
  AppState: {
    addEventListener: jest.fn((_event: string, callback: (state: string) => void) => {
      mockAppStateCallback = callback;
      return { remove: jest.fn(() => { mockAppStateCallback = null; }) };
    }),
  },
}));

jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: "success" },
}));

import { useTimer } from "../hooks/useTimer";

type TimerResult = ReturnType<typeof useTimer>;

function renderTimerHook() {
  const result = { current: undefined as unknown as TimerResult };

  function HookContainer() {
    result.current = useTimer();
    return null;
  }

  act(() => {
    create(React.createElement(HookContainer));
  });

  return { result };
}

beforeEach(() => {
  jest.useFakeTimers();
  mockAppStateCallback = null;
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useTimer", () => {
  test("starts with 0 seconds and not running", () => {
    const { result } = renderTimerHook();
    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  test("start begins countdown", () => {
    const { result } = renderTimerHook();
    act(() => result.current.start(60));
    expect(result.current.secondsLeft).toBe(60);
    expect(result.current.isRunning).toBe(true);
  });

  test("countdown decrements via wall clock", () => {
    const { result } = renderTimerHook();
    act(() => result.current.start(5));
    act(() => jest.advanceTimersByTime(2000));
    expect(result.current.secondsLeft).toBe(3);
  });

  test("dismiss stops timer immediately", () => {
    const { result } = renderTimerHook();
    act(() => result.current.start(60));
    act(() => result.current.dismiss());
    expect(result.current.isRunning).toBe(false);
    expect(result.current.secondsLeft).toBe(0);
  });

  test("adjust positive adds time", () => {
    const { result } = renderTimerHook();
    act(() => result.current.start(60));
    act(() => jest.advanceTimersByTime(10000));
    act(() => result.current.adjust(30));
    expect(result.current.secondsLeft).toBe(80);
  });

  test("adjust negative subtracts time", () => {
    const { result } = renderTimerHook();
    act(() => result.current.start(60));
    act(() => jest.advanceTimersByTime(10000));
    act(() => result.current.adjust(-20));
    expect(result.current.secondsLeft).toBe(30);
  });

  test("adjust negative clamps to 0", () => {
    const { result } = renderTimerHook();
    act(() => result.current.start(30));
    act(() => jest.advanceTimersByTime(20000));
    act(() => result.current.adjust(-60));
    // Trigger the completion effect
    act(() => jest.advanceTimersByTime(1000));
    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  test("progress is 0 to 1", () => {
    const { result } = renderTimerHook();
    act(() => result.current.start(10));
    expect(result.current.progress).toBeCloseTo(0);
    act(() => jest.advanceTimersByTime(5000));
    expect(result.current.progress).toBeCloseTo(0.5);
  });

  test("timer completes and fires haptic", () => {
    const Haptics = require("expo-haptics");
    const { result } = renderTimerHook();
    act(() => result.current.start(3));
    act(() => jest.advanceTimersByTime(4000));
    expect(result.current.isRunning).toBe(false);
    expect(result.current.secondsLeft).toBe(0);
    expect(Haptics.notificationAsync).toHaveBeenCalled();
  });

  test("foreground resume updates time correctly", () => {
    const { result } = renderTimerHook();
    act(() => result.current.start(60));
    act(() => jest.advanceTimersByTime(30000));
    act(() => { mockAppStateCallback?.("active"); });
    expect(result.current.secondsLeft).toBe(30);
  });
});
