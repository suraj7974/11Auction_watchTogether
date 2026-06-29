"use client";

import { useEffect, useState } from "react";
import { Clapperboard } from "lucide-react";

import Hyperspeed from "@/components/hyperspeed";

// Stable reference so the WebGL scene isn't recreated on re-render.
// Monochrome palette to match the app's neutral (grayscale) theme.
const HYPERSPEED_OPTIONS = {
  onSpeedUp: () => {},
  onSlowDown: () => {},
  distortion: "turbulentDistortion",
  length: 400,
  roadWidth: 10,
  islandWidth: 2,
  lanesPerRoad: 3,
  fov: 90,
  fovSpeedUp: 150,
  speedUp: 2,
  carLightsFade: 0.4,
  totalSideLightSticks: 20,
  lightPairsPerRoadWay: 40,
  shoulderLinesWidthPercentage: 0.05,
  brokenLinesWidthPercentage: 0.1,
  brokenLinesLengthPercentage: 0.5,
  lightStickWidth: [0.12, 0.5],
  lightStickHeight: [1.3, 1.7],
  movingAwaySpeed: [60, 80],
  movingCloserSpeed: [-120, -160],
  carLightsLength: [400 * 0.03, 400 * 0.2],
  carLightsRadius: [0.05, 0.14],
  carWidthPercentage: [0.3, 0.5],
  carShiftX: [-0.8, 0.8],
  carFloorSeparation: [0, 5],
  // Monochrome to match the app's neutral (grayscale) theme.
  colors: {
    roadColor: 0x080808,
    islandColor: 0x080808,
    background: 0x000000,
    shoulderLines: 0x202020,
    brokenLines: 0x202020,
    leftCars: [0xffffff, 0xe5e5e5, 0xfafafa],
    rightCars: [0xd4d4d4, 0xa3a3a3, 0xffffff],
    sticks: 0xffffff,
  },
};

const HOLD_MS = 2000;
const FADE_MS = 700;
const LINE_MS = 700;

const WITTY_LINES = [
  "Buttering the popcorn…",
  "Dimming the lights…",
  "Untangling the HDMI cables…",
  "Shushing the back row…",
  "Cueing up the trailers…",
  "Syncing everyone's clocks…",
  "Bribing the buffering gods…",
  "Finding the remote…",
  "Saving you the aisle seat…",
];

/** Brief Hyperspeed "logging you in" splash shown once right after sign-in. */
export function WelcomeIntro() {
  const [phase, setPhase] = useState<"in" | "out" | "done">("in");
  const [line, setLine] = useState(0);

  useEffect(() => {
    // Strip the ?welcome flag so a refresh doesn't replay the intro.
    window.history.replaceState(null, "", window.location.pathname);

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const skip = setTimeout(() => setPhase("done"), 0);
      return () => clearTimeout(skip);
    }
    const hold = setTimeout(() => setPhase("out"), HOLD_MS);
    const finish = setTimeout(() => setPhase("done"), HOLD_MS + FADE_MS);
    const cycle = setInterval(() => setLine((i) => (i + 1) % WITTY_LINES.length), LINE_MS);
    return () => {
      clearTimeout(hold);
      clearTimeout(finish);
      clearInterval(cycle);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      onClick={() => setPhase("out")}
      className={`fixed inset-0 z-[100] cursor-pointer ${
        phase === "out" ? "bg-background" : "bg-black"
      }`}
      // The animation plays at full opacity, then is cut instantly (children
      // removed, bg flips to the app color). The solid app-background then fades
      // out — so the dashboard fades IN (light over light, never a muddy
      // dark-over-light crossfade).
      style={{ opacity: phase === "out" ? 0 : 1, transition: "opacity 700ms ease-out" }}
      aria-hidden
    >
      {phase !== "out" && (
        <>
          <div className="absolute inset-0 [&_canvas]:block [&_canvas]:size-full">
            <Hyperspeed effectOptions={HYPERSPEED_OPTIONS} />
          </div>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center gap-3 pt-[14vh] text-center text-white">
            <span className="text-3xl font-semibold tracking-tight drop-shadow-lg sm:text-4xl">
              Logging you in…
            </span>
            <span
              key={line}
              className="animate-fade-in flex items-center gap-2 text-sm text-white/70"
            >
              <Clapperboard className="size-4" /> {WITTY_LINES[line]}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
