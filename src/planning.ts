export type LearningArcRole = 'foundation' | 'build' | 'application' | 'synthesis';

export interface LearningArcPolicy {
  reelCount: number;
  depthLabel: string;
  depthDirection: string;
  motionDirection: string;
}

const LEVEL_POLICIES: Record<string, Omit<LearningArcPolicy, 'reelCount'>> = {
  'Middle school': {
    depthLabel: 'Concrete foundations',
    depthDirection: 'Teach one concrete relationship at a time, define every necessary term, and use familiar examples before symbols or abstraction.',
    motionDirection: 'Prefer slower construction, fewer simultaneous objects, large labels, and prediction-first reveals.',
  },
  'High school': {
    depthLabel: 'Concept to application',
    depthDirection: 'Move from a clear mental model to mechanism, one worked connection, and exam-ready retrieval without skipping prerequisite reasoning.',
    motionDirection: 'Balance visual construction with one worked transformation or moving diagram per reel.',
  },
  Undergraduate: {
    depthLabel: 'Formal model and derivation',
    depthDirection: 'Use discipline-appropriate terminology, preserve formal relationships or derivations, and connect each model to a non-trivial application.',
    motionDirection: 'Use precise traces, staged derivations, comparative states, and denser but still phone-readable annotations.',
  },
  Professional: {
    depthLabel: 'Compressed decision practice',
    depthDirection: 'Compress assumed fundamentals, foreground mechanisms, trade-offs, edge cases, and decisions that transfer to realistic practice.',
    motionDirection: 'Use brisk transitions, state comparisons, causal traces, and case-driven reveals without ornamental motion.',
  },
};

export function reelCountForWeeklyHours(hoursPerWeek: number) {
  const hours = Math.min(14, Math.max(2, Math.round(hoursPerWeek)));
  if (hours <= 2) return 3;
  if (hours <= 4) return 4;
  if (hours <= 6) return 5;
  if (hours <= 9) return 6;
  if (hours <= 11) return 7;
  return 8;
}

export function learningArcRole(index: number, total: number): LearningArcRole {
  if (index <= 0) return 'foundation';
  if (index >= total - 1) return 'synthesis';
  if (index >= Math.ceil(total * .58)) return 'application';
  return 'build';
}

export function deriveLearningArcPolicy(hoursPerWeek: number, level: string): LearningArcPolicy {
  const levelPolicy = LEVEL_POLICIES[level] ?? LEVEL_POLICIES['High school'];
  return {
    reelCount: reelCountForWeeklyHours(hoursPerWeek),
    ...levelPolicy,
  };
}
