(global as any).IS_REACT_ACT_ENVIRONMENT = true;

import React from "react";
import { act, create } from "react-test-renderer";
import { useTimer } from "../hooks/useTimer";

jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: "success" },
}));

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

type TimerResult = ReturnType<typeof useTimer>;

/**
 * Lightweight renderHook helper using react-test-renderer.
 * Returns a { result } ref where result.current always points to the latest
 * hook return value (re-assigned on every render).
 */
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

  test("countdown decrements each second", () => {
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

  test("extend adds time", () => {
    const { result } = renderTimerHook();
    act(() => result.current.start(60));
    act(() => jest.advanceTimersByTime(10000));
    act(() => result.current.extend(30));
    expect(result.current.secondsLeft).toBe(80);
  });

  test("progress is 0 to 1", () => {
    const { result } = renderTimerHook();
    act(() => result.current.start(10));
    expect(result.current.progress).toBeCloseTo(0);
    act(() => jest.advanceTimersByTime(5000));
    expect(result.current.progress).toBeCloseTo(0.5);
  });
});
