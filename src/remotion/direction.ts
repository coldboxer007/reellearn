import type { MotionSpec, NarrativeBeat, ReelThemeId } from './visual-spec.ts';

export type StoryBeatRole = 'hook' | 'model' | 'example' | 'recall';
export type DirectionBackground = 'kinetic-shards' | 'editorial-paper' | 'field-contours' | 'neon-grid';
export type DirectionTransition = 'snap' | 'folio' | 'sketch' | 'scan';
export type DirectionCaption = 'impact' | 'folio' | 'note' | 'terminal';

export interface ReelDirectionProfile {
  id: ReelThemeId;
  label: string;
  background: DirectionBackground;
  transition: DirectionTransition;
  caption: DirectionCaption;
  stage: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    radius: number;
    rotation: number;
    borderWidth: number;
    borderStyle: 'solid' | 'dashed' | 'double';
  };
  heading: {
    top: number;
    left: number;
    right: number;
    align: 'left' | 'center';
    scale: number;
    uppercase: boolean;
  };
}

export interface StoryboardBeat {
  role: StoryBeatRole;
  visualKind: string;
  beat: NarrativeBeat;
  startFrame: number;
  durationInFrames: number;
}

const ROLES: StoryBeatRole[] = ['hook', 'model', 'example', 'recall'];

export const REEL_DIRECTIONS: Readonly<Record<ReelThemeId, ReelDirectionProfile>> = {
  kinetic: {
    id: 'kinetic',
    label: 'Kinetic cut',
    background: 'kinetic-shards',
    transition: 'snap',
    caption: 'impact',
    stage: { left: 50, right: 82, top: 242, bottom: 448, radius: 52, rotation: -0.55, borderWidth: 2, borderStyle: 'solid' },
    heading: { top: 88, left: 60, right: 156, align: 'left', scale: 1.08, uppercase: false },
  },
  editorial: {
    id: 'editorial',
    label: 'Editorial folio',
    background: 'editorial-paper',
    transition: 'folio',
    caption: 'folio',
    stage: { left: 76, right: 76, top: 258, bottom: 456, radius: 10, rotation: 0, borderWidth: 3, borderStyle: 'double' },
    heading: { top: 82, left: 104, right: 104, align: 'center', scale: 0.96, uppercase: false },
  },
  'field-notes': {
    id: 'field-notes',
    label: 'Field notebook',
    background: 'field-contours',
    transition: 'sketch',
    caption: 'note',
    stage: { left: 62, right: 62, top: 236, bottom: 448, radius: 22, rotation: 0.35, borderWidth: 2, borderStyle: 'dashed' },
    heading: { top: 96, left: 82, right: 128, align: 'left', scale: 1, uppercase: false },
  },
  'neon-lab': {
    id: 'neon-lab',
    label: 'Neon instrument',
    background: 'neon-grid',
    transition: 'scan',
    caption: 'terminal',
    stage: { left: 68, right: 68, top: 240, bottom: 448, radius: 38, rotation: 0, borderWidth: 1, borderStyle: 'solid' },
    heading: { top: 105, left: 72, right: 72, align: 'left', scale: 1, uppercase: false },
  },
};

export function resolveReelDirection(id: string | null | undefined) {
  if (id === 'editorial' || id === 'field-notes' || id === 'neon-lab' || id === 'kinetic') {
    return REEL_DIRECTIONS[id];
  }
  return REEL_DIRECTIONS.kinetic;
}

function fallbackBeats(spec: MotionSpec): NarrativeBeat[] {
  const contentNodes = spec.nodes.filter((node) => node.kind !== 'location');
  const firstLink = spec.links[0]?.label ?? spec.objective;
  const secondLink = spec.links[1]?.label ?? spec.takeHome;
  return [
    { label: 'Question first', headline: spec.title, body: spec.objective },
    { label: 'Build the model', headline: contentNodes[0]?.label ?? spec.objective, body: firstLink },
    { label: 'Watch the connection', headline: contentNodes[1]?.label ?? spec.takeHome, body: secondLink },
    { label: 'Retrieve it', headline: 'What will you keep?', body: 'Answer aloud before the payoff appears.' },
  ];
}

function visualKind(spec: MotionSpec, role: StoryBeatRole) {
  if (spec.grammar === 'math-equation') {
    return role === 'hook' ? 'equation-teaser'
      : role === 'model' ? 'equation-construction'
        : role === 'example' ? 'worked-transformation'
          : 'equation-retrieval';
  }
  if (spec.grammar === 'physics-diagram') {
    return role === 'hook' ? 'phenomenon-teaser'
      : role === 'model' ? 'diagram-setup'
        : role === 'example' ? 'motion-and-vectors'
          : 'diagram-retrieval';
  }
  return `${spec.grammar}-${role === 'hook' ? 'teaser' : role === 'model' ? 'system' : role === 'example' ? 'connection' : 'retrieval'}`;
}

function allocateDurations(beats: NarrativeBeat[], totalFrames: number, emphasis?: [number, number, number, number]) {
  const minimum = Math.max(1, Math.min(45, Math.floor(totalFrames / Math.max(1, beats.length * 2))));
  const remaining = Math.max(0, totalFrames - minimum * beats.length);
  const weights = beats.map((beat, index) => {
    const wordWeight = Math.max(1, beat.body.trim().split(/\s+/).filter(Boolean).length);
    const directionWeight = Math.min(4, Math.max(1, emphasis?.[index] ?? 1));
    return wordWeight * directionWeight;
  });
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const durations = weights.map((weight) => minimum + Math.floor((remaining * weight) / weightTotal));
  let unassigned = totalFrames - durations.reduce((sum, duration) => sum + duration, 0);
  let index = 0;
  while (unassigned > 0) {
    durations[index % durations.length] += 1;
    index += 1;
    unassigned -= 1;
  }
  return durations;
}

export function buildStoryboard(spec: MotionSpec, totalFrames: number): StoryboardBeat[] {
  const supplied = spec.narrativeBeats?.filter((beat) => beat.headline.trim() && beat.body.trim()).slice(0, 4) ?? [];
  const fallback = fallbackBeats(spec);
  const beats = ROLES.map((_, index) => supplied[index] ?? fallback[index]);
  const durations = allocateDurations(beats, totalFrames, spec.motionDirection?.beatEmphasis);
  let startFrame = 0;
  return beats.map((beat, index) => {
    const storyboardBeat: StoryboardBeat = {
      role: ROLES[index],
      visualKind: visualKind(spec, ROLES[index]),
      beat,
      startFrame,
      durationInFrames: durations[index],
    };
    startFrame += durations[index];
    return storyboardBeat;
  });
}

export function activeStoryboardBeat(storyboard: StoryboardBeat[], frame: number) {
  return storyboard.find((beat) => frame >= beat.startFrame && frame < beat.startFrame + beat.durationInFrames)
    ?? storyboard.at(-1)!;
}

export function pacedCaptionWordIndex(localFrame: number, durationInFrames: number, wordCount: number) {
  if (wordCount <= 1) return 0;
  const usableDuration = Math.max(1, durationInFrames - 1);
  const progress = Math.min(1, Math.max(0, localFrame / usableDuration));
  return Math.min(wordCount - 1, Math.floor(progress * wordCount));
}
