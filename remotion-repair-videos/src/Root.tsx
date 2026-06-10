import { Composition } from "remotion";
import { OilChangeGuide } from "./compositions/OilChangeGuide";

const FPS = 30;
const INTRO = 5 * FPS;
const TOOLS = 10 * FPS;
const STEPS = [10, 15, 15, 15, 10].map((s) => s * FPS);
const OUTRO = 10 * FPS;
const TOTAL_DURATION = INTRO + TOOLS + STEPS.reduce((a, b) => a + b, 0) + OUTRO;

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="OilChangeGuide"
        component={OilChangeGuide}
        durationInFrames={TOTAL_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
