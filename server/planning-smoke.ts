import assert from 'node:assert/strict';
import { buildStoryboard } from '../src/remotion/direction.ts';
import { ATP_DEMO_SPEC } from '../src/remotion/visual-spec.ts';
import { deriveLearningArcPolicy, learningArcRole, reelCountForWeeklyHours } from '../src/planning.ts';

const expectedBands = new Map([
  [2, 3], [3, 4], [4, 4], [5, 5], [6, 5], [7, 6], [9, 6], [10, 7], [11, 7], [12, 8], [14, 8],
]);
for (const [hours, expected] of expectedBands) assert.equal(reelCountForWeeklyHours(hours), expected);

for (const [hours, expected] of [[2, 3], [5, 5], [14, 8]] as const) {
  assert.equal(reelCountForWeeklyHours(hours), expected);
  Array.from({length: expected}, (_, index) => {
    const role = learningArcRole(index, expected);
    if (index === 0) {
      assert.equal(role, 'foundation');
    } else if (index === expected - 1) {
      assert.equal(role, 'synthesis');
    }
  });
}

const middle = deriveLearningArcPolicy(5, 'Middle school');
const professional = deriveLearningArcPolicy(5, 'Professional');
assert.match(middle.motionDirection, /slower construction/);
assert.match(professional.motionDirection, /brisk transitions/);
assert.notDeepEqual(middle, professional);

const emphasized = buildStoryboard({
  ...ATP_DEMO_SPEC,
  narrativeBeats: [
    {label: 'Hook', headline: 'Hook', body: 'equal words here'},
    {label: 'Model', headline: 'Model', body: 'equal words here'},
    {label: 'Example', headline: 'Example', body: 'equal words here'},
    {label: 'Recall', headline: 'Recall', body: 'equal words here'},
  ],
  motionDirection: {tempo: 'balanced', transitionEnergy: 'balanced', beatEmphasis: [1, 4, 1, 1]},
}, 360);
assert.ok(emphasized[1].durationInFrames > emphasized[0].durationInFrames);

console.log(JSON.stringify({
  ok: true,
  bands: Object.fromEntries(expectedBands),
  defaultPolicy: deriveLearningArcPolicy(5, 'High school'),
  emphasizedFrames: emphasized.map((beat) => ({role: beat.role, frames: beat.durationInFrames})),
}, null, 2));
