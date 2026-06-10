import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

export const IntroScene = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const subtitleOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width,
        height,
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#f8fafc",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Oil Change
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 600,
            color: "#38bdf8",
            marginTop: 12,
          }}
        >
          2010 Toyota Camry
        </div>
      </div>

      <div
        style={{
          opacity: subtitleOpacity,
          marginTop: 40,
          display: "flex",
          gap: 24,
          fontSize: 18,
          color: "#94a3b8",
          fontWeight: 500,
        }}
      >
        <span>OEM Factory Specs</span>
        <span>•</span>
        <span>Step-by-Step</span>
        <span>•</span>
        <span>Exact Torques</span>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 40,
          opacity: subtitleOpacity,
          fontSize: 14,
          color: "#64748b",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        alloemmanuals.com
      </div>
    </div>
  );
};
