import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SpecOverlay } from "../components/SpecOverlay";
import { ProgressBar } from "../components/ProgressBar";

interface StepSceneProps {
  stepNumber: number;
  title: string;
  text: string;
  spec: { label: string; value: string } | null;
  totalSteps: number;
}

export const StepScene = ({
  stepNumber,
  title,
  text,
  spec,
  totalSteps,
}: StepSceneProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const titleSlide = spring({
    frame: frame - 5,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  const textFade = interpolate(frame, [10, 25], [0, 1], {
    extrapolateRight: "clamp",
  });

  const circleScale = spring({
    frame: frame - 2,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  return (
    <div
      style={{
        width,
        height,
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
        display: "flex",
        flexDirection: "column",
        padding: "80px 100px",
        fontFamily: "system-ui, sans-serif",
        position: "relative",
      }}
    >
      <ProgressBar currentStep={stepNumber} totalSteps={totalSteps} />

      <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 20 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #38bdf8, #0ea5e9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 800,
            color: "#0f172a",
            transform: `scale(${circleScale})`,
            flexShrink: 0,
          }}
        >
          {stepNumber}
        </div>

        <div
          style={{
            fontSize: 44,
            fontWeight: 800,
            color: "#f8fafc",
            transform: `translateX(${(1 - titleSlide) * -40}px)`,
            opacity: titleSlide,
          }}
        >
          {title}
        </div>
      </div>

      <div
        style={{
          marginTop: 40,
          fontSize: 28,
          lineHeight: 1.5,
          color: "#e2e8f0",
          maxWidth: 900,
          opacity: textFade,
        }}
      >
        {text}
      </div>

      {spec && (
        <SpecOverlay
          label={spec.label}
          value={spec.value}
          startFrame={20}
        />
      )}

      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 100,
          fontSize: 14,
          color: "#64748b",
          letterSpacing: "0.05em",
        }}
      >
        Step {stepNumber} of {totalSteps}
      </div>
    </div>
  );
};
