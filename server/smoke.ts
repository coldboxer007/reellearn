const baseUrl = process.env.REELLEARN_API_URL ?? 'http://127.0.0.1:8787';

const response = await fetch(`${baseUrl}/api/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
  body: JSON.stringify({
    source: {
      name: 'cell-energy-smoke-test.txt',
      kind: 'Text · live integration test',
      truncated: false,
      text: [
        'Cellular Energetics',
        'ATP transfers usable energy when its terminal phosphate group is removed.',
        'Glycolysis occurs in the cytosol and converts one glucose into two pyruvate, with a net gain of two ATP and two NADH.',
        'The citric acid cycle loads electron carriers including NADH and FADH2.',
        'The electron transport chain builds a proton gradient across the inner mitochondrial membrane.',
        'ATP synthase uses proton flow down that gradient to make ATP.',
        'Fermentation regenerates NAD+ when oxygen is limited so glycolysis can continue.',
      ].join('\n'),
    },
    goal: 'Understand cellular respiration for an upcoming exam',
    examDate: '2026-08-15',
    hoursPerWeek: 5,
    level: 'High school',
    templateId: 'kinetic',
    outputs: ['reel', 'post', 'playable'],
  }),
});

if (!response.ok) throw new Error(`Generation endpoint returned HTTP ${response.status}`);
const events = (await response.text())
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line) as Record<string, unknown>);
const errorEvent = events.find((event) => event.type === 'error');
if (errorEvent) throw new Error(`Generation failed with ${JSON.stringify(errorEvent.error)}`);
const resultEvent = events.find((event) => event.type === 'result');
if (!resultEvent || !resultEvent.workspace || typeof resultEvent.workspace !== 'object') {
  throw new Error('Generation stream did not include a workspace result');
}

const workspace = resultEvent.workspace as {
  title: string;
  topics: Array<{
    visual?: { url: string };
    narration?: { url: string };
    motionVideo?: { url: string; width: number; height: number; fps: number; durationInFrames: number };
    motionPlan?: { grammar: string };
    infographicSlides?: Array<{ grammar: string; image?: { url: string } }>;
  }>;
  generation?: { provider?: string; textModel?: string; imageModel?: string; audioModel?: string; warnings?: string[] };
};
if (workspace.generation?.provider !== 'openai' || workspace.topics.length < 3) {
  throw new Error('Workspace did not use OpenAI or returned too few topics');
}

const visualUrl = workspace.topics[0]?.visual?.url;
const narrationUrl = workspace.topics[0]?.narration?.url;
const videoUrl = workspace.topics[0]?.motionVideo?.url;
const imageUrls = workspace.topics.flatMap((topic) => topic.infographicSlides?.flatMap((slide) => slide.image?.url ? [slide.image.url] : []) ?? []);
if (!visualUrl || !narrationUrl || !videoUrl) throw new Error('Live generation did not return infographic, narration, and motion-video assets');
if (workspace.topics[0]?.infographicSlides?.filter((slide) => slide.image).length !== 3) throw new Error('First topic did not receive a complete three-slide GPT Image carousel');
if (!workspace.topics.every((topic) => topic.infographicSlides?.[0]?.image && topic.motionPlan?.grammar)) throw new Error('Every topic needs a generated hero infographic and a semantic motion plan');
if (new Set(imageUrls).size !== imageUrls.length) throw new Error('Generated infographic URLs were reused');
const [visualResponse, narrationResponse, videoResponse] = await Promise.all([
  fetch(`${baseUrl}${visualUrl}`, { method: 'HEAD' }),
  fetch(`${baseUrl}${narrationUrl}`, { method: 'HEAD' }),
  fetch(`${baseUrl}${videoUrl}`, { method: 'HEAD' }),
]);
if (!visualResponse.ok || !narrationResponse.ok || !videoResponse.ok) throw new Error('A generated asset URL is not readable');

console.log(JSON.stringify({
  ok: true,
  title: workspace.title,
  topicCount: workspace.topics.length,
  textModel: workspace.generation.textModel,
  imageModel: workspace.generation.imageModel,
  audioModel: workspace.generation.audioModel,
  infographicCount: imageUrls.length,
  uniqueInfographicCount: new Set(imageUrls).size,
  firstTopicGrammar: workspace.topics[0]?.motionPlan?.grammar,
  visualContentType: visualResponse.headers.get('content-type'),
  narrationContentType: narrationResponse.headers.get('content-type'),
  videoContentType: videoResponse.headers.get('content-type'),
  video: workspace.topics[0]?.motionVideo,
  warnings: workspace.generation.warnings,
}, null, 2));
