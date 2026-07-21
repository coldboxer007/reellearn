export type ThemeId = 'slate' | 'folio' | 'circuit' | 'sprout' | 'ledger' | 'auto';

export type FeedKind = 'reel' | 'post' | 'game' | 'share' | 'signal' | 'building';

export type PlanNodeStatus =
  | 'pending'
  | 'generating'
  | 'ready'
  | 'done'
  | 'mastered'
  | 'skipped'
  | 'stretch';

export type ExamWeight = 'high' | 'medium' | 'low' | 'unknown';

export type GameEngine =
  | 'tap-quiz'
  | 'pair-match'
  | 'order-up'
  | 'slider-predict'
  | 'bug-hunt';

export type JobStage =
  | 'moderation'
  | 'series_planner'
  | 'scene_planner'
  | 'script_writer'
  | 'voice'
  | 'infographic'
  | 'game_design'
  | 'caption_aligner'
  | 'composition_coder'
  | 'registrar'
  | 'render'
  | 'collector';

export interface WordTimestamp {
  word: string;
  start_s: number;
  end_s: number;
}

export interface ReelContent {
  id: string;
  topic: string;
  seriesTitle: string;
  theme: ThemeId;
  duration_s: number;
  posterGradient: [string, string];
  narration: string;
  captions: WordTimestamp[];
  keyPoints: string[];
}

export interface PostSlide {
  slide_number: number;
  layout: 'cover' | 'concept' | 'steps' | 'compare' | 'recall';
  headline: string;
  body_lines: string[];
  accent: string;
}

export interface PostContent {
  id: string;
  reelTopic: string;
  caption: string;
  theme: ThemeId;
  slides: PostSlide[];
}

export interface TapQuizPayload {
  questions: {
    prompt: string;
    options: [string, string, string, string];
    correct_index: number;
    explanation: string;
  }[];
}

export interface PairMatchPayload {
  pairs: { left: string; right: string }[];
}

export interface OrderUpPayload {
  prompt: string;
  steps: string[];
  correctOrder: number[];
}

export interface SliderPredictPayload {
  prompt: string;
  min: number;
  max: number;
  trueValue: number;
  unit: string;
  explanation: string;
}

export interface BugHuntPayload {
  prompt: string;
  lines: string[];
  bugLineIndex: number;
  explanation: string;
}

export type GamePayload =
  | TapQuizPayload
  | PairMatchPayload
  | OrderUpPayload
  | SliderPredictPayload
  | BugHuntPayload;

export interface GameContent {
  id: string;
  engine: GameEngine;
  title: string;
  intro_line: string;
  difficulty: 'warmup' | 'standard' | 'spicy';
  concept_tags: string[];
  theme: ThemeId;
  payload: GamePayload;
}

export interface ShareContent {
  id: string;
  note: string;
  from: string;
  topic: string;
}

export interface SignalContent {
  id: string;
  text: string;
}

export interface BuildingContent {
  id: string;
  jobId: string;
  title: string;
  reelCount: number;
  theme: ThemeId;
  stages: { id: JobStage; label: string; status: 'pending' | 'running' | 'done' }[];
  reels: { n: number; topic: string; status: 'skeleton' | 'published' | 'failed' }[];
}

export interface FeedItem {
  id: string;
  kind: FeedKind;
  available_on: string;
  content: ReelContent | PostContent | GameContent | ShareContent | SignalContent | BuildingContent;
}

export interface PlanNode {
  id: string;
  title: string;
  unit: string;
  exam_weight: ExamWeight;
  scheduled_date: string;
  review_date?: string;
  status: PlanNodeStatus;
  estimated_study_minutes: number;
  depends_on: string[];
}

export interface StudyPlan {
  id: string;
  course_title: string;
  exam_date: string;
  hours_per_week: number;
  nodes: PlanNode[];
}

export interface StudySignal {
  id: string;
  user: string;
  handle: string;
  text: string;
  day: string;
}

export interface StudyMatch {
  partner: string;
  handle: string;
  node_title: string;
  icebreaker: string;
}

export interface ClassPulse {
  id: string;
  name: string;
  invite_code: string;
  memberCount: number;
  signals: StudySignal[];
  match?: StudyMatch;
  leaderboard: { handle: string; streak: number; accuracy: number }[];
}

export interface UserProfile {
  handle: string;
  display_name: string;
  streak: number;
  longestStreak: number;
  masteredCount: number;
  totalNodes: number;
  library: { id: string; title: string; kind: 'reel' | 'post' | 'game'; theme: ThemeId }[];
  masteryMap: { unit: string; mastered: number; total: number }[];
}
