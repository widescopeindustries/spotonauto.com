import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

export const OutroScene = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const scale = spring({
    frame: frame - 5,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const fadeIn = interpolate(frame, [10, 25], [0, 1], {
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
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#f8fafc",
            marginBottom: 20,
          }}
        >
          You're All Set
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#38bdf8",
            fontWeight: 600,
          }}
        >
          2010 Toyota Camry — Oil Change Complete
        </div>
      </div>

      <div
        style={{
          marginTop: 50,
          opacity: fadeIn,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 20,
            color: "#94a3b8",
          }}
        >
          Every spec verified against OEM factory service manuals
        </div>
        <div
          style={{
            fontSize: 18,
            color: "#64748b",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          alloemmanuals.com
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 50,
          opacity: fadeIn,
          fontSize: 16,
          color: "#475569",
          textAlign: "center",
        }}
      >
        CHARM + LEMON Archives • 300K+ Vehicles • Factory Data
      </div>
    </div>
  );
};
