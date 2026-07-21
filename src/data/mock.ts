import type {
  BuildingContent,
  ClassPulse,
  FeedItem,
  GameContent,
  PlanNode,
  PostContent,
  ReelContent,
  StudyPlan,
  UserProfile,
} from '../types';

const today = new Date().toISOString().slice(0, 10);

export const THEME_META = {
  slate: { name: 'Slate', tagline: 'Math · Physics · CS', bg: '#2E3138', accent: '#2FA8C9' },
  folio: { name: 'Folio', tagline: 'History · Literature', bg: '#F3EBDA', accent: '#7A2E2E' },
  circuit: { name: 'Circuit', tagline: 'Programming · AI', bg: '#0D1117', accent: '#3FDC97' },
  sprout: { name: 'Sprout', tagline: 'Bio · Chem · Earth', bg: '#FDFBF4', accent: '#57A85C' },
  ledger: { name: 'Ledger', tagline: 'Econ · Stats · Business', bg: '#FFFFFF', accent: '#1E3A5F' },
  auto: { name: 'Auto', tagline: 'Pick from subject', bg: '#161A20', accent: '#2FA8C9' },
} as const;

export const mockReels: ReelContent[] = [
  {
    id: 'reel-1',
    topic: 'Limits from First Principles',
    seriesTitle: 'Calculus Crash Arc',
    theme: 'slate',
    duration_s: 42,
    posterGradient: ['#1E6E8C', '#2E3138'],
    narration:
      "What if a function never quite arrives — but we still know where it's going? That's a limit. Watch the secant slope chase the tangent as h shrinks toward zero.",
    captions: [
      { word: 'What', start_s: 0, end_s: 0.25 },
      { word: 'if', start_s: 0.25, end_s: 0.4 },
      { word: 'a', start_s: 0.4, end_s: 0.5 },
      { word: 'function', start_s: 0.5, end_s: 0.95 },
      { word: 'never', start_s: 0.95, end_s: 1.25 },
      { word: 'quite', start_s: 1.25, end_s: 1.55 },
      { word: 'arrives', start_s: 1.55, end_s: 2.1 },
      { word: '—', start_s: 2.1, end_s: 2.3 },
      { word: 'but', start_s: 2.3, end_s: 2.5 },
      { word: 'we', start_s: 2.5, end_s: 2.65 },
      { word: 'still', start_s: 2.65, end_s: 2.95 },
      { word: 'know', start_s: 2.95, end_s: 3.2 },
      { word: 'where', start_s: 3.2, end_s: 3.5 },
      { word: "it's", start_s: 3.5, end_s: 3.75 },
      { word: 'going?', start_s: 3.75, end_s: 4.2 },
    ],
    keyPoints: ['ε-δ intuition without the terror', 'Secant → tangent animation', 'Common limit traps'],
  },
  {
    id: 'reel-2',
    topic: 'Integration by Parts',
    seriesTitle: 'Calculus Crash Arc',
    theme: 'slate',
    duration_s: 48,
    posterGradient: ['#3E8E6E', '#2E3138'],
    narration:
      "When the product rule goes backwards, you get integration by parts. Pick u to die, dv to survive — and watch the boundary term appear.",
    captions: [
      { word: 'When', start_s: 0, end_s: 0.3 },
      { word: 'the', start_s: 0.3, end_s: 0.45 },
      { word: 'product', start_s: 0.45, end_s: 0.9 },
      { word: 'rule', start_s: 0.9, end_s: 1.2 },
      { word: 'goes', start_s: 1.2, end_s: 1.45 },
      { word: 'backwards,', start_s: 1.45, end_s: 2.0 },
      { word: 'you', start_s: 2.0, end_s: 2.2 },
      { word: 'get', start_s: 2.2, end_s: 2.4 },
      { word: 'integration', start_s: 2.4, end_s: 3.0 },
      { word: 'by', start_s: 3.0, end_s: 3.2 },
      { word: 'parts.', start_s: 3.2, end_s: 3.7 },
    ],
    keyPoints: ['LIATE heuristic', 'uv − ∫v du', 'Tabular method preview'],
  },
  {
    id: 'reel-3',
    topic: 'AR(1) Stationarity',
    seriesTitle: 'Time Series Intuition',
    theme: 'ledger',
    duration_s: 55,
    posterGradient: ['#1E3A5F', '#2A9D8F'],
    narration:
      "An AR(1) process remembers yesterday — but only a little. When |φ| stays under one, the shock dies out. Cross that line and the series runs away.",
    captions: [
      { word: 'An', start_s: 0, end_s: 0.2 },
      { word: 'AR(1)', start_s: 0.2, end_s: 0.7 },
      { word: 'process', start_s: 0.7, end_s: 1.15 },
      { word: 'remembers', start_s: 1.15, end_s: 1.7 },
      { word: 'yesterday', start_s: 1.7, end_s: 2.3 },
      { word: '—', start_s: 2.3, end_s: 2.5 },
      { word: 'but', start_s: 2.5, end_s: 2.7 },
      { word: 'only', start_s: 2.7, end_s: 3.0 },
      { word: 'a', start_s: 3.0, end_s: 3.1 },
      { word: 'little.', start_s: 3.1, end_s: 3.5 },
    ],
    keyPoints: ['|φ| < 1 condition', 'Impulse response decay', 'Unit root intuition'],
  },
];

export const mockPosts: PostContent[] = [
  {
    id: 'post-1',
    reelTopic: 'Limits from First Principles',
    caption: 'Save this for exam week. #limits #calculus #reellearn',
    theme: 'slate',
    slides: [
      {
        slide_number: 1,
        layout: 'cover',
        headline: 'Limits in 4 Beats',
        body_lines: ['Approach ≠ arrive', 'Secant chases tangent', 'ε-δ is a guardrail'],
        accent: '#2FA8C9',
      },
      {
        slide_number: 2,
        layout: 'concept',
        headline: 'The Core Idea',
        body_lines: ['f(x) gets arbitrarily close', 'to L as x → a', 'even if f(a) is undefined'],
        accent: '#57BE92',
      },
      {
        slide_number: 3,
        layout: 'steps',
        headline: 'Worked Pattern',
        body_lines: ['1. Substitute if safe', '2. Factor / conjugate', '3. Squeeze if trapped'],
        accent: '#EFC94C',
      },
      {
        slide_number: 4,
        layout: 'recall',
        headline: 'Quick Recall',
        body_lines: ['Q: lim x→0 sin(x)/x ?', 'Flip for answer →', 'A: 1'],
        accent: '#E4735A',
      },
    ],
  },
];

export const mockGames: GameContent[] = [
  {
    id: 'game-1',
    engine: 'tap-quiz',
    title: 'Limit Speed Round',
    intro_line: 'Think you can spot the limit traps?',
    difficulty: 'standard',
    concept_tags: ['limits'],
    theme: 'slate',
    payload: {
      questions: [
        {
          prompt: 'lim x→0 of sin(x)/x equals…',
          options: ['0', '1', '∞', 'undefined'],
          correct_index: 1,
          explanation: 'The classic squeeze-theorem limit — the ratio approaches 1.',
        },
        {
          prompt: 'If lim x→a f(x) = L, then f(a) must equal L.',
          options: ['Always true', 'Never true', 'Only if continuous', 'Only if differentiable'],
          correct_index: 2,
          explanation: 'Limits care about the neighborhood. Continuity is what glues f(a) to L.',
        },
        {
          prompt: 'Which form is indeterminate?',
          options: ['∞ / ∞', '5 / 0', '0 / 5', '∞ + 5'],
          correct_index: 0,
          explanation: '∞/∞ (and 0/0) need more work — they can resolve to anything.',
        },
      ],
    },
  },
  {
    id: 'game-2',
    engine: 'pair-match',
    title: 'Parts Pairing',
    intro_line: 'Match each pick with why it works.',
    difficulty: 'warmup',
    concept_tags: ['integration-by-parts'],
    theme: 'slate',
    payload: {
      pairs: [
        { left: 'u = ln x', right: 'Derivative simplifies' },
        { left: 'dv = e^x dx', right: 'Integral stays friendly' },
        { left: 'LIATE', right: 'Priority heuristic for u' },
        { left: 'uv − ∫v du', right: 'The formula itself' },
      ],
    },
  },
  {
    id: 'game-3',
    engine: 'order-up',
    title: 'Derive the Derivative',
    intro_line: 'Put the first-principles steps in order.',
    difficulty: 'spicy',
    concept_tags: ['derivatives'],
    theme: 'slate',
    payload: {
      prompt: 'Order the definition of f′(x)',
      steps: [
        'Write [f(x+h) − f(x)] / h',
        'Expand and simplify algebra',
        'Take lim h→0',
        'Interpret as instantaneous rate',
      ],
      correctOrder: [0, 1, 2, 3],
    },
  },
  {
    id: 'game-4',
    engine: 'slider-predict',
    title: 'φ Guess',
    intro_line: 'Where does stationarity break?',
    difficulty: 'standard',
    concept_tags: ['ar1'],
    theme: 'ledger',
    payload: {
      prompt: 'For AR(1) yt = φ yt−1 + εt, stationarity requires |φ| < ?',
      min: 0,
      max: 2,
      trueValue: 1,
      unit: '',
      explanation: 'The process is (weakly) stationary when |φ| < 1. At |φ| = 1 you hit a unit root.',
    },
  },
  {
    id: 'game-5',
    engine: 'bug-hunt',
    title: 'Spot the Slip',
    intro_line: 'One line in this derivation is wrong. Tap it.',
    difficulty: 'spicy',
    concept_tags: ['limits'],
    theme: 'slate',
    payload: {
      prompt: 'Find the error in this limit evaluation',
      lines: [
        'lim x→2 (x² − 4)/(x − 2)',
        '= lim x→2 (x − 2)(x + 2)/(x − 2)',
        '= lim x→2 (x + 2)',
        '= 2 + 2 = 5',
      ],
      bugLineIndex: 3,
      explanation: '2 + 2 = 4, not 5. The algebra was fine — the arithmetic slipped.',
    },
  },
];

export const mockBuilding: BuildingContent = {
  id: 'building-1',
  jobId: 'job-demo',
  title: 'ODE Crash Notes',
  reelCount: 4,
  theme: 'circuit',
  stages: [
    { id: 'moderation', label: 'Moderation', status: 'done' },
    { id: 'series_planner', label: 'Series Planner', status: 'done' },
    { id: 'scene_planner', label: 'Scene Planner', status: 'done' },
    { id: 'script_writer', label: 'Script Writer', status: 'running' },
    { id: 'voice', label: 'Voice + Assets', status: 'pending' },
    { id: 'composition_coder', label: 'Composition Coder', status: 'pending' },
    { id: 'render', label: 'Render Farm', status: 'pending' },
    { id: 'collector', label: 'Publish to Feed', status: 'pending' },
  ],
  reels: [
    { n: 1, topic: 'Separable ODEs', status: 'published' },
    { n: 2, topic: 'Integrating Factor', status: 'skeleton' },
    { n: 3, topic: 'Phase Portraits', status: 'skeleton' },
    { n: 4, topic: 'Existence & Uniqueness', status: 'skeleton' },
  ],
};

export const mockFeed: FeedItem[] = [
  {
    id: 'feed-building',
    kind: 'building',
    available_on: today,
    content: mockBuilding,
  },
  {
    id: 'feed-reel-1',
    kind: 'reel',
    available_on: today,
    content: mockReels[0],
  },
  {
    id: 'feed-post-1',
    kind: 'post',
    available_on: today,
    content: mockPosts[0],
  },
  {
    id: 'feed-game-1',
    kind: 'game',
    available_on: today,
    content: mockGames[0],
  },
  {
    id: 'feed-reel-2',
    kind: 'reel',
    available_on: today,
    content: mockReels[1],
  },
  {
    id: 'feed-game-2',
    kind: 'game',
    available_on: today,
    content: mockGames[1],
  },
  {
    id: 'feed-signal-1',
    kind: 'signal',
    available_on: today,
    content: {
      id: 'sig-1',
      text: '3 classmates studied Integration by Parts today',
    },
  },
  {
    id: 'feed-reel-3',
    kind: 'reel',
    available_on: today,
    content: mockReels[2],
  },
  {
    id: 'feed-game-4',
    kind: 'game',
    available_on: today,
    content: mockGames[3],
  },
  {
    id: 'feed-share-1',
    kind: 'share',
    available_on: today,
    content: {
      id: 'share-1',
      note: 'This finally clicked the |φ|<1 thing for me',
      from: 'Maya Chen',
      topic: 'AR(1) Stationarity',
    },
  },
  {
    id: 'feed-game-3',
    kind: 'game',
    available_on: today,
    content: mockGames[2],
  },
  {
    id: 'feed-game-5',
    kind: 'game',
    available_on: today,
    content: mockGames[4],
  },
];

const planNodes: PlanNode[] = [
  {
    id: 'limits',
    title: 'Limits & Continuity',
    unit: 'Unit 1 — Foundations',
    exam_weight: 'high',
    scheduled_date: today,
    review_date: offsetDate(3),
    status: 'done',
    estimated_study_minutes: 90,
    depends_on: [],
  },
  {
    id: 'derivatives',
    title: 'Derivatives',
    unit: 'Unit 1 — Foundations',
    exam_weight: 'high',
    scheduled_date: offsetDate(1),
    review_date: offsetDate(4),
    status: 'ready',
    estimated_study_minutes: 120,
    depends_on: ['limits'],
  },
  {
    id: 'apps-diff',
    title: 'Applications of Differentiation',
    unit: 'Unit 2 — Applications',
    exam_weight: 'medium',
    scheduled_date: offsetDate(3),
    status: 'pending',
    estimated_study_minutes: 100,
    depends_on: ['derivatives'],
  },
  {
    id: 'integrals',
    title: 'Definite & Indefinite Integrals',
    unit: 'Unit 3 — Integration',
    exam_weight: 'high',
    scheduled_date: offsetDate(5),
    status: 'pending',
    estimated_study_minutes: 140,
    depends_on: ['derivatives'],
  },
  {
    id: 'parts',
    title: 'Integration by Parts',
    unit: 'Unit 3 — Integration',
    exam_weight: 'high',
    scheduled_date: offsetDate(7),
    status: 'generating',
    estimated_study_minutes: 80,
    depends_on: ['integrals'],
  },
  {
    id: 'series',
    title: 'Sequences & Series',
    unit: 'Unit 4 — Infinite Processes',
    exam_weight: 'medium',
    scheduled_date: offsetDate(10),
    status: 'pending',
    estimated_study_minutes: 110,
    depends_on: ['limits'],
  },
  {
    id: 'taylor',
    title: 'Taylor Approximations',
    unit: 'Unit 4 — Infinite Processes',
    exam_weight: 'low',
    scheduled_date: offsetDate(12),
    status: 'stretch',
    estimated_study_minutes: 70,
    depends_on: ['series', 'derivatives'],
  },
  {
    id: 'odes',
    title: 'First-Order ODEs',
    unit: 'Unit 5 — Differential Equations',
    exam_weight: 'high',
    scheduled_date: offsetDate(14),
    status: 'pending',
    estimated_study_minutes: 130,
    depends_on: ['integrals'],
  },
];

export const mockPlan: StudyPlan = {
  id: 'plan-1',
  course_title: 'Calculus II — Midterm Track',
  exam_date: offsetDate(21),
  hours_per_week: 8,
  nodes: planNodes,
};

export const mockClass: ClassPulse = {
  id: 'class-1',
  name: 'Calc II · Section B',
  invite_code: 'CALC-B7',
  memberCount: 28,
  signals: [
    {
      id: 's1',
      user: 'Aisha Rahman',
      handle: 'aisha',
      text: 'completed Ordinary Differencing',
      day: today,
    },
    {
      id: 's2',
      user: 'Jordan Lee',
      handle: 'jlee',
      text: 'is on Unit 2 this week',
      day: today,
    },
    {
      id: 's3',
      user: 'Priya Nair',
      handle: 'priya',
      text: 'shared a Limits recall post',
      day: offsetDate(-1),
    },
    {
      id: 's4',
      user: 'Sam Okonkwo',
      handle: 'samok',
      text: 'hit a 7-day streak',
      day: offsetDate(-1),
    },
  ],
  match: {
    partner: 'Nova Park',
    handle: 'novap',
    node_title: 'Integration by Parts',
    icebreaker: 'You both study Integration by Parts this week — race this quiz',
  },
  leaderboard: [
    { handle: 'aisha', streak: 12, accuracy: 94 },
    { handle: 'novap', streak: 9, accuracy: 88 },
    { handle: 'you', streak: 7, accuracy: 82 },
    { handle: 'jlee', streak: 5, accuracy: 79 },
    { handle: 'priya', streak: 4, accuracy: 91 },
  ],
};

export const mockUser: UserProfile = {
  handle: 'sahil',
  display_name: 'Sahil',
  streak: 7,
  longestStreak: 14,
  masteredCount: 3,
  totalNodes: 8,
  library: [
    { id: 'l1', title: 'Limits from First Principles', kind: 'reel', theme: 'slate' },
    { id: 'l2', title: 'Limits in 4 Beats', kind: 'post', theme: 'slate' },
    { id: 'l3', title: 'Limit Speed Round', kind: 'game', theme: 'slate' },
    { id: 'l4', title: 'AR(1) Stationarity', kind: 'reel', theme: 'ledger' },
    { id: 'l5', title: 'φ Guess', kind: 'game', theme: 'ledger' },
  ],
  masteryMap: [
    { unit: 'Unit 1 — Foundations', mastered: 2, total: 2 },
    { unit: 'Unit 2 — Applications', mastered: 0, total: 1 },
    { unit: 'Unit 3 — Integration', mastered: 1, total: 2 },
    { unit: 'Unit 4 — Infinite Processes', mastered: 0, total: 2 },
    { unit: 'Unit 5 — Differential Equations', mastered: 0, total: 1 },
  ],
};

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
