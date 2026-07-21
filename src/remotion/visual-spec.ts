/**
 * A deliberately small, JSON-serializable contract for educational motion.
 * The model describes meaning; deterministic renderers decide how it moves.
 */
export type MotionGrammar =
  | 'energy-transfer'
  | 'spatial-process'
  | 'linear-process'
  | 'cycle'
  | 'comparison'
  | 'timeline'
  | 'network'
  | 'equation'
  | 'math-equation'
  | 'physics-diagram';

export type MotionNodeKind =
  | 'location'
  | 'input'
  | 'process'
  | 'carrier'
  | 'machine'
  | 'output';

export interface MotionNode {
  id: string;
  label: string;
  kind: MotionNodeKind;
  detail?: string;
  value?: string;
  /** Optional normalized coordinates, from 0 to 1, for spatial/network scenes. */
  x?: number;
  y?: number;
  accent?: string;
}

export interface MotionLink {
  from: string;
  to: string;
  label: string;
}

export interface MotionAssets {
  /** Remote or data URL. The deterministic diagram remains legible without it. */
  artImageUrl?: string;
  backgroundImageUrl?: string;
  audioUrl?: string;
}

export interface NarrativeBeat {
  label: string;
  headline: string;
  body: string;
}

export interface MotionDirection {
  /** Controls ambient drift and the energy of deterministic entrances. */
  tempo: 'measured' | 'balanced' | 'brisk';
  /** Modulates the selected style's reviewed transition physics. */
  transitionEnergy: 'gentle' | 'balanced' | 'punchy';
  /** Relative timing emphasis for hook, model, example, and recall. */
  beatEmphasis: [number, number, number, number];
}

export type MathEquationMode = 'derive' | 'solve' | 'substitute' | 'compare';

export interface MathEquationStep {
  /** Plain text or Unicode maths only. It is rendered as text and never evaluated. */
  expression: string;
  explanation: string;
  focus: string;
}

export interface MathVariable {
  symbol: string;
  meaning: string;
  unit: string;
}

export interface MathEquationMotion {
  mode: MathEquationMode;
  steps: MathEquationStep[];
  variables: MathVariable[];
}

export type PhysicsDiagramKind = 'free-body' | 'trajectory' | 'oscillation' | 'wave' | 'circuit' | 'ray';
export type PhysicsBodyShape = 'block' | 'ball' | 'charge' | 'mass' | 'source' | 'lens' | 'marker';
export type PhysicsQuantity = 'force' | 'velocity' | 'acceleration' | 'field' | 'current' | 'ray';
export type PhysicsPathKind = 'static' | 'linear' | 'parabolic' | 'circular' | 'oscillating' | 'sine';

export interface PhysicsBody {
  id: string;
  label: string;
  shape: PhysicsBodyShape;
  /** Normalized stage coordinates and size, clamped by the renderer. */
  x: number;
  y: number;
  size: number;
}

export interface PhysicsVector {
  originId: string;
  label: string;
  quantity: PhysicsQuantity;
  /** Physics coordinates: positive x points right and positive y points up. */
  dx: number;
  dy: number;
  magnitudeLabel: string;
}

export interface PhysicsPath {
  bodyId: string;
  kind: PhysicsPathKind;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  curvature: number;
  amplitude: number;
  cycles: number;
}

export interface PhysicsAnnotation {
  text: string;
  x: number;
  y: number;
}

export interface PhysicsDiagramMotion {
  kind: PhysicsDiagramKind;
  bodies: PhysicsBody[];
  vectors: PhysicsVector[];
  paths: PhysicsPath[];
  annotations: PhysicsAnnotation[];
}

export interface ThemeTokens {
  ink: string;
  muted: string;
  paper: string;
  panel: string;
  accent: string;
  accentAlt: string;
  success: string;
  warning: string;
  line: string;
  fontFamily: string;
  displayFamily: string;
  radius: number;
}

export type ThemeTokenName = keyof ThemeTokens;
export type ReelTheme = ThemeTokens;
export type ReelThemeId = 'kinetic' | 'editorial' | 'field-notes' | 'neon-lab';

export const THEME: Readonly<ThemeTokens> = {
  ink: '#F7F7F2',
  muted: '#A7ADBA',
  paper: '#090C12',
  panel: '#121824',
  accent: '#D9FF63',
  accentAlt: '#7C6CFF',
  success: '#55E6A5',
  warning: '#FFB45C',
  line: 'rgba(247, 247, 242, 0.16)',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  displayFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  radius: 40,
};

export const REEL_THEMES: Readonly<Record<ReelThemeId, ReelTheme>> = {
  kinetic: {
    ...THEME,
    paper: '#100C1D',
    panel: '#1A142C',
    accent: '#D9FF63',
    accentAlt: '#8C72FF',
    success: '#63F0B4',
    warning: '#FFBD5E',
    fontFamily: '"Avenir Next", Inter, ui-sans-serif, system-ui, sans-serif',
    displayFamily: '"Arial Black", Impact, ui-sans-serif, sans-serif',
    radius: 28,
  },
  editorial: {
    ...THEME,
    ink: '#2B1A18',
    muted: '#75615A',
    paper: '#EFE3D1',
    panel: '#FFF8EA',
    accent: '#B84B3E',
    accentAlt: '#D79B2E',
    success: '#3E765B',
    warning: '#A95F30',
    line: 'rgba(43, 26, 24, 0.2)',
    fontFamily: 'Georgia, "Times New Roman", serif',
    displayFamily: 'Georgia, "Times New Roman", serif',
    radius: 10,
  },
  'field-notes': {
    ...THEME,
    paper: '#0E1A16',
    panel: '#172821',
    accent: '#E6D46A',
    accentAlt: '#5EBB91',
    success: '#7DE2AF',
    warning: '#F5B85E',
    fontFamily: '"Avenir Next", "Trebuchet MS", ui-sans-serif, sans-serif',
    displayFamily: '"Trebuchet MS", "Avenir Next", ui-sans-serif, sans-serif',
    radius: 22,
  },
  'neon-lab': {
    ...THEME,
    paper: '#090D18',
    panel: '#11192B',
    accent: '#51E3F3',
    accentAlt: '#FF70C6',
    success: '#72F0A9',
    warning: '#FFD166',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    displayFamily: '"SFMono-Regular", Menlo, Consolas, ui-monospace, monospace',
    radius: 16,
  },
};

export const resolveReelThemeId = (id: string | null | undefined): ReelThemeId => {
  if (id === 'editorial' || id === 'field-notes' || id === 'neon-lab' || id === 'kinetic') {
    return id;
  }
  return 'kinetic';
};

export const resolveReelTheme = (id: string | null | undefined): ReelTheme => REEL_THEMES[resolveReelThemeId(id)];

export interface MotionSpec {
  grammar: MotionGrammar;
  title: string;
  setting: string;
  objective: string;
  takeHome: string;
  nodes: MotionNode[];
  links: MotionLink[];
  mathEquation?: MathEquationMotion | null;
  physicsDiagram?: PhysicsDiagramMotion | null;
  /** Safe LLM-authored direction values. No executable motion code is accepted. */
  motionDirection?: MotionDirection;
  /** Four source-grounded caption beats authored with the lesson, never executable content. */
  narrativeBeats?: NarrativeBeat[];
  theme?: Partial<ThemeTokens>;
  assets?: MotionAssets;
  durationInFrames?: number;
}

/**
 * Render-fixture and fallback props for the first proof composition. Every
 * label in the ATP reaction is supplied as data rather than embedded in the
 * renderer, so the same grammar can visualize other energy-transfer systems.
 */
export const ATP_DEMO_SPEC: MotionSpec = {
  grammar: 'energy-transfer',
  title: 'How cells mint ATP',
  setting: 'Inside the inner mitochondrial membrane',
  objective: 'Follow stored proton energy as it becomes a usable ATP bond.',
  takeHome: 'A proton gradient turns ATP synthase, coupling H⁺ flow to ADP + Pi → ATP.',
  durationInFrames: 360,
  nodes: [
    {
      id: 'inner-membrane',
      label: 'Inner mitochondrial membrane',
      kind: 'location',
      detail: 'Separates the intermembrane space from the matrix',
      x: 0.5,
      y: 0.48,
    },
    {
      id: 'proton-gradient',
      label: 'H⁺ gradient',
      kind: 'input',
      detail: 'High concentration outside; low concentration inside',
      x: 0.25,
      y: 0.25,
      accent: '#FFB45C',
    },
    {
      id: 'atp-synthase',
      label: 'ATP synthase',
      kind: 'machine',
      detail: 'A molecular turbine embedded in the membrane',
      x: 0.5,
      y: 0.52,
      accent: '#D9FF63',
    },
    {
      id: 'adp',
      label: 'ADP',
      kind: 'carrier',
      detail: 'Lower-energy nucleotide',
      x: 0.25,
      y: 0.76,
    },
    {
      id: 'phosphate',
      label: 'Pi',
      kind: 'input',
      detail: 'Inorganic phosphate',
      x: 0.4,
      y: 0.76,
    },
    {
      id: 'atp',
      label: 'ATP',
      kind: 'output',
      detail: 'Immediately usable cellular energy',
      x: 0.76,
      y: 0.76,
      accent: '#55E6A5',
    },
  ],
  links: [
    {
      from: 'proton-gradient',
      to: 'atp-synthase',
      label: 'H⁺ flows down its gradient',
    },
    {from: 'adp', to: 'atp-synthase', label: 'ADP enters'},
    {from: 'phosphate', to: 'atp-synthase', label: 'Pi joins'},
    {from: 'atp-synthase', to: 'atp', label: 'ATP exits'},
  ],
};
