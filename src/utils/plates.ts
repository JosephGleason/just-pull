export interface PlateInfo {
  weight: number;
  color: string;
}

export const LB_PLATES = [45, 35, 25, 10, 5, 2.5];
export const KG_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

export const LB_PLATE_COLORS: Record<number, string> = {
  45: "#E85454",
  35: "#4A8FE8",
  25: "#5BD488",
  10: "#E8A838",
  5: "#F2F0EB",
  2.5: "#8A897F",
};

export const KG_PLATE_COLORS: Record<number, string> = {
  25: "#E85454",
  20: "#4A8FE8",
  15: "#E8A838",
  10: "#5BD488",
  5: "#F2F0EB",
  2.5: "#8A897F",
  1.25: "#4D4A44",
};

export function calculatePlates(
  weight: number,
  units: string
): { plates: PlateInfo[]; error: string | null } {
  const barWeight = units === "kg" ? 20 : 45;
  const availablePlates = units === "kg" ? KG_PLATES : LB_PLATES;
  const plateColors = units === "kg" ? KG_PLATE_COLORS : LB_PLATE_COLORS;

  if (weight <= barWeight) {
    return { plates: [], error: "Bar only" };
  }

  const remainder = weight - barWeight;
  if (remainder % 2 !== 0 && units === "lb") {
    const perSide = remainder / 2;
    if (perSide !== Math.floor(perSide * 2) / 2) {
      return { plates: [], error: "Can't split evenly" };
    }
  }

  const perSide = remainder / 2;

  if (perSide < 0) {
    return { plates: [], error: "Bar only" };
  }

  const smallestPlate = availablePlates[availablePlates.length - 1];
  const canSplit = (perSide * 10) % (smallestPlate * 10) === 0;
  if (!canSplit) {
    return { plates: [], error: "Can't split evenly" };
  }

  const plates: PlateInfo[] = [];
  let remaining = perSide;

  for (const plate of availablePlates) {
    while (remaining >= plate) {
      plates.push({
        weight: plate,
        color: plateColors[plate] ?? "#4D4A44",
      });
      remaining -= plate;
    }
  }

  return { plates, error: null };
}

export function formatPlatesPerSide(plates: PlateInfo[]): string {
  if (plates.length === 0) return "";
  const counts: Record<number, number> = {};
  for (const p of plates) {
    counts[p.weight] = (counts[p.weight] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([w, count]) => (count > 1 ? `${count}×${w}` : `${w}`))
    .join(" + ");
}
