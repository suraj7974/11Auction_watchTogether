import Dither from "@/components/dither";

/** App-wide subtle dithered-wave background. */
export function AppBackground() {
  return (
    <>
      <div className="fixed inset-0 -z-10">
        <Dither
          waveColor={[0.62, 0.62, 0.68]}
          waveSpeed={0.04}
          waveFrequency={3}
          waveAmplitude={0.25}
          colorNum={5}
          enableMouseInteraction
          mouseRadius={0.4}
        />
      </div>
      <div className="fixed inset-0 -z-10 bg-background/40" />
    </>
  );
}
