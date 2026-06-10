import { useCurrentFrame, interpolate } from "remotion";

interface SpecOverlayProps {
  label: string;
  value: string;
  startFrame: number;
}

export const SpecOverlay = ({ label, value, startFrame }: SpecOverlayProps) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [startFrame, startFrame + 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  const y = interpolate(frame, [startFrame, startFrame + 10], [20, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        right: 60,
        background: "rgba(15, 23, 42, 0.95)",
        border: "2px solid #38bdf8",
        borderRadius: 12,
        padding: "20px 28px",
        opacity,
        transform: `translateY(${y}px)`,
        backdropFilter: "blur(8px)",
        fontFamily: "system-ui, sans-serif",
        maxWidth: 320,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: "#38bdf8",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: "#f8fafc",
        }}
      >
        {value}
      </div>
    </div>
  );
};
