import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { ensureBrowser, renderMedia, selectComposition } from '@remotion/renderer';
import {
  EDUCATIONAL_REEL_ID,
  REEL_DURATION_IN_FRAMES,
  REEL_FPS,
  REEL_HEIGHT,
  REEL_WIDTH,
} from '../src/remotion/config.ts';
import { resolveReelTheme, type MotionSpec, type ReelThemeId } from '../src/remotion/visual-spec.ts';

const generatedDirectory = path.resolve(process.cwd(), '.generated');
const entryPoint = path.resolve(process.cwd(), 'src/remotion/Root.tsx');

let bundlePromise: Promise<string> | null = null;
let renderTail: Promise<void> = Promise.resolve();

function getBundle() {
  if (!bundlePromise) {
    bundlePromise = Promise.all([
      ensureBrowser({ logLevel: 'warn' }),
      bundle({
        entryPoint,
        onProgress: () => undefined,
        ignoreRegisterRootWarning: false,
      }),
    ]).then(([, serveUrl]) => serveUrl).catch((error) => {
      bundlePromise = null;
      throw error;
    });
  }
  return bundlePromise;
}

function serializeRender<T>(job: () => Promise<T>) {
  const result = renderTail.then(job, job);
  renderTail = result.then(() => undefined, () => undefined);
  return result;
}

export interface RenderedTopicVideo {
  url: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
}

export function renderTopicVideo(options: {
  spec: MotionSpec;
  themeId: ReelThemeId;
  audioUrl?: string | null;
}) {
  return serializeRender(async (): Promise<RenderedTopicVideo> => {
    await mkdir(generatedDirectory, { recursive: true });
    const serveUrl = await getBundle();
    const durationInFrames = options.spec.durationInFrames ?? REEL_DURATION_IN_FRAMES;
    const inputProps = {
      spec: { ...options.spec, durationInFrames },
      theme: resolveReelTheme(options.themeId),
      directionId: options.themeId,
      audioUrl: options.audioUrl ?? null,
    };
    const composition = await selectComposition({
      serveUrl,
      id: EDUCATIONAL_REEL_ID,
      inputProps,
      logLevel: 'warn',
      timeoutInMilliseconds: 120_000,
    });
    const filename = `${randomUUID()}.mp4`;
    const outputLocation = path.join(generatedDirectory, filename);
    await renderMedia({
      serveUrl,
      composition,
      inputProps,
      codec: 'h264',
      pixelFormat: 'yuv420p',
      crf: 21,
      outputLocation,
      overwrite: false,
      concurrency: 2,
      logLevel: 'warn',
      timeoutInMilliseconds: 180_000,
      disallowParallelEncoding: true,
    });
    return {
      url: `/generated/${filename}`,
      width: REEL_WIDTH,
      height: REEL_HEIGHT,
      fps: REEL_FPS,
      durationInFrames,
    };
  });
}
