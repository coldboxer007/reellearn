import { stat } from 'node:fs/promises';
import path from 'node:path';
import { ATP_DEMO_SPEC } from '../src/remotion/visual-spec.ts';
import { renderTopicVideo } from './remotion.ts';

const result = await renderTopicVideo({
  spec: {
    ...ATP_DEMO_SPEC,
    motionDirection: {tempo: 'brisk', transitionEnergy: 'punchy', beatEmphasis: [2, 4, 3, 3]},
  },
  themeId: 'neon-lab',
  audioUrl: null,
});
const file = await stat(path.join(process.cwd(), '.generated', path.basename(result.url)));
if (file.size < 10_000) throw new Error('Rendered MP4 was unexpectedly small');

console.log(JSON.stringify({ ok: true, ...result, bytes: file.size }, null, 2));
