import { z } from 'zod';

export const TemplateIdSchema = z.enum(['auto', 'kinetic', 'editorial', 'field-notes', 'neon-lab']);
export const ConcreteTemplateIdSchema = z.enum(['kinetic', 'editorial', 'field-notes', 'neon-lab']);
export const OutputFormatSchema = z.enum(['reel', 'post', 'playable']);
export const LevelSchema = z.enum(['Middle school', 'High school', 'Undergraduate', 'Professional']);

export const InfographicGrammarSchema = z.enum([
  'linear-process',
  'cycle',
  'anatomy-cutaway',
  'spatial-process',
  'comparison',
  'timeline',
  'network',
  'hierarchy',
  'equation',
  'data-evidence',
  'visual-metaphor',
]);

export const MotionGrammarSchema = z.enum([
  'energy-transfer',
  'spatial-process',
  'linear-process',
  'cycle',
  'comparison',
  'timeline',
  'network',
  'equation',
  'math-equation',
  'physics-diagram',
]);

export const GenerateRequestSchema = z
  .object({
    source: z
      .object({
        name: z.string().trim().min(1).max(180),
        kind: z.string().trim().min(1).max(80),
        text: z.string().min(3).max(60_000),
        truncated: z.boolean(),
        mode: z.enum(['provided', 'research']).default('provided'),
      })
      .strict(),
    goal: z.string().trim().min(1).max(200),
    examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    hoursPerWeek: z.number().int().min(2).max(14),
    level: LevelSchema,
    templateId: TemplateIdSchema,
    outputs: z
      .array(OutputFormatSchema)
      .min(1)
      .max(3)
      .refine((values) => new Set(values).size === values.length, 'Output formats must be unique'),
  })
  .strict();

const ReelSceneSchema = z
  .object({
    label: z.string().min(2).max(48),
    headline: z.string().min(3).max(96),
    body: z.string().min(8).max(220),
  })
  .strict();

const MotionDirectionSchema = z
  .object({
    tempo: z.enum(['measured', 'balanced', 'brisk']),
    transitionEnergy: z.enum(['gentle', 'balanced', 'punchy']),
    beatEmphasis: z.array(z.number().int().min(1).max(4)).length(4),
  })
  .strict();

const InfographicSlideSchema = z
  .object({
    role: z.enum(['concept-map', 'mechanism', 'retrieval']),
    grammar: InfographicGrammarSchema,
    title: z.string().min(3).max(64),
    subtitle: z.string().min(8).max(120),
    exactText: z.array(z.string().min(1).max(38)).min(3).max(6),
    facts: z.array(z.string().min(8).max(110)).min(2).max(4),
    artDirection: z.string().min(20).max(700),
    imageAlt: z.string().min(12).max(220),
  })
  .strict();

const MotionNodeSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]{0,31}$/),
    label: z.string().min(1).max(36),
    kind: z.enum(['location', 'input', 'process', 'carrier', 'machine', 'output']),
  })
  .strict();

const MotionLinkSchema = z
  .object({
    from: z.string().regex(/^[a-z][a-z0-9-]{0,31}$/),
    to: z.string().regex(/^[a-z][a-z0-9-]{0,31}$/),
    label: z.string().min(1).max(42),
  })
  .strict();

const MathEquationStepSchema = z
  .object({
    expression: z.string().min(1).max(110),
    explanation: z.string().min(5).max(120),
    focus: z.string().max(36),
  })
  .strict();

const MathVariableSchema = z
  .object({
    symbol: z.string().min(1).max(12),
    meaning: z.string().min(2).max(54),
    unit: z.string().max(16),
  })
  .strict();

const MathEquationMotionSchema = z
  .object({
    mode: z.enum(['derive', 'solve', 'substitute', 'compare']),
    steps: z.array(MathEquationStepSchema).min(1).max(5),
    variables: z.array(MathVariableSchema).max(5),
  })
  .strict();

const PhysicsBodySchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]{0,31}$/),
    label: z.string().min(1).max(28),
    shape: z.enum(['block', 'ball', 'charge', 'mass', 'source', 'lens', 'marker']),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    size: z.number().min(0.04).max(0.24),
  })
  .strict();

const PhysicsVectorSchema = z
  .object({
    originId: z.string().regex(/^[a-z][a-z0-9-]{0,31}$/),
    label: z.string().min(1).max(24),
    quantity: z.enum(['force', 'velocity', 'acceleration', 'field', 'current', 'ray']),
    dx: z.number().min(-1).max(1),
    dy: z.number().min(-1).max(1),
    magnitudeLabel: z.string().max(18),
  })
  .strict();

const PhysicsPathSchema = z
  .object({
    bodyId: z.string().regex(/^[a-z][a-z0-9-]{0,31}$/),
    kind: z.enum(['static', 'linear', 'parabolic', 'circular', 'oscillating', 'sine']),
    startX: z.number().min(0).max(1),
    startY: z.number().min(0).max(1),
    endX: z.number().min(0).max(1),
    endY: z.number().min(0).max(1),
    curvature: z.number().min(-1).max(1),
    amplitude: z.number().min(0).max(1),
    cycles: z.number().min(0).max(4),
  })
  .strict();

const PhysicsAnnotationSchema = z
  .object({
    text: z.string().min(1).max(42),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  })
  .strict();

const PhysicsDiagramMotionSchema = z
  .object({
    kind: z.enum(['free-body', 'trajectory', 'oscillation', 'wave', 'circuit', 'ray']),
    bodies: z.array(PhysicsBodySchema).min(1).max(5),
    vectors: z.array(PhysicsVectorSchema).min(1).max(7),
    paths: z.array(PhysicsPathSchema).min(1).max(4),
    annotations: z.array(PhysicsAnnotationSchema).max(5),
  })
  .strict();

export const MotionPlanSchema = z
  .object({
    grammar: MotionGrammarSchema,
    title: z.string().min(3).max(72),
    setting: z.string().min(2).max(64),
    objective: z.string().min(10).max(160),
    takeHome: z.string().min(10).max(150),
    nodes: z.array(MotionNodeSchema).min(4).max(8),
    links: z.array(MotionLinkSchema).min(2).max(10),
    mathEquation: MathEquationMotionSchema.nullable(),
    physicsDiagram: PhysicsDiagramMotionSchema.nullable(),
    motionDirection: MotionDirectionSchema,
  })
  .strict();

export const GeneratedTopicSchema = z
  .object({
    title: z.string().min(3).max(90),
    unit: z.string().min(3).max(70),
    minutes: z.number().int().min(12).max(35),
    summary: z.string().min(20).max(260),
    keyFacts: z.array(z.string().min(8).max(150)).length(3),
    question: z.string().min(10).max(200),
    answers: z.array(z.string().min(1).max(140)).length(4),
    correctAnswer: z.number().int().min(0).max(3),
    explanation: z.string().min(15).max(240),
    arcRole: z.enum(['foundation', 'build', 'application', 'synthesis']),
    prerequisiteReels: z.array(z.number().int().min(1).max(8)).max(3),
    connectionFromPrevious: z.string().min(8).max(150).nullable(),
    reelScenes: z.array(ReelSceneSchema).length(4),
    recommendedStyle: ConcreteTemplateIdSchema,
    infographicSlides: z.array(InfographicSlideSchema).length(3),
    motionPlan: MotionPlanSchema,
  })
  .strict();

export const GeneratedPlanSchema = z
  .object({
    title: z.string().min(3).max(100),
    subject: z.string().min(2).max(60),
    sourceQuality: z.enum(['sufficient', 'outline_only', 'irrelevant']),
    sourceNote: z.string().min(10).max(220),
    topics: z.array(GeneratedTopicSchema).max(8),
  })
  .strict();

export function generatedPlanSchemaForReelCount(reelCount: number) {
  const exactCount = Math.min(8, Math.max(3, Math.round(reelCount)));
  return GeneratedPlanSchema.extend({
    topics: z.array(GeneratedTopicSchema).length(exactCount),
  });
}

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
export type GeneratedPlan = z.infer<typeof GeneratedPlanSchema>;
