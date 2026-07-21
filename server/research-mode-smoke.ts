import assert from 'node:assert/strict';
import { isResearchTopicPrompt } from '../src/research-mode.ts';

assert.equal(isResearchTopicPrompt('Adipis Rex comprehensive overview'), true);
assert.equal(isResearchTopicPrompt('Explain photosynthesis for a high school learner'), true);
assert.equal(isResearchTopicPrompt('Oedipus Rex'), true);
assert.equal(isResearchTopicPrompt('Photosynthesis'), true);
assert.equal(isResearchTopicPrompt('Unit 1: Forces and motion'), false);
assert.equal(isResearchTopicPrompt('Unit 1: Forces and motion\nUnit 2: Energy and momentum'), false);
assert.equal(isResearchTopicPrompt('ATP'), false);

console.info('Research-mode routing smoke passed.');
