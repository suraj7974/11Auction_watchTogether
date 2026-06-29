import { Suspense } from "react";

import { WelcomeOverlay } from "@/components/welcome-overlay";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <WelcomeOverlay />
      </Suspense>
      {children}
    </>
  );
}
