import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { repairData } from "../lib/data";

export const ToolsScene = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const slideX = interpolate(frame, [0, 20], [width, 0], {
    extrapolateRight: "clamp",
  });

  const fadeIn = interpolate(frame, [10, 25], [0, 1], {
    extrapolateRight: "clamp",
  });

  const { tools, specs } = repairData;

  return (
    <div
      style={{
        width,
        height,
        background: "#0f172a",
        display: "flex",
        flexDirection: "column",
        padding: "60px 80px",
        fontFamily: "system-ui, sans-serif",
        transform: `translateX(${slideX}px)`,
      }}
    >
      <div
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: "#f8fafc",
          marginBottom: 40,
        }}
      >
        What You Need
      </div>

      <div style={{ display: "flex", gap: 60 }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#38bdf8",
              marginBottom: 20,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Tools
          </div>
          {tools.map((tool, i) => (
            <div
              key={i}
              style={{
                fontSize: 22,
                color: "#e2e8f0",
                marginBottom: 14,
                opacity: interpolate(
                  frame,
                  [15 + i * 3, 25 + i * 3],
                  [0, 1],
                  { extrapolateRight: "clamp" }
                ),
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ color: "#22c55e", fontSize: 20 }}>✓</span>
              {tool}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, opacity: fadeIn }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#38bdf8",
              marginBottom: 20,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            OEM Specs
          </div>
          {Object.entries(specs).map(([key, value], i) => (
            <div
              key={key}
              style={{
                background: "rgba(30, 41, 59, 0.8)",
                borderRadius: 8,
                padding: "16px 20px",
                marginBottom: 12,
                opacity: interpolate(
                  frame,
                  [20 + i * 4, 30 + i * 4],
                  [0, 1],
                  { extrapolateRight: "clamp" }
                ),
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 4,
                }}
              >
                {key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (s) => s.toUpperCase())}
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#f8fafc",
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
