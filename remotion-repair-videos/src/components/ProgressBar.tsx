import { useVideoConfig } from "remotion";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressBar = ({ currentStep, totalSteps }: ProgressBarProps) => {
  const { width } = useVideoConfig();
  const progress = currentStep / totalSteps;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height: 6,
        background: "rgba(30, 41, 59, 0.8)",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress * 100}%`,
          background: "linear-gradient(90deg, #38bdf8, #22c55e)",
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
};
