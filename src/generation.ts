import { deriveMathEquationMotion, derivePhysicsDiagramMotion } from './product';
import type {
  ConcreteTemplateId,
  CourseWorkspace,
  InfographicGrammar,
  InfographicSlide,
  MotionGrammar,
  MotionSpec,
  OutputFormat,
  TemplateId,
  TopicLesson,
} from './product';
import { deriveLearningArcPolicy, learningArcRole } from './planning';
import type { LearningSourceMode } from './research-mode';

export interface LearningSource {
  name: string;
  kind: string;
  text: string;
  mode?: LearningSourceMode;
}

export interface GenerationInput {
  source: LearningSource;
  goal: string;
  examDate: string;
  hoursPerWeek: number;
  level: string;
  templateId: TemplateId;
  outputs: OutputFormat[];
}

const STOP_LINES = new Set([
  'table of contents',
  'course outline',
  'learning outcomes',
  'learning objectives',
  'references',
  'assessment',
  'assignments',
]);

const SUBJECT_SIGNALS: Array<[string, string[]]> = [
  ['Biology', ['cell', 'genetics', 'organism', 'photosynthesis', 'respiration', 'enzyme']],
  ['Chemistry', ['molecule', 'reaction', 'stoichiometry', 'acid', 'bond', 'periodic']],
  ['Physics', ['force', 'motion', 'velocity', 'electric', 'quantum', 'energy']],
  ['Mathematics', ['calculus', 'derivative', 'integral', 'algebra', 'function', 'probability']],
  ['Computer Science', ['algorithm', 'programming', 'database', 'network', 'python', 'software']],
  ['History', ['empire', 'revolution', 'century', 'war', 'civilization', 'history']],
  ['Economics', ['market', 'inflation', 'demand', 'supply', 'economy', 'fiscal']],
  ['Literature', ['novel', 'poetry', 'character', 'narrative', 'literature', 'author']],
];

function tidy(value: string) {
  return value
    .replace(/[•●▪◦]/g, ' ')
    .replace(/^\s*(?:unit|chapter|module|week|topic|section)?\s*[\dIVXLC]+\s*[:.)-]?\s*/i, '')
    .replace(/\s+/g, ' ')
    .replace(/[.:;,\s-]+$/, '')
    .trim();
}

function titleCase(value: string) {
  return value
    .split(' ')
    .map((word) => {
      if (/^(and|or|of|in|to|the|for|with|from)$/i.test(word)) return word.toLowerCase();
      return word.length <= 3 && word === word.toUpperCase()
        ? word
        : `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
    })
    .join(' ');
}

function safeSentence(value: string, fallback: string) {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (cleaned.length < 28 || cleaned.length > 210) return fallback;
  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

function shortLabel(value: string, words = 4) {
  return value
    .replace(/[.!?]$/, '')
    .split(/\s+/)
    .slice(0, words)
    .join(' ')
    .toUpperCase();
}

function inferVisualGrammar(title: string): InfographicGrammar {
  const value = title.toLowerCase();
  if (/cycle|loop|recycl/.test(value)) return 'cycle';
  if (/cell|membrane|organ|anatom|mitochond|structure/.test(value)) return 'spatial-process';
  if (/versus|\bvs\b|compare|difference|misconception/.test(value)) return 'comparison';
  if (/history|century|era|revolution|evolution/.test(value)) return 'timeline';
  if (/network|ecosystem|web|relationship/.test(value)) return 'network';
  if (/equation|formula|derivative|integral|reaction/.test(value)) return 'equation';
  if (/steps?|moves?|pathway|process|glycolysis|transport/.test(value)) return 'linear-process';
  return 'visual-metaphor';
}

function styleForTopic(title: string, index: number): ConcreteTemplateId {
  const value = title.toLowerCase();
  if (/cell|physics|chem|energy|equation|algorithm|network/.test(value)) return 'neon-lab';
  if (/history|literature|story|era|poetry/.test(value)) return 'editorial';
  if (/organism|ecosystem|field|geology|environment/.test(value)) return 'field-notes';
  return (['kinetic', 'editorial', 'field-notes', 'neon-lab'] as const)[index % 4];
}

function createInfographicSlides(title: string, summary: string, facts: [string, string, string]): InfographicSlide[] {
  const grammar = inferVisualGrammar(title);
  const focal = shortLabel(title, 5);
  const labels = facts.map((fact) => shortLabel(fact, 3));
  const mechanismGrammar: InfographicGrammar = grammar === 'visual-metaphor'
    ? 'linear-process'
    : grammar === 'comparison'
      ? 'network'
      : grammar;

  return [
    {
      role: 'concept-map', grammar, title, subtitle: summary,
      exactText: [focal, labels[0], labels[1]], facts: facts.slice(0, 2),
      artDirection: `Use a topic-native ${grammar} composition with one dominant visual for ${title} and direct annotations.`,
      imageAlt: `${grammar.replace('-', ' ')} infographic explaining ${title}.`,
    },
    {
      role: 'mechanism', grammar: mechanismGrammar, title: 'How the pieces connect', subtitle: facts[0],
      exactText: ['HOW IT WORKS', ...labels], facts,
      artDirection: `Show the mechanism of ${title} with a clear entry point, truthful relations, and a distinct reading path.`,
      imageAlt: `Mechanism diagram showing how the main ideas in ${title} connect.`,
    },
    {
      role: 'retrieval', grammar: 'comparison', title: 'Retrieve the difference', subtitle: 'Contrast the anchor idea with the most likely confusion.',
      exactText: ['RETRIEVE', labels[0], labels[2], 'WHAT CHANGES?'], facts: [facts[0], facts[2]],
      artDirection: `Use a bold split comparison for ${title}; make the conceptual distinction immediately scannable.`,
      imageAlt: `Side-by-side retrieval comparison for ${title}.`,
    },
  ];
}

function sourceExcerptForTopic(sourceText: string, title: string) {
  const lines = sourceText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return '';
  const tokens = title.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length >= 4).slice(0, 5);
  const scored = lines.map((line, index) => ({
    index,
    score: tokens.reduce((total, token) => total + (line.toLowerCase().includes(token) ? 1 : 0), 0),
  })).sort((a, b) => b.score - a.score || a.index - b.index);
  const start = scored[0]?.score ? scored[0].index : 0;
  const excerpt: string[] = [];
  for (let index = start; index < lines.length && excerpt.length < 6; index += 1) {
    if (index > start && /^(?:unit|chapter|module|week|topic|section)\b/i.test(lines[index])) break;
    excerpt.push(lines[index]);
  }
  return excerpt.join('\n');
}

function createMotionPlan(title: string, summary: string, facts: [string, string, string], subject: string, sourceText: string, level: string, index: number): MotionSpec {
  const value = title.toLowerCase();
  const subjectValue = subject.toLowerCase();
  const motionDirection = localMotionDirection(level, index);
  const genericNodes = facts.map((fact, index) => ({ id: `idea-${index + 1}`, label: shortLabel(fact, 4), kind: index === 0 ? 'input' as const : index === 2 ? 'output' as const : 'process' as const }));
  if (/physics|mechanics|electricity|optics/.test(subjectValue)) {
    return {
      grammar: 'physics-diagram', title, setting: 'Source-grounded physics diagram', objective: summary, takeHome: facts[0],
      nodes: genericNodes,
      links: [
        { from: 'idea-1', to: 'idea-2', label: 'changes the motion' },
        { from: 'idea-2', to: 'idea-3', label: 'produces the result' },
      ],
      mathEquation: deriveMathEquationMotion(`${title}\n${summary}\n${facts.join('\n')}`),
      physicsDiagram: derivePhysicsDiagramMotion({ title, summary, keyFacts: facts }),
      motionDirection,
    };
  }
  const isMaths = /math|algebra|calculus|geometry|statistics/.test(subjectValue);
  const topicSource = sourceExcerptForTopic(sourceText, title);
  const mathEquation = isMaths
    ? deriveMathEquationMotion(`${title}\n${summary}\n${facts.join('\n')}`) ?? deriveMathEquationMotion(topicSource)
    : null;
  if (mathEquation) {
    return {
      grammar: 'math-equation', title, setting: 'Source-grounded equation', objective: summary, takeHome: facts[0],
      nodes: genericNodes,
      links: [
        { from: 'idea-1', to: 'idea-2', label: 'transform the expression' },
        { from: 'idea-2', to: 'idea-3', label: 'reach the result' },
      ],
      mathEquation,
      physicsDiagram: null,
      motionDirection,
    };
  }
  if (/atp|chemiosmosis|cellular respiration/.test(value)) {
    return {
      grammar: 'energy-transfer', title, setting: 'Cell and inner mitochondrial membrane', objective: summary, takeHome: facts[0],
      nodes: [
        { id: 'cell', label: 'CELL', kind: 'location' },
        { id: 'mitochondrion', label: 'MITOCHONDRION', kind: 'location' },
        { id: 'gradient', label: 'H+ GRADIENT', kind: 'carrier' },
        { id: 'synthase', label: 'ATP SYNTHASE', kind: 'machine' },
        { id: 'adp', label: 'ADP + Pi', kind: 'input' },
        { id: 'atp', label: 'ATP', kind: 'output' },
      ],
      links: [
        { from: 'cell', to: 'mitochondrion', label: 'zoom to energy machinery' },
        { from: 'gradient', to: 'synthase', label: 'H+ flows through' },
        { from: 'adp', to: 'synthase', label: 'inputs enter' },
        { from: 'synthase', to: 'atp', label: 'ATP forms' },
      ],
      motionDirection,
    };
  }
  const infographicGrammar = inferVisualGrammar(title);
  const grammar: MotionGrammar = isMaths
    ? 'linear-process'
    : infographicGrammar === 'cycle' || infographicGrammar === 'comparison' || infographicGrammar === 'timeline' || infographicGrammar === 'network' || infographicGrammar === 'equation' || infographicGrammar === 'spatial-process'
    ? infographicGrammar
    : 'linear-process';
  return {
    grammar,
    title,
    setting: 'Source-grounded concept space',
    objective: summary,
    takeHome: facts[0],
    nodes: genericNodes,
    links: [
      { from: 'idea-1', to: 'idea-2', label: 'connects to' },
      { from: 'idea-2', to: 'idea-3', label: 'leads to' },
    ],
    motionDirection,
  };
}

export async function readLearningFile(file: File): Promise<LearningSource> {
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('This file is larger than 25 MB. Compress it or upload a shorter source.');
  }
  const lower = file.name.toLowerCase();

  if (file.type === 'application/pdf' || lower.endsWith('.pdf')) {
    const [pdfjs, worker] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]);
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const document = await pdfjs.getDocument({ data: bytes }).promise;
    const pageText: string[] = [];
    const pagesToRead = Math.min(document.numPages, 80);

    for (let pageNumber = 1; pageNumber <= pagesToRead; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const line = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .filter(Boolean)
        .join(' ');
      pageText.push(line);
    }

    return {
      name: file.name,
      kind: `PDF · ${document.numPages} page${document.numPages === 1 ? '' : 's'}`,
      text: pageText.join('\n'),
      mode: 'provided',
    };
  }

  const text = await file.text();
  return {
    name: file.name,
    kind: `${lower.endsWith('.md') ? 'Markdown' : 'Text'} · ${Math.max(1, Math.round(file.size / 1024))} KB`,
    text,
    mode: 'provided',
  };
}

function inferSubject(text: string) {
  const haystack = text.toLowerCase();
  let best: [string, number] = ['General studies', 0];
  for (const [subject, signals] of SUBJECT_SIGNALS) {
    const score = signals.reduce((total, signal) => total + (haystack.includes(signal) ? 1 : 0), 0);
    if (score > best[1]) best = [subject, score];
  }
  return best[0];
}

function extractTopicTitles(text: string) {
  const rawLines = text.split(/\r?\n|(?<=[.!?])\s+(?=[A-Z\d])/);
  const scored = rawLines
    .map((raw, index) => {
      const line = tidy(raw);
      const words = line.split(' ').filter(Boolean);
      const lookedLikeHeading = /^(?:unit|chapter|module|week|topic|section|\d+[.)]|[IVXLC]+[.)])/i.test(raw.trim());
      const headingShape = words.length >= 2 && words.length <= 10 && line.length <= 78;
      const score = (lookedLikeHeading ? 4 : 0) + (headingShape ? 2 : 0) + (index < 40 ? 1 : 0);
      return { line, score, index };
    })
    .filter(({ line }) => {
      const normalized = line.toLowerCase();
      return (
        line.length >= 7 &&
        line.length <= 90 &&
        !STOP_LINES.has(normalized) &&
        !/^(page|copyright|www\.|http|email|date|grade|hours?\b)/i.test(line) &&
        !/^[\d\s/.-]+$/.test(line)
      );
    })
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const unique: string[] = [];
  for (const candidate of scored) {
    const normalized = candidate.line.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (unique.some((item) => item.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized)) continue;
    if (unique.some((item) => item.toLowerCase().includes(candidate.line.toLowerCase()))) continue;
    unique.push(titleCase(candidate.line));
    if (unique.length === 8) break;
  }
  return unique;
}

function sentencesForTopic(text: string, topic: string) {
  const broadTokens = new Set(['energy', 'concept', 'concepts', 'learning', 'overview', 'introduction', 'foundations']);
  const tokens = topic
    .split(/\W+/)
    .map((token) => token.toLowerCase())
    .filter((token) => token.length >= 3 && !broadTokens.has(token))
    .slice(0, 4);
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 30 && sentence.length <= 220)
    .map((sentence) => ({
      sentence,
      score: tokens.reduce((total, token) => total + (sentence.toLowerCase().includes(token) ? 1 : 0), 0),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.sentence)
    .slice(0, 4);
}

function fallbackTopics(sourceName: string) {
  const base = titleCase(
    sourceName
      .replace(/\.[^.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\b(syllabus|notes|slides|course|outline)\b/gi, '')
      .trim(),
  );
  const focus = base || 'Core Concepts';
  return [
    `${focus}: the big picture`,
    `Essential vocabulary for ${focus}`,
    `The parts of ${focus}`,
    `${focus} step by step`,
    `A worked example of ${focus}`,
    `Common misconceptions in ${focus}`,
    `Apply and recall ${focus}`,
    `Connect the full ${focus} model`,
  ];
}

function localMotionDirection(level: string, index: number) {
  if (level === 'Middle school') return { tempo: 'measured' as const, transitionEnergy: 'gentle' as const, beatEmphasis: [2, 4, 2, 3] as [number, number, number, number] };
  if (level === 'Undergraduate') return { tempo: 'balanced' as const, transitionEnergy: 'punchy' as const, beatEmphasis: [1, 4, 4, 3] as [number, number, number, number] };
  if (level === 'Professional') return { tempo: 'brisk' as const, transitionEnergy: 'punchy' as const, beatEmphasis: [2, 2, 4, 3] as [number, number, number, number] };
  return { tempo: 'balanced' as const, transitionEnergy: index % 3 === 2 ? 'punchy' as const : 'balanced' as const, beatEmphasis: [2, 4, 3, 3] as [number, number, number, number] };
}

function createLesson(title: string, index: number, sourceText: string, subject: string, level: string): TopicLesson {
  const matches = sentencesForTopic(sourceText, title);
  const summaryFallback = `Build a clear mental model of ${title.toLowerCase()}, then connect it to the ideas that come before and after it.`;
  const summary = safeSentence(matches[0] ?? '', summaryFallback);
  const facts = [
    safeSentence(matches[0] ?? '', `Start with the core definition of ${title.toLowerCase()}`),
    safeSentence(matches[1] ?? '', `Connect ${title.toLowerCase()} to one concrete example from the source`),
    safeSentence(matches[2] ?? '', 'Finish with a quick retrieval check—not a reread'),
  ].map((fact) => fact.replace(/[.!?]$/, '')) as [string, string, string];

  const date = new Date();
  date.setDate(date.getDate() + index * 2);

  return {
    id: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 42)}-${index}`,
    title,
    unit: `${String(index + 1).padStart(2, '0')} · ${index === 0 ? 'Start here' : index === 1 ? 'Build the model' : 'Deepen & apply'}`,
    scheduledDate: date.toISOString().slice(0, 10),
    minutes: 16 + (index % 3) * 4,
    status: index === 0 ? 'ready' : index === 1 ? 'next' : 'later',
    summary,
    keyFacts: facts,
    question: `Which move best helps you understand ${title.toLowerCase()}?`,
    answers: [facts[0], 'Skip the definition and memorize the last line', 'Avoid examples until exam day', 'Treat every related idea as interchangeable'],
    correctAnswer: 0,
    explanation: `${facts[0]}. That gives you an anchor before adding examples and exceptions.`,
    styleId: styleForTopic(title, index),
    infographicSlides: createInfographicSlides(title, summary, facts),
    motionPlan: createMotionPlan(title, summary, facts, subject, sourceText, level, index),
  };
}

export function generateWorkspace(input: GenerationInput): CourseWorkspace {
  if (input.source.mode === 'research') {
    throw new Error('Research topics require the connected OpenAI web-research path.');
  }
  const extracted = extractTopicTitles(input.source.text);
  const arcPolicy = deriveLearningArcPolicy(input.hoursPerWeek, input.level);
  const fallback = fallbackTopics(input.source.name);
  const titles = [...(extracted.length >= 3 ? extracted : []), ...fallback]
    .filter((title, index, values) => values.findIndex((value) => value.toLowerCase() === title.toLowerCase()) === index)
    .slice(0, arcPolicy.reelCount);
  const subject = inferSubject(`${input.source.name} ${input.source.text}`);
  const goalTitle = input.goal.trim();
  const sourceTitle = input.source.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  const lessons = titles.map((title, index) => createLesson(title, index, input.source.text, subject, input.level));
  const topics = lessons.map((topic, index) => ({
    ...topic,
    arc: {
      position: index + 1,
      total: lessons.length,
      role: learningArcRole(index, lessons.length),
      prerequisiteTopicIds: index === 0 ? [] : [lessons[index - 1].id],
      bridgeFromPrevious: index === 0
        ? null
        : `${topic.title} extends the model from ${lessons[index - 1].title}.`,
    },
  }));

  return {
    id: `workspace-${Date.now()}`,
    title: goalTitle || `${titleCase(sourceTitle || subject)} Learning Arc`,
    subject,
    sourceName: input.source.name,
    sourceKind: input.source.kind,
    examDate: input.examDate,
    hoursPerWeek: input.hoursPerWeek,
    level: input.level,
    templateId: input.templateId,
    outputs: input.outputs,
    topics,
    createdAt: new Date().toISOString(),
    generation: {
      provider: 'local',
      textModel: 'local-source-adapter',
      imageModel: null,
      audioModel: null,
      sourceQuality: extracted.length >= 3 ? 'sufficient' : 'outline_only',
      sourceNote: extracted.length >= 3
        ? 'The local adapter found enough source headings to assemble this workspace.'
        : 'The source was sparse, so this local workspace uses a generic study scaffold.',
      warnings: ['Built locally without OpenAI generation.'],
    },
  };
}

export const sampleSyllabus = `
AP Biology — Cellular Energetics
Unit 1: ATP and energy coupling
Unit 2: Enzymes and activation energy
Unit 3: Glycolysis and pyruvate oxidation
Unit 4: The citric acid cycle
Unit 5: Electron transport and chemiosmosis
Unit 6: Fermentation and metabolic variation

Students should explain how cells capture, transfer, and use energy. ATP releases usable energy when its terminal phosphate is transferred. Glycolysis occurs in the cytosol and produces pyruvate, ATP, and NADH. The citric acid cycle loads high-energy electron carriers. Electron transport establishes a proton gradient across the inner mitochondrial membrane. ATP synthase uses that gradient to produce ATP. Fermentation regenerates NAD+ when oxygen is limited.
`;

export function sampleLearningSource(): LearningSource {
  return {
    name: 'AP_Biology_Unit_3_syllabus.pdf',
    kind: 'Sample syllabus · 6 topics',
    text: sampleSyllabus,
    mode: 'provided',
  };
}
