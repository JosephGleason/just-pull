import { WorkoutLog, BodyLog, BodyModelState } from "../types";
import {
  MUSCLE_GROUPS,
  MuscleGroup,
  EXERCISE_MUSCLE_MAP,
  DECAY_HALF_LIFE_DAYS,
  MAX_WEEKLY_GAIN,
  MEMORY_MULTIPLIER,
  BF_DRIFT_PER_MONTH,
  INACTIVE_THRESHOLD_SESSIONS_PER_WEEK,
} from "../components/body/muscles";

/** Return the ISO date string's midnight UTC as a Date */
function toDate(s: string): Date {
  return new Date(s.slice(0, 10) + "T00:00:00Z");
}

/** Milliseconds per day */
const MS_PER_DAY = 86_400_000;

/** Days between two dates (a − b), always using UTC midnights */
function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY);
}

/** Get Monday-based week start (UTC) for a given date */
function weekStart(d: Date): string {
  const copy = new Date(d);
  const day = copy.getUTCDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? 6 : day - 1; // shift so Monday=0
  copy.setUTCDate(copy.getUTCDate() - diff);
  return copy.toISOString().slice(0, 10);
}

/**
 * Compute weekly volume gain for a muscle using diminishing-returns tiers.
 *   0–10 sets  → each adds 0.01
 *  10–20 sets  → each adds 0.005
 *  20+   sets  → each adds 0.001
 * Capped at MAX_WEEKLY_GAIN.
 */
function weeklyGain(sets: number): number {
  let gain = 0;
  if (sets <= 10) {
    gain = sets * 0.01;
  } else if (sets <= 20) {
    gain = 10 * 0.01 + (sets - 10) * 0.005;
  } else {
    gain = 10 * 0.01 + 10 * 0.005 + (sets - 20) * 0.001;
  }
  return Math.min(gain, MAX_WEEKLY_GAIN);
}

/**
 * Pure computation: given workout history, body-log entries, and a reference
 * date, return the full body-model state.
 */
export function computeMuscleStates(
  history: WorkoutLog[],
  bodyLog: BodyLog[],
  asOfDate: Date
): BodyModelState {
  // Initialise per-muscle state
  const muscles: Record<string, number> = {};
  const peakMuscles: Record<string, number> = {};
  for (const mg of MUSCLE_GROUPS) {
    muscles[mg] = 0;
    peakMuscles[mg] = 0;
  }

  // Sort history by date ascending
  const sorted = [...history].sort(
    (a, b) => toDate(a.date).getTime() - toDate(b.date).getTime()
  );

  // ── Bucket workouts into ISO weeks ──────────────────────────────
  // Each bucket: weekKey → { muscleSets: Record<MuscleGroup, number>, endDate: Date }
  interface WeekBucket {
    muscleSets: Record<string, number>;
    lastDate: Date;
  }

  const weekBuckets = new Map<string, WeekBucket>();

  for (const w of sorted) {
    const wDate = toDate(w.date);
    if (wDate > asOfDate) continue; // ignore future workouts
    const wk = weekStart(wDate);
    if (!weekBuckets.has(wk)) {
      weekBuckets.set(wk, {
        muscleSets: Object.fromEntries(MUSCLE_GROUPS.map((m) => [m, 0])),
        lastDate: wDate,
      });
    }
    const bucket = weekBuckets.get(wk)!;
    if (wDate > bucket.lastDate) bucket.lastDate = wDate;

    for (const ex of w.exercises) {
      const mapping = EXERCISE_MUSCLE_MAP[ex.key];
      if (!mapping) continue;
      const numSets = ex.sets.length;
      for (const [muscle, weight] of Object.entries(mapping)) {
        bucket.muscleSets[muscle] =
          (bucket.muscleSets[muscle] || 0) + numSets * weight;
      }
    }
  }

  // ── Process weeks in chronological order ────────────────────────
  const weekKeys = [...weekBuckets.keys()].sort();

  let prevWeekEnd: Date | null = null;

  for (const wk of weekKeys) {
    const bucket = weekBuckets.get(wk)!;
    const weekDate = toDate(wk);

    // Apply decay for gap between previous week-end and this week-start
    if (prevWeekEnd !== null) {
      const gapDays = daysBetween(weekDate, prevWeekEnd);
      if (gapDays > 0) {
        for (const mg of MUSCLE_GROUPS) {
          if (bucket.muscleSets[mg] === 0 || gapDays > 7) {
            // Decay untrained muscles over the gap
            const decayFactor = Math.pow(0.5, gapDays / DECAY_HALF_LIFE_DAYS);
            muscles[mg] *= decayFactor;
          }
        }
      }
    }

    // Apply gains for this week
    for (const mg of MUSCLE_GROUPS) {
      const sets = bucket.muscleSets[mg];
      if (sets <= 0) continue;

      let gain = weeklyGain(Math.round(sets));

      // Muscle memory: if current size < peak, gains are doubled
      if (muscles[mg] < peakMuscles[mg]) {
        gain *= MEMORY_MULTIPLIER;
      }

      muscles[mg] = Math.min(1, muscles[mg] + gain);

      // Update peak
      if (muscles[mg] > peakMuscles[mg]) {
        peakMuscles[mg] = muscles[mg];
      }
    }

    prevWeekEnd = bucket.lastDate;
  }

  // ── Final decay from last training week to asOfDate ─────────────
  if (prevWeekEnd !== null) {
    const finalGapDays = daysBetween(asOfDate, prevWeekEnd);
    if (finalGapDays > 0) {
      for (const mg of MUSCLE_GROUPS) {
        const decayFactor = Math.pow(
          0.5,
          finalGapDays / DECAY_HALF_LIFE_DAYS
        );
        muscles[mg] *= decayFactor;
      }
    }
  }

  // Clamp to [0, 1]
  for (const mg of MUSCLE_GROUPS) {
    muscles[mg] = Math.max(0, Math.min(1, muscles[mg]));
  }

  // ── Body fat interpolation ──────────────────────────────────────
  let bodyFatPercent = 0;
  let bodyWeight = 0;

  const sortedBodyLog = [...bodyLog].sort(
    (a, b) => toDate(a.date).getTime() - toDate(b.date).getTime()
  );

  if (sortedBodyLog.length === 0) {
    bodyFatPercent = 0;
    bodyWeight = 0;
  } else if (sortedBodyLog.length === 1) {
    bodyFatPercent = sortedBodyLog[0].bodyFatPercent;
    bodyWeight = sortedBodyLog[0].weight;
  } else {
    const asOfMs = asOfDate.getTime();

    // Find surrounding log entries for interpolation
    let before: BodyLog | null = null;
    let after: BodyLog | null = null;

    for (const log of sortedBodyLog) {
      const logMs = toDate(log.date).getTime();
      if (logMs <= asOfMs) {
        before = log;
      } else if (logMs > asOfMs && after === null) {
        after = log;
      }
    }

    if (before && after) {
      // Linear interpolation
      const beforeMs = toDate(before.date).getTime();
      const afterMs = toDate(after.date).getTime();
      const t = (asOfMs - beforeMs) / (afterMs - beforeMs);
      bodyFatPercent =
        before.bodyFatPercent + t * (after.bodyFatPercent - before.bodyFatPercent);
      bodyWeight = before.weight + t * (after.weight - before.weight);
    } else if (before) {
      bodyFatPercent = before.bodyFatPercent;
      bodyWeight = before.weight;
    } else if (after) {
      bodyFatPercent = after.bodyFatPercent;
      bodyWeight = after.weight;
    }
  }

  // ── BF drift when inactive and no recent log ───────────────────
  if (sortedBodyLog.length > 0) {
    const lastLogDate = toDate(sortedBodyLog[sortedBodyLog.length - 1].date);
    const daysSinceLastLog = daysBetween(asOfDate, lastLogDate);

    if (daysSinceLastLog > 28) {
      // Check training frequency: count sessions in last 28 days
      const recentCutoff = new Date(asOfDate);
      recentCutoff.setUTCDate(recentCutoff.getUTCDate() - 28);
      const recentSessions = sorted.filter(
        (w) =>
          toDate(w.date).getTime() >= recentCutoff.getTime() &&
          toDate(w.date).getTime() <= asOfDate.getTime()
      ).length;
      const sessionsPerWeek = recentSessions / 4; // 28 days = 4 weeks

      if (sessionsPerWeek < INACTIVE_THRESHOLD_SESSIONS_PER_WEEK) {
        const monthsSinceLastLog = daysSinceLastLog / 30;
        const drift = monthsSinceLastLog * BF_DRIFT_PER_MONTH;
        const maxBf = Math.max(...sortedBodyLog.map((l) => l.bodyFatPercent));
        bodyFatPercent = Math.min(maxBf, bodyFatPercent + drift);
      }
    }
  }

  // ── Months trained ─────────────────────────────────────────────
  let monthsTrained = 0;
  if (sorted.length > 0) {
    const firstWorkoutDate = toDate(sorted[0].date);
    const totalDays = daysBetween(asOfDate, firstWorkoutDate);
    monthsTrained = Math.floor(Math.max(0, totalDays) / 30);
  }

  return {
    muscles,
    bodyFatPercent,
    bodyWeight,
    monthsTrained,
    peakMuscles,
  };
}
