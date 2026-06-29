"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { WelcomeIntro } from "@/components/welcome-intro";

/**
 * Lives in the dashboard layout so it renders instantly on navigation — before
 * the page's data loads — covering the loading skeleton with the welcome intro.
 */
export function WelcomeOverlay() {
  const params = useSearchParams();
  // Capture once so stripping the URL flag doesn't unmount mid-animation.
  const [active] = useState(params.get("welcome") === "1");

  useEffect(() => {
    if (!active) return;
    // Remove the flag so a refresh doesn't replay the intro.
    window.history.replaceState(null, "", window.location.pathname);
  }, [active]);

  if (!active) return null;
  return <WelcomeIntro />;
}
