import type {MotionSpec, ReelTheme, ReelThemeId} from './visual-spec.ts';
import {ATP_DEMO_SPEC, resolveReelTheme} from './visual-spec.ts';

export const EDUCATIONAL_REEL_ID = 'EducationalReel';
export const REEL_WIDTH = 1080;
export const REEL_HEIGHT = 1920;
export const REEL_FPS = 30;
export const REEL_DURATION_IN_FRAMES = 360;

type RegisteredReelProps = {
  spec: MotionSpec;
  theme: ReelTheme;
  directionId: ReelThemeId;
  audioUrl?: string | null;
};

export const DEFAULT_EDUCATIONAL_REEL_PROPS: RegisteredReelProps = {
  spec: ATP_DEMO_SPEC,
  theme: resolveReelTheme('neon-lab'),
  directionId: 'neon-lab',
  audioUrl: null,
};
