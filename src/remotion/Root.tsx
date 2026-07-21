import {Composition, registerRoot} from 'remotion';
import {EducationalReel} from './EducationalReel';
import {
  DEFAULT_EDUCATIONAL_REEL_PROPS,
  EDUCATIONAL_REEL_ID,
  REEL_DURATION_IN_FRAMES,
  REEL_FPS,
  REEL_HEIGHT,
  REEL_WIDTH,
} from './config';

export const RemotionRoot = () => (
  <Composition
    id={EDUCATIONAL_REEL_ID}
    component={EducationalReel}
    width={REEL_WIDTH}
    height={REEL_HEIGHT}
    fps={REEL_FPS}
    durationInFrames={REEL_DURATION_IN_FRAMES}
    defaultProps={DEFAULT_EDUCATIONAL_REEL_PROPS}
    calculateMetadata={({props}) => ({
      durationInFrames: props.spec.durationInFrames ?? REEL_DURATION_IN_FRAMES,
    })}
  />
);

registerRoot(RemotionRoot);

export default RemotionRoot;
