import assert from 'node:assert/strict';
import { buildStoryboard, pacedCaptionWordIndex, REEL_DIRECTIONS } from '../src/remotion/direction.ts';
import { ATP_DEMO_SPEC, type MotionSpec } from '../src/remotion/visual-spec.ts';

const spec: MotionSpec = {
  ...ATP_DEMO_SPEC,
  narrativeBeats: [
    { label: 'Hook', headline: 'Why does the gradient matter?', body: 'Predict the energy change.' },
    { label: 'Model', headline: 'Build the membrane model', body: 'Protons collect on one side of the membrane and store potential energy.' },
    { label: 'Example', headline: 'Follow the moving protons', body: 'Flow through ATP synthase turns the molecular machine and couples ADP plus phosphate to ATP.' },
    { label: 'Recall', headline: 'Name the conversion', body: 'Retrieve the mechanism before the payoff appears.' },
  ],
};

const storyboard = buildStoryboard(spec, 360);
assert.deepEqual(storyboard.map((beat) => beat.role), ['hook', 'model', 'example', 'recall']);
assert.equal(storyboard.reduce((sum, beat) => sum + beat.durationInFrames, 0), 360);
assert.equal(new Set(storyboard.map((beat) => beat.visualKind)).size, 4);
assert.ok(storyboard[2].durationInFrames > storyboard[0].durationInFrames, 'Longer narration must receive more frames');
assert.deepEqual(storyboard.map((beat) => beat.startFrame), [0, storyboard[0].durationInFrames, storyboard[0].durationInFrames + storyboard[1].durationInFrames, storyboard[0].durationInFrames + storyboard[1].durationInFrames + storyboard[2].durationInFrames]);

const mathKinds = buildStoryboard({ ...spec, grammar: 'math-equation' }, 360).map((beat) => beat.visualKind);
const physicsKinds = buildStoryboard({ ...spec, grammar: 'physics-diagram' }, 360).map((beat) => beat.visualKind);
assert.deepEqual(mathKinds, ['equation-teaser', 'equation-construction', 'worked-transformation', 'equation-retrieval']);
assert.deepEqual(physicsKinds, ['phenomenon-teaser', 'diagram-setup', 'motion-and-vectors', 'diagram-retrieval']);

const profiles = Object.values(REEL_DIRECTIONS);
assert.equal(new Set(profiles.map((profile) => profile.background)).size, 4);
assert.equal(new Set(profiles.map((profile) => profile.transition)).size, 4);
assert.equal(new Set(profiles.map((profile) => profile.caption)).size, 4);
assert.equal(new Set(profiles.map((profile) => JSON.stringify(profile.stage))).size, 4);
assert.equal(pacedCaptionWordIndex(0, 90, 6), 0);
assert.equal(pacedCaptionWordIndex(45, 90, 6), 3);
assert.equal(pacedCaptionWordIndex(89, 90, 6), 5);

console.log(JSON.stringify({
  ok: true,
  durations: storyboard.map((beat) => ({ role: beat.role, frames: beat.durationInFrames })),
  directions: profiles.map((profile) => profile.id),
}, null, 2));
