/**
 * Fat overlay silhouette for the body figure.
 *
 * Generates an SVG path that represents a body-shaped overlay whose width
 * increases with body fat percentage. At low BF% the overlay is nearly
 * invisible; at high BF% it covers the underlying muscle definition.
 *
 * Uses the same coordinate space as react-native-body-highlighter:
 *   viewBox "0 0 724 1448" (front)  /  "724 0 724 1448" (back)
 *
 * The body is centered around x ≈ 364 (front) / x ≈ 1088 (back).
 */

// ---------------------------------------------------------------------------
// Path interpolation (same algorithm as paths.ts)
// ---------------------------------------------------------------------------

function lerpPath(a: string, b: string, t: number): string {
  const aN = a.match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
  const bN = b.match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
  if (aN.length !== bN.length) return t < 0.5 ? a : b;
  let idx = 0;
  return a.replace(/-?\d+\.?\d*/g, () => {
    const v = aN[idx] + (bN[idx] - aN[idx]) * t;
    idx++;
    return v.toFixed(1);
  });
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

// ---------------------------------------------------------------------------
// Silhouette paths  —  724 × 1448 coordinate space, front view
// ---------------------------------------------------------------------------
// These are single closed paths tracing the full body outline (head through
// feet) at two extremes. We interpolate between them based on BF%.
//
// Key landmarks (front, x-center ≈ 364):
//   Head top          y ≈ 165
//   Neck              y ≈ 235
//   Shoulders         y ≈ 295
//   Armpits / chest   y ≈ 360
//   Waist             y ≈ 500
//   Hips              y ≈ 580
//   Crotch            y ≈ 680
//   Knees             y ≈ 920
//   Ankles            y ≈ 1260
//   Feet              y ≈ 1340

// --- FRONT ---

const LEAN_FRONT = [
  // Start at top of head
  "M 364 165",
  // Head — right side
  "C 394 165, 410 180, 410 210",
  "C 410 240, 400 255, 380 265",
  // Neck right
  "C 388 268, 394 280, 400 290",
  // Right shoulder
  "C 420 290, 460 295, 480 310",
  "C 498 324, 510 345, 510 360",
  // Right upper arm outer
  "C 512 380, 516 410, 518 440",
  "C 520 470, 518 510, 514 540",
  // Right elbow
  "C 512 560, 508 580, 504 600",
  // Right forearm outer
  "C 500 640, 494 690, 490 740",
  // Right hand
  "C 488 760, 484 778, 486 790",
  "C 488 798, 484 802, 478 800",
  // Right forearm inner
  "C 476 780, 472 740, 468 700",
  "C 464 660, 462 620, 460 590",
  // Right armpit / torso
  "C 458 560, 456 520, 454 490",
  // Right waist
  "C 452 470, 448 450, 444 440",
  // Right hip
  "C 440 460, 438 490, 440 520",
  "C 442 550, 448 570, 454 590",
  // Right outer thigh
  "C 460 620, 466 660, 468 700",
  "C 470 740, 470 780, 468 820",
  "C 466 860, 462 900, 456 930",
  // Right knee
  "C 452 950, 448 960, 446 970",
  // Right shin
  "C 444 990, 440 1040, 438 1090",
  "C 436 1140, 434 1190, 432 1230",
  // Right ankle
  "C 430 1260, 428 1280, 424 1300",
  // Right foot
  "C 420 1320, 412 1338, 410 1342",
  "C 406 1348, 398 1348, 394 1340",
  // Right inner leg up to crotch
  "C 392 1330, 390 1290, 388 1240",
  "C 386 1190, 384 1140, 382 1090",
  "C 380 1040, 378 990, 376 950",
  // Inner thigh right
  "C 374 920, 372 880, 370 840",
  "C 368 800, 366 750, 366 710",
  // Crotch
  "C 366 690, 364 680, 364 680",
  // Left inner thigh
  "C 364 680, 362 690, 362 710",
  "C 362 750, 360 800, 358 840",
  "C 356 880, 354 920, 352 950",
  // Left inner leg down
  "C 350 990, 348 1040, 346 1090",
  "C 344 1140, 342 1190, 340 1240",
  "C 338 1290, 336 1330, 334 1340",
  // Left foot
  "C 330 1348, 322 1348, 318 1342",
  "C 316 1338, 308 1320, 304 1300",
  // Left ankle
  "C 300 1280, 298 1260, 296 1230",
  // Left shin
  "C 294 1190, 292 1140, 290 1090",
  "C 288 1040, 284 990, 282 970",
  // Left knee
  "C 280 960, 276 950, 272 930",
  // Left outer thigh
  "C 266 900, 262 860, 260 820",
  "C 258 780, 258 740, 260 700",
  "C 262 660, 268 620, 274 590",
  // Left hip
  "C 280 570, 286 550, 288 520",
  "C 290 490, 288 460, 284 440",
  // Left waist
  "C 280 450, 276 470, 274 490",
  // Left torso / armpit
  "C 272 520, 270 560, 268 590",
  "C 266 620, 264 660, 260 700",
  // Left forearm inner
  "C 256 740, 252 780, 250 800",
  // Left hand
  "C 244 802, 240 798, 242 790",
  "C 244 778, 240 760, 238 740",
  // Left forearm outer
  "C 234 690, 228 640, 224 600",
  // Left elbow
  "C 220 580, 216 560, 214 540",
  // Left upper arm outer
  "C 210 510, 208 470, 210 440",
  "C 212 410, 216 380, 218 360",
  // Left shoulder
  "C 218 345, 230 324, 248 310",
  "C 268 295, 308 290, 328 290",
  // Neck left
  "C 334 280, 340 268, 348 265",
  // Head — left side
  "C 328 255, 318 240, 318 210",
  "C 318 180, 334 165, 364 165",
  "Z",
].join(" ");

const FAT_FRONT = [
  // Start at top of head (slightly wider)
  "M 364 165",
  // Head — right side (rounder, wider jaw/chin)
  "C 400 165, 420 180, 420 212",
  "C 420 244, 408 260, 386 272",
  // Neck right (thicker)
  "C 396 276, 404 286, 414 296",
  // Right shoulder (rounder, padded)
  "C 434 296, 476 300, 500 318",
  "C 520 334, 530 360, 530 378",
  // Right upper arm outer (much thicker)
  "C 536 400, 544 434, 548 468",
  "C 552 502, 548 546, 542 580",
  // Right elbow (thicker)
  "C 538 604, 532 628, 526 652",
  // Right forearm outer (thicker)
  "C 520 696, 512 744, 506 792",
  // Right hand (pudgier)
  "C 504 814, 498 834, 500 848",
  "C 502 858, 496 862, 488 858",
  // Right forearm inner (thicker)
  "C 484 836, 478 792, 472 748",
  "C 466 704, 462 660, 458 626",
  // Right armpit / torso (wider, fat rolls)
  "C 456 596, 460 560, 466 530",
  // Right waist — MUCH wider (love handles)
  "C 472 504, 480 480, 486 470",
  // Right love handle bulge
  "C 492 476, 496 490, 496 510",
  // Right hip (wide)
  "C 496 540, 496 570, 494 600",
  "C 492 630, 492 654, 490 674",
  // Right outer thigh (much thicker)
  "C 492 710, 496 750, 498 790",
  "C 500 830, 498 870, 492 910",
  "C 488 940, 482 960, 478 980",
  // Right knee (padded)
  "C 474 1000, 468 1014, 464 1028",
  // Right shin (thicker)
  "C 460 1056, 454 1108, 452 1160",
  "C 450 1210, 448 1250, 444 1282",
  // Right ankle (thicker)
  "C 442 1308, 438 1330, 432 1348",
  // Right foot (wider)
  "C 426 1370, 416 1388, 412 1392",
  "C 406 1400, 396 1400, 390 1390",
  // Right inner leg up
  "C 388 1378, 386 1338, 384 1290",
  "C 382 1240, 380 1190, 378 1140",
  "C 376 1090, 376 1040, 376 1000",
  // Inner thigh right (thick, nearly touching)
  "C 376 960, 376 920, 376 880",
  "C 376 840, 374 794, 372 754",
  // Crotch (higher due to inner thigh fat)
  "C 370 724, 366 706, 364 700",
  // Left inner thigh
  "C 362 706, 358 724, 356 754",
  "C 354 794, 352 840, 352 880",
  "C 352 920, 352 960, 352 1000",
  // Left inner leg down
  "C 352 1040, 352 1090, 350 1140",
  "C 348 1190, 346 1240, 344 1290",
  "C 342 1338, 340 1378, 338 1390",
  // Left foot (wider)
  "C 332 1400, 322 1400, 316 1392",
  "C 312 1388, 302 1370, 296 1348",
  // Left ankle (thicker)
  "C 290 1330, 286 1308, 284 1282",
  // Left shin (thicker)
  "C 280 1250, 278 1210, 276 1160",
  "C 274 1108, 268 1056, 264 1028",
  // Left knee (padded)
  "C 260 1014, 254 1000, 250 980",
  // Left outer thigh (much thicker)
  "C 246 960, 240 940, 236 910",
  "C 230 870, 228 830, 230 790",
  "C 232 750, 236 710, 238 674",
  // Left hip
  "C 236 654, 236 630, 234 600",
  "C 232 570, 232 540, 232 510",
  // Left love handle bulge
  "C 232 490, 236 476, 242 470",
  // Left waist — MUCH wider
  "C 248 480, 256 504, 262 530",
  // Left torso / armpit
  "C 268 560, 272 596, 270 626",
  "C 266 660, 262 704, 256 748",
  // Left forearm inner
  "C 250 792, 244 836, 240 858",
  // Left hand (pudgier)
  "C 232 862, 226 858, 228 848",
  "C 230 834, 224 814, 222 792",
  // Left forearm outer (thicker)
  "C 216 744, 208 696, 202 652",
  // Left elbow
  "C 196 628, 190 604, 186 580",
  // Left upper arm outer (much thicker)
  "C 180 546, 176 502, 180 468",
  "C 184 434, 192 400, 198 378",
  // Left shoulder
  "C 198 360, 208 334, 228 318",
  "C 252 300, 294 296, 314 296",
  // Neck left (thicker)
  "C 324 286, 332 276, 342 272",
  // Head — left side
  "C 320 260, 308 244, 308 212",
  "C 308 180, 328 165, 364 165",
  "Z",
].join(" ");

// --- BACK ---
// Back view is offset by +724 on x axis (viewBox "724 0 724 1448")
// Center at x ≈ 1088

const LEAN_BACK = [
  "M 1088 165",
  // Head — right side
  "C 1118 165, 1134 180, 1134 210",
  "C 1134 240, 1124 255, 1104 265",
  // Neck right
  "C 1112 268, 1118 280, 1124 290",
  // Right shoulder
  "C 1144 290, 1184 295, 1204 310",
  "C 1222 324, 1234 345, 1234 360",
  // Right upper arm outer
  "C 1236 380, 1240 410, 1242 440",
  "C 1244 470, 1242 510, 1238 540",
  // Right elbow
  "C 1236 560, 1232 580, 1228 600",
  // Right forearm outer
  "C 1224 640, 1218 690, 1214 740",
  // Right hand
  "C 1212 760, 1208 778, 1210 790",
  "C 1212 798, 1208 802, 1202 800",
  // Right forearm inner
  "C 1200 780, 1196 740, 1192 700",
  "C 1188 660, 1186 620, 1184 590",
  // Right torso
  "C 1182 560, 1180 520, 1178 490",
  // Right waist
  "C 1176 470, 1172 450, 1168 440",
  // Right hip
  "C 1164 460, 1162 490, 1164 520",
  "C 1166 550, 1172 570, 1178 590",
  // Right outer thigh
  "C 1184 620, 1190 660, 1192 700",
  "C 1194 740, 1194 780, 1192 820",
  "C 1190 860, 1186 900, 1180 930",
  // Right knee
  "C 1176 950, 1172 960, 1170 970",
  // Right shin
  "C 1168 990, 1164 1040, 1162 1090",
  "C 1160 1140, 1158 1190, 1156 1230",
  // Right ankle
  "C 1154 1260, 1152 1280, 1148 1300",
  // Right foot
  "C 1144 1320, 1136 1338, 1134 1342",
  "C 1130 1348, 1122 1348, 1118 1340",
  // Right inner leg up to crotch
  "C 1116 1330, 1114 1290, 1112 1240",
  "C 1110 1190, 1108 1140, 1106 1090",
  "C 1104 1040, 1102 990, 1100 950",
  // Inner thigh right
  "C 1098 920, 1096 880, 1094 840",
  "C 1092 800, 1090 750, 1090 710",
  // Crotch
  "C 1090 690, 1088 680, 1088 680",
  // Left inner thigh
  "C 1088 680, 1086 690, 1086 710",
  "C 1086 750, 1084 800, 1082 840",
  "C 1080 880, 1078 920, 1076 950",
  // Left inner leg down
  "C 1074 990, 1072 1040, 1070 1090",
  "C 1068 1140, 1066 1190, 1064 1240",
  "C 1062 1290, 1060 1330, 1058 1340",
  // Left foot
  "C 1054 1348, 1046 1348, 1042 1342",
  "C 1040 1338, 1032 1320, 1028 1300",
  // Left ankle
  "C 1024 1280, 1022 1260, 1020 1230",
  // Left shin
  "C 1018 1190, 1016 1140, 1014 1090",
  "C 1012 1040, 1008 990, 1006 970",
  // Left knee
  "C 1004 960, 1000 950, 996 930",
  // Left outer thigh
  "C 990 900, 986 860, 984 820",
  "C 982 780, 982 740, 984 700",
  "C 986 660, 992 620, 998 590",
  // Left hip
  "C 1004 570, 1010 550, 1012 520",
  "C 1014 490, 1012 460, 1008 440",
  // Left waist
  "C 1004 450, 1000 470, 998 490",
  // Left torso
  "C 996 520, 994 560, 992 590",
  "C 990 620, 988 660, 984 700",
  // Left forearm inner
  "C 980 740, 976 780, 974 800",
  // Left hand
  "C 968 802, 964 798, 966 790",
  "C 968 778, 964 760, 962 740",
  // Left forearm outer
  "C 958 690, 952 640, 948 600",
  // Left elbow
  "C 944 580, 940 560, 938 540",
  // Left upper arm outer
  "C 934 510, 932 470, 934 440",
  "C 936 410, 940 380, 942 360",
  // Left shoulder
  "C 942 345, 954 324, 972 310",
  "C 992 295, 1032 290, 1052 290",
  // Neck left
  "C 1058 280, 1064 268, 1072 265",
  // Head — left side
  "C 1052 255, 1042 240, 1042 210",
  "C 1042 180, 1058 165, 1088 165",
  "Z",
].join(" ");

const FAT_BACK = [
  "M 1088 165",
  // Head — right side (rounder)
  "C 1124 165, 1144 180, 1144 212",
  "C 1144 244, 1132 260, 1110 272",
  // Neck right (thicker)
  "C 1120 276, 1128 286, 1138 296",
  // Right shoulder (padded)
  "C 1158 296, 1200 300, 1224 318",
  "C 1244 334, 1254 360, 1254 378",
  // Right upper arm outer (much thicker)
  "C 1260 400, 1268 434, 1272 468",
  "C 1276 502, 1272 546, 1266 580",
  // Right elbow
  "C 1262 604, 1256 628, 1250 652",
  // Right forearm outer
  "C 1244 696, 1236 744, 1230 792",
  // Right hand
  "C 1228 814, 1222 834, 1224 848",
  "C 1226 858, 1220 862, 1212 858",
  // Right forearm inner
  "C 1208 836, 1202 792, 1196 748",
  "C 1190 704, 1186 660, 1182 626",
  // Right torso (wider back)
  "C 1180 596, 1184 560, 1190 530",
  // Right waist — MUCH wider
  "C 1196 504, 1204 480, 1210 470",
  // Right love handle / back fat
  "C 1216 476, 1220 490, 1220 510",
  // Right hip (wide)
  "C 1220 540, 1220 570, 1218 600",
  "C 1216 630, 1216 654, 1214 674",
  // Right outer thigh
  "C 1216 710, 1220 750, 1222 790",
  "C 1224 830, 1222 870, 1216 910",
  "C 1212 940, 1206 960, 1202 980",
  // Right knee
  "C 1198 1000, 1192 1014, 1188 1028",
  // Right shin
  "C 1184 1056, 1178 1108, 1176 1160",
  "C 1174 1210, 1172 1250, 1168 1282",
  // Right ankle
  "C 1166 1308, 1162 1330, 1156 1348",
  // Right foot
  "C 1150 1370, 1140 1388, 1136 1392",
  "C 1130 1400, 1120 1400, 1114 1390",
  // Right inner leg up
  "C 1112 1378, 1110 1338, 1108 1290",
  "C 1106 1240, 1104 1190, 1102 1140",
  "C 1100 1090, 1100 1040, 1100 1000",
  // Inner thigh right
  "C 1100 960, 1100 920, 1100 880",
  "C 1100 840, 1098 794, 1096 754",
  // Crotch
  "C 1094 724, 1090 706, 1088 700",
  // Left inner thigh
  "C 1086 706, 1082 724, 1080 754",
  "C 1078 794, 1076 840, 1076 880",
  "C 1076 920, 1076 960, 1076 1000",
  // Left inner leg down
  "C 1076 1040, 1076 1090, 1074 1140",
  "C 1072 1190, 1070 1240, 1068 1290",
  "C 1066 1338, 1064 1378, 1062 1390",
  // Left foot
  "C 1056 1400, 1046 1400, 1040 1392",
  "C 1036 1388, 1026 1370, 1020 1348",
  // Left ankle
  "C 1014 1330, 1010 1308, 1008 1282",
  // Left shin
  "C 1004 1250, 1002 1210, 1000 1160",
  "C 998 1108, 992 1056, 988 1028",
  // Left knee
  "C 984 1014, 978 1000, 974 980",
  // Left outer thigh
  "C 970 960, 964 940, 960 910",
  "C 954 870, 952 830, 954 790",
  "C 956 750, 960 710, 962 674",
  // Left hip
  "C 960 654, 960 630, 958 600",
  "C 956 570, 956 540, 956 510",
  // Left love handle / back fat
  "C 956 490, 960 476, 966 470",
  // Left waist — MUCH wider
  "C 972 480, 980 504, 986 530",
  // Left torso
  "C 992 560, 996 596, 994 626",
  "C 990 660, 986 704, 980 748",
  // Left forearm inner
  "C 974 792, 968 836, 964 858",
  // Left hand
  "C 956 862, 950 858, 952 848",
  "C 954 834, 948 814, 946 792",
  // Left forearm outer
  "C 940 744, 932 696, 926 652",
  // Left elbow
  "C 920 628, 914 604, 910 580",
  // Left upper arm outer (much thicker)
  "C 904 546, 900 502, 904 468",
  "C 908 434, 916 400, 922 378",
  // Left shoulder
  "C 922 360, 932 334, 952 318",
  "C 976 300, 1018 296, 1038 296",
  // Neck left (thicker)
  "C 1048 286, 1056 276, 1066 272",
  // Head — left side
  "C 1044 260, 1032 244, 1032 212",
  "C 1032 180, 1052 165, 1088 165",
  "Z",
].join(" ");

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns an SVG path string for a body-shaped fat overlay.
 * The path width scales with bodyFatPercent:
 *   10% → lean silhouette (barely visible)
 *   30% → fat silhouette (wide waist, love handles, thick limbs)
 */
export function getFatOverlayPath(
  bodyFatPercent: number,
  side: "front" | "back",
): string {
  const t = clamp((bodyFatPercent - 10) / 20, 0, 1);

  if (side === "front") {
    return lerpPath(LEAN_FRONT, FAT_FRONT, t);
  }
  return lerpPath(LEAN_BACK, FAT_BACK, t);
}
