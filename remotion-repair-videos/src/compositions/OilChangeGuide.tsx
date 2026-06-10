import { Sequence } from "remotion";
import { IntroScene } from "../scenes/IntroScene";
import { ToolsScene } from "../scenes/ToolsScene";
import { StepScene } from "../scenes/StepScene";
import { OutroScene } from "../scenes/OutroScene";
import { repairData } from "../lib/data";

const FPS = 30;

// Timing in frames
const INTRO_DURATION = 5 * FPS;
const TOOLS_DURATION = 10 * FPS;
const OUTRO_DURATION = 10 * FPS;

export const OilChangeGuide = () => {
  const { steps } = repairData;
  let currentFrame = 0;

  return (
    <>
      <Sequence from={currentFrame} durationInFrames={INTRO_DURATION}>
        <IntroScene />
      </Sequence>
      {currentFrame += INTRO_DURATION}

      <Sequence from={currentFrame} durationInFrames={TOOLS_DURATION}>
        <ToolsScene />
      </Sequence>
      {currentFrame += TOOLS_DURATION}

      {steps.map((step) => {
        const stepDuration = step.duration * FPS;
        const from = currentFrame;
        currentFrame += stepDuration;

        return (
          <Sequence key={step.number} from={from} durationInFrames={stepDuration}>
            <StepScene
              stepNumber={step.number}
              title={step.title}
              text={step.text}
              spec={step.spec}
              totalSteps={steps.length}
            />
          </Sequence>
        );
      })}

      <Sequence from={currentFrame} durationInFrames={OUTRO_DURATION}>
        <OutroScene />
      </Sequence>
    </>
  );
};
