const baseUrl = process.env.REELLEARN_API_URL ?? 'http://127.0.0.1:8787';
const expectedReels = 3;

const response = await fetch(`${baseUrl}/api/generate`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json', Accept: 'application/x-ndjson'},
  body: JSON.stringify({
    source: {
      name: 'connected-motion-plan.txt',
      kind: 'Text · planning integration test',
      truncated: false,
      text: [
        'Projectile motion foundations',
        'Position describes where an object is relative to a chosen origin.',
        'Velocity gives the rate and direction of position change.',
        'Horizontal velocity remains constant when air resistance is ignored.',
        'Gravity produces a constant downward acceleration.',
        'The horizontal and vertical components combine to create a parabolic trajectory.',
        'A worked launch example should connect initial velocity, time, maximum height, and range.',
      ].join('\n'),
    },
    goal: 'Connect the full projectile motion model',
    examDate: '2026-08-30',
    hoursPerWeek: 2,
    level: 'Undergraduate',
    templateId: 'auto',
    outputs: ['playable'],
  }),
});

if (!response.ok) throw new Error(`Planning endpoint returned HTTP ${response.status}`);
const events = (await response.text()).split('\n').filter(Boolean).map((line) => JSON.parse(line) as Record<string, unknown>);
const errorEvent = events.find((event) => event.type === 'error');
if (errorEvent) throw new Error(`Planning failed with ${JSON.stringify(errorEvent.error)}`);
const resultEvent = events.find((event) => event.type === 'result');
if (!resultEvent?.workspace || typeof resultEvent.workspace !== 'object') throw new Error('Planning stream returned no workspace');

const workspace = resultEvent.workspace as {
  hoursPerWeek: number;
  level: string;
  topics: Array<{
    id: string;
    arc?: {role: string; prerequisiteTopicIds: string[]; bridgeFromPrevious: string | null};
    motionPlan?: {motionDirection?: {tempo: string; transitionEnergy: string; beatEmphasis: number[]}};
  }>;
  generation?: {provider?: string; imageModel?: string | null; audioModel?: string | null};
};

if (workspace.generation?.provider !== 'openai') throw new Error('Workspace did not use OpenAI');
if (workspace.topics.length !== expectedReels) throw new Error(`Expected ${expectedReels} reels, received ${workspace.topics.length}`);
if (workspace.topics[0]?.arc?.role !== 'foundation' || workspace.topics.at(-1)?.arc?.role !== 'synthesis') throw new Error('Arc endpoints were not foundation and synthesis');
workspace.topics.slice(1).forEach((topic, index) => {
  if (!topic.arc?.prerequisiteTopicIds.includes(workspace.topics[index].id) || !topic.arc.bridgeFromPrevious) throw new Error(`Reel ${index + 2} was not connected`);
});
if (!workspace.topics.every((topic) => topic.motionPlan?.motionDirection?.beatEmphasis.length === 4)) throw new Error('A reel was missing safe LLM motion direction');

console.log(JSON.stringify({
  ok: true,
  hoursPerWeek: workspace.hoursPerWeek,
  level: workspace.level,
  reelCount: workspace.topics.length,
  roles: workspace.topics.map((topic) => topic.arc?.role),
  motionDirections: workspace.topics.map((topic) => topic.motionPlan?.motionDirection),
  assetModels: {image: workspace.generation?.imageModel ?? null, audio: workspace.generation?.audioModel ?? null},
}, null, 2));
