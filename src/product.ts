import type {
  MathEquationMotion as RemotionMathEquationMotion,
  MotionGrammar as RemotionMotionGrammar,
  MotionLink as RemotionMotionLink,
  MotionNode as RemotionMotionNode,
  MotionSpec as RemotionMotionSpec,
  PhysicsDiagramMotion as RemotionPhysicsDiagramMotion,
} from './remotion/visual-spec';

export type ViewId = 'today' | 'create' | 'library' | 'plan' | 'classroom';

export type OutputFormat = 'reel' | 'post' | 'playable';

export type ConcreteTemplateId = 'kinetic' | 'editorial' | 'field-notes' | 'neon-lab';
export type TemplateId = 'auto' | ConcreteTemplateId;

export type InfographicGrammar =
  | 'linear-process'
  | 'cycle'
  | 'anatomy-cutaway'
  | 'spatial-process'
  | 'comparison'
  | 'timeline'
  | 'network'
  | 'hierarchy'
  | 'equation'
  | 'data-evidence'
  | 'visual-metaphor';

export type MotionGrammar = RemotionMotionGrammar;
export type MotionNode = RemotionMotionNode;
export type MotionLink = RemotionMotionLink;
export type MotionSpec = RemotionMotionSpec;
export type MathEquationMotion = RemotionMathEquationMotion;
export type PhysicsDiagramMotion = RemotionPhysicsDiagramMotion;

export interface TemplateSpec {
  id: TemplateId;
  name: string;
  eyebrow: string;
  description: string;
  accent: string;
  accent2: string;
  surface: string;
  ink: string;
}

export interface TopicLesson {
  id: string;
  title: string;
  unit: string;
  scheduledDate: string;
  minutes: number;
  status: 'ready' | 'next' | 'later' | 'complete';
  summary: string;
  keyFacts: [string, string, string];
  question: string;
  answers: [string, string, string, string];
  correctAnswer: number;
  explanation: string;
  styleId?: ConcreteTemplateId;
  reelScenes?: [ReelScene, ReelScene, ReelScene, ReelScene];
  infographicSlides?: InfographicSlide[];
  motionPlan?: MotionSpec;
  motionVideo?: GeneratedVideo;
  visual?: GeneratedVisual;
  narration?: GeneratedNarration;
  arc?: {
    position: number;
    total: number;
    role: 'foundation' | 'build' | 'application' | 'synthesis';
    prerequisiteTopicIds: string[];
    bridgeFromPrevious: string | null;
  };
}

export interface InfographicSlide {
  role: 'concept-map' | 'mechanism' | 'retrieval';
  grammar: InfographicGrammar;
  title: string;
  subtitle: string;
  exactText: string[];
  facts: string[];
  artDirection: string;
  imageAlt: string;
  image?: GeneratedVisual;
}

export interface ReelScene {
  label: string;
  headline: string;
  body: string;
}

export interface GeneratedVisual {
  url: string;
  alt: string;
  provider: string;
}

export interface GeneratedNarration {
  url: string;
  provider: string;
}

export interface GeneratedVideo {
  url: string;
  provider: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
}

export interface GenerationMetadata {
  provider: 'openai' | 'local';
  textModel: string;
  imageModel: string | null;
  audioModel: string | null;
  sourceQuality: 'sufficient' | 'outline_only' | 'irrelevant';
  sourceNote: string;
  warnings: string[];
  research?: {
    query: string;
    sources: Array<{ title: string; url: string }>;
    searchedAt: string;
  };
}

export interface CourseWorkspace {
  id: string;
  title: string;
  subject: string;
  sourceName: string;
  sourceKind: string;
  examDate: string;
  hoursPerWeek: number;
  level: string;
  templateId: TemplateId;
  outputs: OutputFormat[];
  topics: TopicLesson[];
  createdAt: string;
  generation?: GenerationMetadata;
}

function compactLabel(value: string, words = 4) {
  return value.replace(/[.!?]$/, '').split(/\s+/).slice(0, words).join(' ').toUpperCase();
}

export function inferInfographicGrammar(topic: Pick<TopicLesson, 'title' | 'summary'>): InfographicGrammar {
  const value = `${topic.title} ${topic.summary}`.toLowerCase();
  if (/cycle|loop|recycl/.test(value)) return 'cycle';
  if (/cell|membrane|organ|anatom|mitochond|cytosol|matrix/.test(value)) return 'spatial-process';
  if (/versus|\bvs\b|compare|difference|misconception/.test(value)) return 'comparison';
  if (/history|century|era|revolution|evolution/.test(value)) return 'timeline';
  if (/network|ecosystem|web|relationship/.test(value)) return 'network';
  if (/equation|formula|derivative|integral|reaction/.test(value)) return 'equation';
  if (/steps?|moves?|pathway|process|glycolysis|transport|fermentation/.test(value)) return 'linear-process';
  return 'visual-metaphor';
}

export function deriveInfographicSlides(topic: TopicLesson): InfographicSlide[] {
  const grammar = inferInfographicGrammar(topic);
  const labels = topic.keyFacts.map((fact) => compactLabel(fact, 3));
  const mechanismGrammar: InfographicGrammar = grammar === 'visual-metaphor'
    ? 'linear-process'
    : grammar === 'comparison'
      ? 'network'
      : grammar;
  return [
    {
      role: 'concept-map', grammar, title: topic.title, subtitle: topic.summary,
      exactText: [compactLabel(topic.title, 5), labels[0], labels[1]], facts: topic.keyFacts.slice(0, 2),
      artDirection: `A topic-native ${grammar} composition with one dominant visual and direct labels.`,
      imageAlt: `${grammar.replace('-', ' ')} infographic for ${topic.title}.`,
    },
    {
      role: 'mechanism', grammar: mechanismGrammar, title: 'How the pieces connect', subtitle: topic.keyFacts[0],
      exactText: ['HOW IT WORKS', ...labels], facts: topic.keyFacts,
      artDirection: `A mechanism-first composition showing truthful relations for ${topic.title}.`,
      imageAlt: `Mechanism diagram for ${topic.title}.`,
    },
    {
      role: 'retrieval', grammar: 'comparison', title: topic.question, subtitle: `Answer: ${topic.answers[topic.correctAnswer]}`,
      exactText: ['RETRIEVE', labels[0], labels[2], 'WHAT CHANGES?'], facts: [topic.explanation, topic.summary],
      artDirection: `A split comparison that makes the decisive distinction in ${topic.title} visible.`,
      imageAlt: `Retrieval comparison for ${topic.title}.`,
    },
  ];
}

export function deriveMathEquationMotion(sourceText: string): MathEquationMotion | null {
  const notation = /[=≈≤≥+×÷^²³√∫Σ−-]|[a-z]\s*\(|\b(?:sin|cos|tan|log)\b/i;
  const expressions = sourceText
    .split(/\r?\n|(?<=[.;])\s+/)
    .map((line) => line.replace(/^[\s•*-]+/, '').trim())
    .filter((line) => line.length >= 3 && line.length <= 110 && notation.test(line))
    .filter((line, index, lines) => lines.findIndex((candidate) => candidate.toLowerCase() === line.toLowerCase()) === index)
    .slice(0, 5);
  if (!expressions.length) return null;
  return {
    mode: /solve|root|zero/i.test(sourceText) ? 'solve' : expressions.length > 1 ? 'derive' : 'substitute',
    steps: expressions.map((expression, index) => ({
      expression,
      explanation: index === 0 ? 'Start with the equation exactly as given.' : 'Apply the next transformation shown in the source.',
      focus: expression.includes('=') ? expression.split('=')[1]?.trim().slice(0, 36) ?? '' : '',
    })),
    variables: [],
  };
}

export function derivePhysicsDiagramMotion(topic: Pick<TopicLesson, 'title' | 'summary' | 'keyFacts'>): PhysicsDiagramMotion {
  const value = `${topic.title} ${topic.summary} ${topic.keyFacts.join(' ')}`.toLowerCase();
  const inferKind = (candidate: string): PhysicsDiagramMotion['kind'] | null => /projectile|trajectory|kinematic/.test(candidate)
    ? 'trajectory'
    : /wave|frequency|wavelength/.test(candidate)
      ? 'wave'
      : /oscillat|pendulum|spring/.test(candidate)
        ? 'oscillation'
        : /circuit|current|voltage|resistance/.test(candidate)
          ? 'circuit'
          : /ray|lens|optic|mirror|refraction/.test(candidate)
            ? 'ray'
            : /force|free-body|newton|friction|gravity|weight/.test(candidate)
              ? 'free-body'
              : null;
  const kind = inferKind(topic.title.toLowerCase()) ?? inferKind(value) ?? 'free-body';
  const bodyId = 'focus-body';
  const bodyShape = kind === 'trajectory' ? 'ball' : kind === 'circuit' ? 'charge' : kind === 'ray' ? 'source' : 'block';
  const pathKind = kind === 'trajectory' ? 'parabolic'
    : kind === 'oscillation' ? 'oscillating'
      : kind === 'wave' ? 'sine'
        : kind === 'circuit' ? 'circular'
          : kind === 'ray' ? 'linear'
            : 'static';
  const vectors: PhysicsDiagramMotion['vectors'] = [];
  if (/gravity|weight/.test(value)) vectors.push({ originId: bodyId, label: 'Weight', quantity: 'force', dx: 0, dy: -1, magnitudeLabel: 'mg' });
  if (/normal/.test(value)) vectors.push({ originId: bodyId, label: 'Normal', quantity: 'force', dx: 0, dy: 1, magnitudeLabel: 'N' });
  if (/friction|drag/.test(value)) vectors.push({ originId: bodyId, label: 'Friction', quantity: 'force', dx: -1, dy: 0, magnitudeLabel: 'f' });
  if (/velocity|speed|motion|projectile/.test(value)) vectors.push({ originId: bodyId, label: 'Velocity', quantity: 'velocity', dx: 0.9, dy: kind === 'trajectory' ? 0.55 : 0, magnitudeLabel: 'v' });
  if (/acceleration/.test(value)) vectors.push({ originId: bodyId, label: 'Acceleration', quantity: 'acceleration', dx: 0, dy: -0.8, magnitudeLabel: 'a' });
  if (kind === 'circuit') vectors.push({ originId: bodyId, label: 'Current', quantity: 'current', dx: 1, dy: 0, magnitudeLabel: 'I' });
  if (kind === 'ray') vectors.push({ originId: bodyId, label: 'Light ray', quantity: 'ray', dx: 1, dy: 0, magnitudeLabel: '' });
  if (!vectors.length) vectors.push({ originId: bodyId, label: 'Motion', quantity: 'velocity', dx: 1, dy: 0, magnitudeLabel: '' });
  return {
    kind,
    bodies: [{ id: bodyId, label: compactLabel(topic.title, 3).slice(0, 28), shape: bodyShape, x: kind === 'trajectory' ? 0.16 : 0.5, y: kind === 'trajectory' ? 0.72 : 0.55, size: 0.1 }],
    vectors: vectors.slice(0, 6),
    paths: [{
      bodyId,
      kind: pathKind,
      startX: kind === 'trajectory' || kind === 'wave' || kind === 'ray' ? 0.14 : 0.35,
      startY: kind === 'trajectory' ? 0.72 : 0.55,
      endX: kind === 'trajectory' || kind === 'wave' || kind === 'ray' ? 0.86 : 0.65,
      endY: kind === 'trajectory' ? 0.72 : 0.55,
      curvature: kind === 'trajectory' ? 0.62 : 0,
      amplitude: kind === 'wave' || kind === 'oscillation' ? 0.22 : 0,
      cycles: kind === 'wave' ? 2 : kind === 'oscillation' || kind === 'circuit' ? 1 : 0,
    }],
    annotations: topic.keyFacts.slice(0, 2).map((fact, index) => ({ text: compactLabel(fact, 5).slice(0, 42), x: 0.08, y: 0.1 + index * 0.09 })),
  };
}

export function deriveMotionPlan(topic: TopicLesson, subject = ''): MotionSpec {
  const value = `${topic.title} ${topic.summary} ${topic.keyFacts.join(' ')}`.toLowerCase();
  const subjectValue = subject.toLowerCase();
  if (/physics|mechanics|electricity|optics/.test(subjectValue)) {
    return {
      grammar: 'physics-diagram',
      title: topic.title,
      setting: topic.unit,
      objective: topic.summary,
      takeHome: topic.keyFacts[0],
      nodes: [
        { id: 'setting', label: topic.unit.toUpperCase(), kind: 'location' },
        ...topic.keyFacts.map((fact, index) => ({ id: `idea-${index + 1}`, label: compactLabel(fact, 4), kind: index === 0 ? 'input' as const : index === 2 ? 'output' as const : 'process' as const })),
      ],
      links: [
        { from: 'idea-1', to: 'idea-2', label: 'changes the motion' },
        { from: 'idea-2', to: 'idea-3', label: 'produces the observed result' },
      ],
      mathEquation: deriveMathEquationMotion(`${topic.title}\n${topic.summary}\n${topic.keyFacts.join('\n')}`),
      physicsDiagram: derivePhysicsDiagramMotion(topic),
    };
  }
  const mathEquation = /math|algebra|calculus|geometry|statistics/.test(subjectValue)
    ? deriveMathEquationMotion(`${topic.title}\n${topic.summary}\n${topic.keyFacts.join('\n')}\n${topic.explanation}`)
    : null;
  if (mathEquation) {
    return {
      grammar: 'math-equation',
      title: topic.title,
      setting: topic.unit,
      objective: topic.summary,
      takeHome: topic.keyFacts[0],
      nodes: [
        { id: 'setting', label: topic.unit.toUpperCase(), kind: 'location' },
        ...topic.keyFacts.map((fact, index) => ({ id: `step-${index + 1}`, label: compactLabel(fact, 4), kind: index === 0 ? 'input' as const : index === 2 ? 'output' as const : 'process' as const })),
      ],
      links: [
        { from: 'step-1', to: 'step-2', label: 'transform the expression' },
        { from: 'step-2', to: 'step-3', label: 'reach the result' },
      ],
      mathEquation,
      physicsDiagram: null,
    };
  }
  const infographicGrammar = inferInfographicGrammar(topic);
  const grammar: MotionGrammar = /gradient|synthase|energy transfer|phosphate/.test(value)
    ? 'energy-transfer'
    : infographicGrammar === 'cycle' || infographicGrammar === 'comparison' || infographicGrammar === 'timeline' || infographicGrammar === 'network' || infographicGrammar === 'equation' || infographicGrammar === 'spatial-process'
      ? infographicGrammar
      : 'linear-process';
  const facts = topic.keyFacts.map((fact, index) => ({
    id: `idea-${index + 1}`,
    label: compactLabel(fact, 4),
    kind: (/synthase|machine|enzyme/.test(fact.toLowerCase()) ? 'machine'
      : /gradient|nadh|fadh|electron|phosphate/.test(fact.toLowerCase()) ? 'carrier'
        : index === 0 ? 'input' : index === 2 ? 'output' : 'process') as MotionNode['kind'],
  }));
  const nodes: MotionNode[] = grammar === 'energy-transfer'
    ? [
        { id: 'location', label: /mitochond|membrane/.test(value) ? 'INNER MITOCHONDRIAL MEMBRANE' : topic.unit.toUpperCase(), kind: 'location' },
        ...facts,
        ...(facts.some((node) => node.kind === 'machine') ? [] : [{ id: 'machine', label: 'ENERGY-COUPLING MACHINE', kind: 'machine' as const }]),
        ...(facts.some((node) => node.kind === 'output') ? [] : [{ id: 'output', label: compactLabel(topic.answers[topic.correctAnswer], 3), kind: 'output' as const }]),
      ]
    : [
        { id: 'setting', label: topic.unit.toUpperCase(), kind: 'location' },
        ...facts,
      ];
  const contentNodes = nodes.filter((node) => node.kind !== 'location');
  const links = contentNodes.slice(0, -1).map((node, index) => ({
    from: node.id,
    to: contentNodes[index + 1].id,
    label: index === 0 ? 'transforms through' : 'leads to',
  }));
  if (grammar === 'cycle' && contentNodes.length > 2) {
    links.push({ from: contentNodes.at(-1)!.id, to: contentNodes[0].id, label: 'feeds the next turn' });
  }
  return {
    grammar,
    title: topic.title,
    setting: topic.unit,
    objective: topic.summary,
    takeHome: topic.keyFacts[0],
    nodes,
    links,
  };
}

export const templates: TemplateSpec[] = [
  {
    id: 'auto',
    name: 'Auto Director',
    eyebrow: 'Topic-aware · adaptive',
    description: 'Chooses the visual language that best explains each concept.',
    accent: '#6f5af6',
    accent2: '#d9ff67',
    surface: '#f2efff',
    ink: '#171127',
  },
  {
    id: 'kinetic',
    name: 'Kinetic Pop',
    eyebrow: 'Bold · energetic',
    description: 'Punchy type, playful shapes and fast visual reveals.',
    accent: '#7857ff',
    accent2: '#d8ff63',
    surface: '#f0ebff',
    ink: '#171127',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    eyebrow: 'Warm · story-led',
    description: 'Magazine pacing for humanities and narrative subjects.',
    accent: '#ed6a5a',
    accent2: '#ffd166',
    surface: '#fff0e9',
    ink: '#321c22',
  },
  {
    id: 'field-notes',
    name: 'Field Notes',
    eyebrow: 'Tactile · organic',
    description: 'Hand-drawn diagrams with calm, natural study cues.',
    accent: '#267a5d',
    accent2: '#f2c94c',
    surface: '#e9f3df',
    ink: '#16342b',
  },
  {
    id: 'neon-lab',
    name: 'Neon Lab',
    eyebrow: 'Precise · futuristic',
    description: 'Glowing systems, plots and code-friendly motion.',
    accent: '#35d6ed',
    accent2: '#ff70c6',
    surface: '#12182b',
    ink: '#f4f7ff',
  },
];

function offsetDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export const starterWorkspace: CourseWorkspace = {
  id: 'workspace-cellular-energy',
  title: 'Cellular Energy Sprint',
  subject: 'Biology',
  sourceName: 'AP Biology · Unit 3 syllabus.pdf',
  sourceKind: 'PDF · 18 pages',
  examDate: offsetDate(19),
  hoursPerWeek: 5,
  level: 'High school',
  templateId: 'auto',
  outputs: ['reel', 'post', 'playable'],
  createdAt: new Date().toISOString(),
  generation: {
    provider: 'local',
    textModel: 'curated-demo',
    imageModel: null,
    audioModel: null,
    sourceQuality: 'sufficient',
    sourceNote: 'Curated source-grounded demo workspace.',
    warnings: [],
  },
  topics: [
    {
      id: 'atp',
      title: 'ATP: the cell’s energy currency',
      unit: '01 · Energy foundations',
      scheduledDate: offsetDate(0),
      minutes: 18,
      status: 'ready',
      summary: 'ATP stores usable energy in phosphate bonds, then releases it exactly where cell work happens.',
      keyFacts: [
        'ATP → ADP + Pi releases usable energy',
        'Phosphorylation couples energy to cell work',
        'ATP is recycled continuously—not stored long-term',
      ],
      question: 'What makes ATP useful as an immediate energy carrier?',
      answers: ['It stores genetic code', 'Its terminal phosphate transfers easily', 'It is the largest molecule', 'It never needs recycling'],
      correctAnswer: 1,
      explanation: 'The terminal phosphate can be transferred to another molecule, coupling ATP breakdown to useful cell work.',
      styleId: 'neon-lab',
      infographicSlides: [
        {
          role: 'concept-map',
          grammar: 'spatial-process',
          title: 'Where ATP is made',
          subtitle: 'Follow usable energy from the cytosol into the mitochondrion.',
          exactText: ['WHERE ATP IS MADE', 'CYTOSOL', 'MITOCHONDRION', 'ATP'],
          facts: ['Glycolysis begins in the cytosol.', 'Most ATP production is organized across the inner mitochondrial membrane.'],
          artDirection: 'Scientific cell cutaway with a routed zoom from the whole cell into a mitochondrion.',
          imageAlt: 'Cell cutaway showing glycolysis in the cytosol and ATP production inside a mitochondrion.',
        },
        {
          role: 'mechanism',
          grammar: 'anatomy-cutaway',
          title: 'A gradient turns the turbine',
          subtitle: 'Proton flow through ATP synthase couples a gradient to ATP formation.',
          exactText: ['H+ GRADIENT', 'INNER MEMBRANE', 'ATP SYNTHASE', 'ADP + Pi', 'ATP'],
          facts: ['Electron transport establishes a proton gradient.', 'H+ moving through ATP synthase drives ATP production.'],
          artDirection: 'Macro cutaway of the inner mitochondrial membrane with a large ATP synthase molecular turbine.',
          imageAlt: 'Cutaway of ATP synthase in the inner mitochondrial membrane with protons moving through it.',
        },
        {
          role: 'retrieval',
          grammar: 'comparison',
          title: 'Energy transfer, not storage',
          subtitle: 'ATP is continually recycled to power immediate cell work.',
          exactText: ['ATP', 'ADP + Pi', 'ENERGY FOR CELL WORK', 'RECYCLE'],
          facts: ['ATP transfers a terminal phosphate.', 'Cells recycle ATP continuously rather than storing it long-term.'],
          artDirection: 'Split editorial comparison between charged ATP and recycled ADP plus phosphate, connected by a clean loop.',
          imageAlt: 'Comparison of ATP transferring energy for cell work and being recycled from ADP and phosphate.',
        },
      ],
      motionPlan: {
        grammar: 'energy-transfer',
        title: 'How cells turn a gradient into ATP',
        setting: 'Cell and inner mitochondrial membrane',
        objective: 'Trace energy transfer from proton gradient through ATP synthase to ATP.',
        takeHome: 'H+ flow rotates ATP synthase, coupling a membrane gradient to ATP formation.',
        nodes: [
          { id: 'cell', label: 'CELL', kind: 'location' },
          { id: 'mitochondrion', label: 'MITOCHONDRION', kind: 'location' },
          { id: 'gradient', label: 'H+ GRADIENT', kind: 'carrier' },
          { id: 'synthase', label: 'ATP SYNTHASE', kind: 'machine' },
          { id: 'adp', label: 'ADP + Pi', kind: 'input' },
          { id: 'atp', label: 'ATP', kind: 'output' },
        ],
        links: [
          { from: 'cell', to: 'mitochondrion', label: 'zoom to the energy machinery' },
          { from: 'gradient', to: 'synthase', label: 'H+ flows down its gradient' },
          { from: 'adp', to: 'synthase', label: 'substrates enter' },
          { from: 'synthase', to: 'atp', label: 'rotation couples ATP formation' },
        ],
      },
    },
    {
      id: 'glycolysis',
      title: 'Glycolysis in three moves',
      unit: '02 · Breaking down glucose',
      scheduledDate: offsetDate(1),
      minutes: 22,
      status: 'next',
      summary: 'The cell invests ATP, splits glucose, and earns back more ATP plus high-energy electrons.',
      keyFacts: ['Happens in the cytosol', '1 glucose becomes 2 pyruvate', 'Net gain: 2 ATP and 2 NADH'],
      question: 'Where does glycolysis happen?',
      answers: ['Mitochondrial matrix', 'Nucleus', 'Cytosol', 'Golgi apparatus'],
      correctAnswer: 2,
      explanation: 'Glycolysis occurs in the cytosol and does not require the mitochondrion directly.',
    },
    {
      id: 'krebs',
      title: 'The citric acid cycle',
      unit: '03 · Loading electron carriers',
      scheduledDate: offsetDate(3),
      minutes: 24,
      status: 'later',
      summary: 'Carbon atoms leave as CO₂ while NADH and FADH₂ load up with energetic electrons.',
      keyFacts: ['Runs in the mitochondrial matrix', 'Acetyl-CoA enters the cycle', 'Most energy leaves on electron carriers'],
      question: 'What is the cycle’s main energy-rich output?',
      answers: ['Oxygen', 'NADH and FADH₂', 'Glucose', 'Lactic acid'],
      correctAnswer: 1,
      explanation: 'The cycle transfers most captured energy to NADH and FADH₂ for the electron transport chain.',
    },
    {
      id: 'etc',
      title: 'Electron transport & chemiosmosis',
      unit: '04 · The ATP payoff',
      scheduledDate: offsetDate(5),
      minutes: 28,
      status: 'later',
      summary: 'Electron flow pumps protons; their return through ATP synthase powers the largest ATP yield.',
      keyFacts: ['Located on the inner mitochondrial membrane', 'Oxygen is the final electron acceptor', 'A proton gradient drives ATP synthase'],
      question: 'What directly powers ATP synthase?',
      answers: ['Carbon dioxide', 'Glucose splitting', 'Protons moving down their gradient', 'DNA replication'],
      correctAnswer: 2,
      explanation: 'Chemiosmosis—the movement of H⁺ down its electrochemical gradient—rotates ATP synthase.',
    },
    {
      id: 'fermentation',
      title: 'When oxygen runs low',
      unit: '05 · Alternate pathways',
      scheduledDate: offsetDate(7),
      minutes: 16,
      status: 'later',
      summary: 'Fermentation regenerates NAD⁺ so glycolysis can continue when the electron transport chain cannot.',
      keyFacts: ['Regenerates NAD⁺', 'Allows glycolysis to continue', 'Produces far less ATP than respiration'],
      question: 'Why is fermentation useful to a cell?',
      answers: ['It makes oxygen', 'It regenerates NAD⁺', 'It doubles DNA', 'It builds mitochondria'],
      correctAnswer: 1,
      explanation: 'By regenerating NAD⁺, fermentation keeps glycolysis—and its small ATP yield—running.',
    },
  ],
};

export const classActivity = [
  { id: 'maya', initials: 'MC', name: 'Maya', action: 'mastered Glycolysis', time: '8 min', color: '#ff9b73' },
  { id: 'arjun', initials: 'AS', name: 'Arjun', action: 'shared an ATP memory trick', time: '21 min', color: '#7a70f8' },
  { id: 'noor', initials: 'NK', name: 'Noor', action: 'scored 4/4 on Chemiosmosis', time: '42 min', color: '#45b995' },
];

export const librarySamples = [
  { id: 'library-atp-reel', title: 'ATP: energy on demand', format: 'Reel', topic: 'Cellular respiration', duration: '0:42', templateId: 'kinetic' as const },
  { id: 'library-atp-post', title: 'ATP in four frames', format: 'Post', topic: 'Cellular respiration', duration: '4 slides', templateId: 'editorial' as const },
  { id: 'library-quiz', title: 'Glycolysis checkpoint', format: 'Playable', topic: 'Cellular respiration', duration: '4 questions', templateId: 'field-notes' as const },
  { id: 'library-limits', title: 'Limits without the panic', format: 'Reel', topic: 'Calculus', duration: '0:51', templateId: 'neon-lab' as const },
  { id: 'library-french', title: 'Le passé composé', format: 'Post', topic: 'French II', duration: '5 slides', templateId: 'editorial' as const },
  { id: 'library-history', title: 'The Silk Road, mapped', format: 'Reel', topic: 'World history', duration: '1:02', templateId: 'field-notes' as const },
];

export function getTemplate(id: TemplateId) {
  return templates.find((template) => template.id === id) ?? templates[0];
}
