import type { GenerationInput } from './generation';
import type { CourseWorkspace } from './product';

const MAX_SOURCE_CHARACTERS = 60_000;

export interface ApiHealth {
  configured: boolean;
  provider: 'openai';
  textModel: string;
  imageModel: string;
  audioModel: string;
}

export type GenerationStage = 'moderation' | 'research' | 'series_planner' | 'infographic' | 'voice' | 'motion' | 'collector';

export type LiveGenerationEvent =
  | {
      type: 'meta';
      traceId: string;
      provider: 'openai';
      textModel: string;
      imageModel: string;
      audioModel: string;
    }
  | {
      type: 'progress';
      stage: GenerationStage;
      status: 'running' | 'done';
      label: string;
      detail: string;
    }
  | { type: 'warning'; stage: GenerationStage; message: string }
  | { type: 'result'; workspace: CourseWorkspace; warnings: string[]; traceId: string }
  | {
      type: 'error';
      error: {
        code: string;
        message: string;
        retryable: boolean;
        fallbackAllowed: boolean;
      };
      traceId: string;
    };

export class LiveGenerationError extends Error {
  code: string;
  retryable: boolean;
  fallbackAllowed: boolean;
  traceId?: string;

  constructor(options: { code: string; message: string; retryable: boolean; fallbackAllowed: boolean; traceId?: string }) {
    super(options.message);
    this.name = 'LiveGenerationError';
    this.code = options.code;
    this.retryable = options.retryable;
    this.fallbackAllowed = options.fallbackAllowed;
    this.traceId = options.traceId;
  }
}

function validateWorkspace(value: unknown): CourseWorkspace {
  if (!value || typeof value !== 'object') throw new Error('The generation response did not contain a workspace.');
  const workspace = value as CourseWorkspace;
  if (!workspace.id || !workspace.title || !Array.isArray(workspace.topics) || workspace.topics.length < 3) {
    throw new Error('The generated workspace is incomplete.');
  }
  for (const topic of workspace.topics) {
    if (topic.visual && !topic.visual.url.startsWith('/generated/')) delete topic.visual;
    if (topic.narration && !topic.narration.url.startsWith('/generated/')) delete topic.narration;
    if (topic.motionVideo && !topic.motionVideo.url.startsWith('/generated/')) delete topic.motionVideo;
    for (const slide of topic.infographicSlides ?? []) {
      if (slide.image && !slide.image.url.startsWith('/generated/')) delete slide.image;
    }
  }
  return workspace;
}

async function readErrorResponse(response: Response) {
  try {
    const body = (await response.json()) as {
      error?: { code?: string; message?: string; retryable?: boolean; fallbackAllowed?: boolean };
      traceId?: string;
    };
    return new LiveGenerationError({
      code: body.error?.code ?? 'AI_UNAVAILABLE',
      message: body.error?.message ?? 'OpenAI generation could not start.',
      retryable: body.error?.retryable ?? response.status >= 500,
      fallbackAllowed: body.error?.fallbackAllowed ?? true,
      traceId: body.traceId,
    });
  } catch {
    return new LiveGenerationError({
      code: 'AI_UNAVAILABLE',
      message: 'OpenAI generation could not start.',
      retryable: response.status >= 500,
      fallbackAllowed: true,
    });
  }
}

export async function getApiHealth(): Promise<ApiHealth | null> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 3_000);
  try {
    const response = await fetch('/api/health', { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const health = (await response.json()) as ApiHealth;
    return typeof health.configured === 'boolean' && health.provider === 'openai' ? health : null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function generateWorkspaceWithOpenAI(
  input: GenerationInput,
  onEvent: (event: LiveGenerationEvent) => void,
  signal?: AbortSignal,
) {
  const sourceText = input.source.text.slice(0, MAX_SOURCE_CHARACTERS);
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
    signal,
    body: JSON.stringify({
      source: {
        name: input.source.name,
        kind: input.source.kind,
        text: sourceText,
        truncated: input.source.text.length > sourceText.length,
        mode: input.source.mode ?? 'provided',
      },
      goal: input.goal,
      examDate: input.examDate,
      hoursPerWeek: input.hoursPerWeek,
      level: input.level,
      templateId: input.templateId,
      outputs: input.outputs,
    }),
  });
  if (!response.ok) throw await readErrorResponse(response);
  if (!response.body) {
    throw new LiveGenerationError({
      code: 'AI_UNAVAILABLE',
      message: 'The OpenAI server did not return a generation stream.',
      retryable: true,
      fallbackAllowed: true,
    });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result: CourseWorkspace | null = null;

  const consumeLine = (line: string) => {
    if (!line.trim()) return;
    const event = JSON.parse(line) as LiveGenerationEvent;
    onEvent(event);
    if (event.type === 'error') {
      throw new LiveGenerationError({ ...event.error, traceId: event.traceId });
    }
    if (event.type === 'result') result = validateWorkspace(event.workspace);
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) consumeLine(line);
    if (done) break;
  }
  if (buffer.trim()) consumeLine(buffer);
  if (!result) {
    throw new LiveGenerationError({
      code: 'AI_UNAVAILABLE',
      message: 'OpenAI generation ended before a workspace was returned.',
      retryable: true,
      fallbackAllowed: true,
    });
  }
  return result;
}
