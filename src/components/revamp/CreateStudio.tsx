import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Cloud,
  FileText,
  Layers3,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UploadCloud,
  WandSparkles,
  Zap,
} from 'lucide-react';
import {
  generateWorkspaceWithOpenAI,
  getApiHealth,
  LiveGenerationError,
  type ApiHealth,
  type GenerationStage,
  type LiveGenerationEvent,
} from '../../api';
import { generateWorkspace, readLearningFile, sampleLearningSource, type LearningSource } from '../../generation';
import { deriveLearningArcPolicy } from '../../planning';
import { getTemplate, templates, type CourseWorkspace, type OutputFormat, type TemplateId } from '../../product';
import { isResearchTopicPrompt } from '../../research-mode';

interface CreateStudioProps {
  onComplete: (workspace: CourseWorkspace) => void;
}

const steps = [
  { id: 1, label: 'Source', hint: 'Add your material' },
  { id: 2, label: 'Learning goal', hint: 'Shape the plan' },
  { id: 3, label: 'Visual style', hint: 'Choose the energy' },
  { id: 4, label: 'Build', hint: 'Review & generate' },
];

const MIN_SOURCE_CHARACTERS = 20;

const generationStages: Array<{ id: GenerationStage; label: string; detail: string }> = [
  { id: 'moderation', label: 'Checking source safety', detail: 'Screening the goal and source before generation' },
  { id: 'research', label: 'Researching the topic', detail: 'Finding reliable sources and building a cited evidence brief' },
  { id: 'series_planner', label: 'Mapping the learning arc', detail: 'Creating source-grounded lessons and recall checks' },
  { id: 'infographic', label: 'Directing real infographics', detail: 'Rendering topic-specific layouts and text with GPT Image' },
  { id: 'voice', label: 'Recording reel narration', detail: 'Synthesizing audio for the first motion reel' },
  { id: 'motion', label: 'Rendering topic motion', detail: 'Building the first real 1080×1920 Remotion reel' },
  { id: 'collector', label: 'Publishing your lesson kit', detail: 'Joining the plan, formats and generated assets' },
];

type StageStatus = 'pending' | 'running' | 'done' | 'warning';

function initialStageState() {
  return Object.fromEntries(generationStages.map((stage) => [stage.id, 'pending'])) as Record<GenerationStage, StageStatus>;
}

function dateInThreeWeeks() {
  const date = new Date();
  date.setDate(date.getDate() + 21);
  return date.toISOString().slice(0, 10);
}

export function CreateStudio({ onComplete }: CreateStudioProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const studioLayout = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [source, setSource] = useState<LearningSource | null>(null);
  const [paste, setPaste] = useState('');
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [goal, setGoal] = useState('Ace my next exam');
  const [examDate, setExamDate] = useState(dateInThreeWeeks());
  const [hoursPerWeek, setHoursPerWeek] = useState(5);
  const [level, setLevel] = useState('High school');
  const [outputs, setOutputs] = useState<OutputFormat[]>(['reel', 'post', 'playable']);
  const [templateId, setTemplateId] = useState<TemplateId>('auto');
  const [generating, setGenerating] = useState(false);
  const [apiHealth, setApiHealth] = useState<ApiHealth | null>(null);
  const [healthChecked, setHealthChecked] = useState(false);
  const [generationMeta, setGenerationMeta] = useState<{ textModel: string; imageModel: string; audioModel: string } | null>(null);
  const [stageState, setStageState] = useState<Record<GenerationStage, StageStatus>>(initialStageState);
  const [currentGeneration, setCurrentGeneration] = useState(generationStages[0]);
  const [generationWarnings, setGenerationWarnings] = useState<string[]>([]);
  const [generationError, setGenerationError] = useState<LiveGenerationError | null>(null);
  const template = getTemplate(templateId);
  const arcPolicy = useMemo(() => deriveLearningArcPolicy(hoursPerWeek, level), [hoursPerWeek, level]);

  const pastedText = paste.trim();
  const pasteIsResearchTopic = isResearchTopicPrompt(pastedText);
  const canUsePaste = pasteIsResearchTopic || pastedText.length >= MIN_SOURCE_CHARACTERS;
  const canAdvance = step !== 1 || source !== null || canUsePaste;
  const activeGenerationStages = useMemo(
    () => generationStages.filter((stage) => {
      if (stage.id === 'research') return source?.mode === 'research';
      if (stage.id === 'infographic') return outputs.includes('post');
      if (stage.id === 'voice' || stage.id === 'motion') return outputs.includes('reel');
      return true;
    }),
    [outputs, source?.mode],
  );
  const progress = useMemo(() => {
    if (!generating) return 0;
    const points = activeGenerationStages.reduce((total, stage) => {
      const status = stageState[stage.id];
      return total + (status === 'done' || status === 'warning' ? 1 : status === 'running' ? 0.45 : 0);
    }, 0);
    return Math.max(8, (points / activeGenerationStages.length) * 100);
  }, [activeGenerationStages, generating, stageState]);

  useEffect(() => {
    let active = true;
    const check = async () => {
      let health = await getApiHealth();
      if (!health) {
        await new Promise((resolve) => window.setTimeout(resolve, 900));
        health = await getApiHealth();
      }
      if (!active) return;
      setApiHealth(health);
      setHealthChecked(true);
    };
    void check();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (window.innerWidth <= 820 && step > 1) {
      studioLayout.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [step]);

  const ingestFile = async (file?: File) => {
    if (!file) return;
    setReading(true);
    setReadError('');
    try {
      const nextSource = await readLearningFile(file);
      if (!nextSource.text.trim()) throw new Error('No readable text was found in this file.');
      setSource(nextSource);
    } catch (error) {
      setSource(null);
      setReadError(error instanceof Error ? error.message : 'This file could not be read. Try a text-based PDF or paste your notes.');
    } finally {
      setReading(false);
    }
  };

  const toggleOutput = (format: OutputFormat) => {
    setOutputs((current) => {
      if (current.includes(format)) return current.length === 1 ? current : current.filter((item) => item !== format);
      return [...current, format];
    });
  };

  const commitPastedSource = () => {
    if (!canUsePaste) return false;
    setReadError('');
    setSource(pasteIsResearchTopic
      ? {
          name: pastedText,
          kind: 'Web-researched topic',
          text: pastedText,
          mode: 'research',
        }
      : {
          name: 'Pasted study notes',
          kind: `${pastedText.split(/\s+/).length} words`,
          text: pastedText,
          mode: 'provided',
        });
    return true;
  };

  const continueStudio = () => {
    if (step === 1 && !source && !commitPastedSource()) return;
    setStep((value) => Math.min(4, value + 1));
  };

  const generationInput = () => source
    ? { source, goal, examDate, hoursPerWeek, level, templateId, outputs }
    : null;

  const handleGenerationEvent = (event: LiveGenerationEvent) => {
    if (event.type === 'meta') {
      setGenerationMeta({ textModel: event.textModel, imageModel: event.imageModel, audioModel: event.audioModel });
      return;
    }
    if (event.type === 'progress') {
      setCurrentGeneration({ id: event.stage, label: event.label, detail: event.detail });
      setStageState((current) => ({ ...current, [event.stage]: event.status }));
      return;
    }
    if (event.type === 'warning') {
      setStageState((current) => ({ ...current, [event.stage]: 'warning' }));
      setGenerationWarnings((current) => [...current, event.message]);
    }
  };

  const buildWithOpenAI = async () => {
    const input = generationInput();
    if (!input) return;
    setGenerating(true);
    setGenerationError(null);
    setGenerationMeta(null);
    setGenerationWarnings([]);
    setStageState(initialStageState());
    setCurrentGeneration(generationStages[0]);
    try {
      const workspace = await generateWorkspaceWithOpenAI(input, handleGenerationEvent);
      onComplete(workspace);
    } catch (error) {
      setGenerating(false);
      setGenerationError(error instanceof LiveGenerationError
        ? error
        : new LiveGenerationError({ code: 'AI_UNAVAILABLE', message: 'OpenAI generation could not be completed.', retryable: true, fallbackAllowed: input.source.mode !== 'research' }));
    }
  };

  const buildLocally = () => {
    const input = generationInput();
    if (!input) return;
    if (input.source.mode === 'research') {
      setGenerationError(new LiveGenerationError({
        code: 'RESEARCH_REQUIRES_OPENAI',
        message: 'Web research needs the connected OpenAI server so sources can be searched and cited. Restore the connection and retry.',
        retryable: true,
        fallbackAllowed: false,
      }));
      return;
    }
    setGenerationError(null);
    onComplete(generateWorkspace(input));
  };

  const buildWorkspace = () => {
    if (apiHealth?.configured) void buildWithOpenAI();
    else buildLocally();
  };

  return (
    <div className="create-studio page-enter">
      <header className="page-heading create-heading">
        <div>
          <p className="eyebrow"><Sparkles size={14} /> Creation studio</p>
          <h1>Turn any syllabus into a learning world.</h1>
          <p>One guided setup. A study plan, animated reels, saveable posts and recall games come out together.</p>
        </div>
        <span className={`local-badge ${apiHealth?.configured ? 'is-connected' : ''}`}>
          {apiHealth?.configured ? <Cloud size={13} /> : <span />}
          {!healthChecked
            ? 'Checking OpenAI connection…'
            : apiHealth?.configured
              ? `OpenAI connected · ${apiHealth.textModel}`
              : 'Local adapter · OpenAI unavailable'}
        </span>
      </header>

      <div ref={studioLayout} className="studio-layout">
        <aside className="studio-steps" aria-label="Creation steps">
          {steps.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${step === item.id ? 'is-active' : ''} ${step > item.id ? 'is-complete' : ''}`}
              onClick={() => item.id < step && !generating && setStep(item.id)}
              disabled={item.id > step || generating}
            >
              <span className="step-number">{step > item.id ? <Check size={14} /> : item.id}</span>
              <span><strong>{item.label}</strong><em>{item.hint}</em></span>
            </button>
          ))}
          <div className="studio-promise">
            <Zap size={18} />
            <p><strong>One source, three ways to learn.</strong> Every concept gets the visual grammar it needs while the set stays branded.</p>
          </div>
        </aside>

        <section className="studio-card">
          {step === 1 && (
            <div className="studio-step-panel">
              <div className="step-heading">
                <span>STEP 01</span>
                <h2>What are we learning from?</h2>
                <p>Upload a file, paste notes, or type a short topic and ReelLearn will research it first.</p>
              </div>

              {!source ? (
                <>
                  <button
                    type="button"
                    className={`source-dropzone ${dragging ? 'is-dragging' : ''}`}
                    onClick={() => fileInput.current?.click()}
                    onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
                    onDragOver={(event) => event.preventDefault()}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragging(false);
                      void ingestFile(event.dataTransfer.files[0]);
                    }}
                  >
                    <input
                      ref={fileInput}
                      type="file"
                      accept=".pdf,.txt,.md,text/plain,application/pdf"
                      onChange={(event) => void ingestFile(event.target.files?.[0])}
                      hidden
                    />
                    <span className="dropzone-icon">{reading ? <span className="mini-loader" /> : <UploadCloud size={28} />}</span>
                    <strong>{reading ? 'Reading your file…' : 'Drop your syllabus here'}</strong>
                    <p>or click to browse · PDF, TXT, MD up to 25 MB</p>
                  </button>
                  {readError && <p className="field-error" role="alert">{readError}</p>}

                  <div className="source-divider"><span>OR</span></div>
                  <label className="paste-field">
                    <span>What should we learn? <small>{paste.length.toLocaleString()}/60,000</small></span>
                    <textarea
                      value={paste}
                      onChange={(event) => setPaste(event.target.value)}
                      maxLength={60_000}
                      aria-describedby="paste-source-help"
                      placeholder={'Try a topic: “Oedipus Rex — comprehensive overview”\n\nOr paste notes, a syllabus outline, or a topic list…'}
                    />
                    <small id="paste-source-help" className={paste.length > 0 && !canUsePaste ? 'needs-more' : ''}>
                      {paste.length > 0 && !canUsePaste
                        ? 'Add a clearer topic, or paste at least 20 characters of notes.'
                        : pasteIsResearchTopic
                          ? 'Research mode · ReelLearn will search the web and attach its sources.'
                          : pastedText.length >= MIN_SOURCE_CHARACTERS
                            ? 'Source mode · ReelLearn will use only the material you pasted.'
                            : 'Short topics are researched with sources. Notes and topic lists stay source-grounded.'}
                    </small>
                  </label>
                  <div className="source-options">
                    <button
                      type="button"
                      className="text-button"
                      disabled={!canUsePaste}
                      onClick={commitPastedSource}
                    >
                      {pasteIsResearchTopic ? 'Research this topic' : 'Use pasted notes'} <ArrowRight size={15} />
                    </button>
                    <button type="button" className="sample-button" onClick={() => setSource(sampleLearningSource())}>
                      <Play size={14} fill="currentColor" /> Try the biology sample
                    </button>
                  </div>
                </>
              ) : (
                <div className="source-ready">
                  <div className="source-file-icon"><FileText size={26} /></div>
                  <div>
                    <span>{source.mode === 'research' ? 'Research topic ready' : 'Source ready'}</span>
                    <h3>{source.name}</h3>
                    <p>{source.kind}{source.mode === 'research' ? '' : ` · ${source.text.trim().split(/\s+/).length.toLocaleString()} readable words`}</p>
                  </div>
                  <button type="button" onClick={() => setSource(null)}>Replace</button>
                  <div className="source-scan" aria-hidden><span /></div>
                  <p className="source-insight"><WandSparkles size={16} /> {source.mode === 'research'
                    ? 'OpenAI will search the web first, build an evidence brief, and attach clickable sources to the lesson.'
                    : 'We’ll map concepts and recall points from this source only. If it is just an outline, add teaching notes for richer explanations.'}</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="studio-step-panel">
              <div className="step-heading">
                <span>STEP 02</span>
                <h2>Shape your learning goal.</h2>
                <p>This controls pacing, depth and when revision sessions appear.</p>
              </div>
              <div className="form-grid">
                <label className="form-field field-wide">
                  <span>What do you want to achieve?</span>
                  <input value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="e.g. Ace my midterm without cramming" />
                </label>
                <label className="form-field">
                  <span>Target date</span>
                  <input type="date" value={examDate} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setExamDate(event.target.value)} />
                </label>
                <label className="form-field">
                  <span>Current level</span>
                  <select value={level} onChange={(event) => setLevel(event.target.value)}>
                    <option>Middle school</option>
                    <option>High school</option>
                    <option>Undergraduate</option>
                    <option>Professional</option>
                  </select>
                </label>
                <label className="form-field field-wide range-field">
                  <span><b>Study time each week</b><strong>{hoursPerWeek} hours</strong></span>
                  <input type="range" min={2} max={14} value={hoursPerWeek} onChange={(event) => setHoursPerWeek(Number(event.target.value))} aria-describedby="arc-capacity-preview" />
                  <small><span>Light</span><span>Focused</span><span>Intensive</span></small>
                  <div className="arc-capacity-preview" id="arc-capacity-preview" aria-live="polite">
                    <strong>{arcPolicy.reelCount}</strong>
                    <p><b>connected reels</b><span>{arcPolicy.depthLabel} · increasing weekly capacity increases this learning arc up to eight reels.</span></p>
                  </div>
                </label>
              </div>
              <fieldset className="output-picker">
                <legend>Build these formats</legend>
                {([
                  ['reel', 'Animated reels', '30–60 sec concept stories', Play],
                  ['post', 'Infographic posts', 'Swipeable revision cards', Layers3],
                  ['playable', 'Playable recall', 'Mini challenges with feedback', Zap],
                ] as const).map(([id, label, hint, Icon]) => (
                  <button key={id} type="button" className={outputs.includes(id) ? 'is-selected' : ''} onClick={() => toggleOutput(id)}>
                    <span className="output-icon"><Icon size={20} /></span>
                    <span><strong>{label}</strong><em>{hint}</em></span>
                    <span className="output-check">{outputs.includes(id) && <Check size={14} />}</span>
                  </button>
                ))}
              </fieldset>
            </div>
          )}

          {step === 3 && (
            <div className="studio-step-panel">
              <div className="step-heading">
                <span>STEP 03</span>
                <h2>Pick a visual language.</h2>
                <p>Style sets the brand. Auto Director changes layout and motion to fit each topic.</p>
              </div>
              <div className="template-grid">
                {templates.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`template-option ${templateId === item.id ? 'is-selected' : ''}`}
                    style={{
                      ['--template-accent' as string]: item.accent,
                      ['--template-accent-2' as string]: item.accent2,
                      ['--template-surface' as string]: item.surface,
                      ['--template-ink' as string]: item.ink,
                    }}
                    onClick={() => setTemplateId(item.id)}
                  >
                    <span className="template-preview">
                      <i className="template-orbit" />
                      <i className="template-block" />
                      <strong>Aa</strong>
                      <em>LEARN / MOVE / REMEMBER</em>
                    </span>
                    <span className="template-copy">
                      <span><strong>{item.name}</strong>{templateId === item.id && <Check size={15} />}</span>
                      <em>{item.eyebrow}</em>
                      <p>{item.description}</p>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && !generating && source && (
            <div className="studio-step-panel review-panel">
              <div className="step-heading">
                <span>STEP 04</span>
                <h2>Your learning drop is ready to build.</h2>
                <p>Check the brief, then watch every format arrive as one connected lesson set.</p>
              </div>
              <div className="review-hero" style={{ ['--review-accent' as string]: template.accent, ['--review-accent-2' as string]: template.accent2 }}>
                <div>
                  <span>{template.name} visual system</span>
                  <h3>{goal || 'My learning arc'}</h3>
                  <p>{source.name}</p>
                </div>
                <strong>{arcPolicy.reelCount}<small>reels</small></strong>
              </div>
              <dl className="review-list">
                <div><dt>Source</dt><dd>{source.kind}</dd></div>
                <div><dt>Target</dt><dd>{new Date(`${examDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</dd></div>
                <div><dt>Pace</dt><dd>{hoursPerWeek} hours / week · {level}</dd></div>
                <div><dt>Outputs</dt><dd>{outputs.map((item) => item === 'playable' ? 'Playable recall' : item === 'post' ? 'Infographic posts' : 'Motion reels').join(' · ')}</dd></div>
                <div className="review-arc-row"><dt>Learning arc</dt><dd>{arcPolicy.reelCount} connected reels · {arcPolicy.depthLabel}</dd></div>
              </dl>
              <div className="truth-note">
                {apiHealth?.configured ? <ShieldCheck size={17} /> : <Sparkles size={17} />}
                {apiHealth?.configured ? (
                  <p><strong>{source.mode === 'research' ? 'OpenAI web research is connected' : 'OpenAI generation is connected'}</strong><span>{source.mode === 'research'
                    ? 'OpenAI will search for this topic, create an evidence brief, and show the consulted sources as clickable links before it directs the lesson assets. The API key stays on the server and Responses application-state storage is disabled.'
                    : 'Your extracted source text is sent to OpenAI for source-grounded planning, GPT Image artwork and reel narration. The API key stays on the server; Responses application-state storage is disabled and standard API data controls still apply.'}</span></p>
                ) : (
                  <p><strong>{source.mode === 'research' ? 'Research connection required' : 'Local adapter ready'}</strong><span>{source.mode === 'research'
                    ? 'Web research cannot be represented truthfully by the local adapter. Restore the OpenAI connection to search and cite sources.'
                    : 'The OpenAI server is not reachable, so this build will use its credential-free source adapter and label the result as local.'}</span></p>
                )}
              </div>
              {generationError && (
                <div className="generation-error" role="alert">
                  <TriangleAlert size={18} />
                  <div><strong>{generationError.code.replaceAll('_', ' ')}</strong><p>{generationError.message}</p>{generationError.traceId && <small>Reference {generationError.traceId.slice(0, 8)}</small>}</div>
                </div>
              )}
            </div>
          )}

          {generating && (
            <div className="generation-panel" aria-live="polite">
              <div className="generation-mark" style={{ ['--generation-progress' as string]: `${progress}%` }}>
                <span><WandSparkles size={28} /></span>
              </div>
              <p className="eyebrow">OPENAI · LIVE GENERATION</p>
              <h2>{currentGeneration.label}</h2>
              <p>{currentGeneration.detail}</p>
              {generationMeta && (
                <div className="generation-provider"><Cloud size={13} /><span>{generationMeta.textModel}</span><i /> <span>{generationMeta.imageModel}</span><i /> <span>{generationMeta.audioModel}</span></div>
              )}
              <div className="generation-progress"><span style={{ width: `${progress}%` }} /></div>
              <ul>
                {activeGenerationStages.map((item, index) => (
                  <li key={item.id} className={stageState[item.id] === 'done' ? 'is-done' : stageState[item.id] === 'running' ? 'is-active' : stageState[item.id] === 'warning' ? 'is-warning' : ''}>
                    <span>{stageState[item.id] === 'done' ? <Check size={13} /> : stageState[item.id] === 'warning' ? '!' : index + 1}</span>{item.label}
                  </li>
                ))}
              </ul>
              {generationWarnings.length > 0 && <p className="generation-warning">{generationWarnings.at(-1)}</p>}
              <small>Keep this tab open · source text is sent securely to OpenAI · key remains server-side</small>
            </div>
          )}

          {!generating && (
            <footer className="studio-footer">
              <button type="button" className="button-secondary" onClick={() => setStep((value) => Math.max(1, value - 1))} disabled={step === 1}>
                <ArrowLeft size={17} /> Back
              </button>
              {step < 4 ? (
                <button type="button" className="button-primary" disabled={!canAdvance} onClick={continueStudio}>
                  Continue <ArrowRight size={17} />
                </button>
              ) : (
                <div className="studio-footer-actions">
                  {generationError?.fallbackAllowed && (
                    <button type="button" className="button-secondary local-fallback-button" onClick={buildLocally}>
                      Build locally instead
                    </button>
                  )}
                  <button type="button" className="button-primary build-button" onClick={generationError && apiHealth?.configured ? () => void buildWithOpenAI() : buildWorkspace}>
                    {generationError ? <RefreshCw size={17} /> : <WandSparkles size={17} />}
                    {generationError
                      ? 'Retry OpenAI'
                      : apiHealth?.configured
                        ? 'Build with OpenAI'
                        : source?.mode === 'research'
                          ? 'Research with OpenAI'
                          : 'Build locally'}
                  </button>
                </div>
              )}
            </footer>
          )}
        </section>

        <aside className="studio-preview" style={{ ['--preview-accent' as string]: template.accent, ['--preview-accent-2' as string]: template.accent2, ['--preview-surface' as string]: template.surface, ['--preview-ink' as string]: template.ink }}>
          <div className="preview-label"><span>LIVE PREVIEW</span><em>{template.name}</em></div>
          <div className="preview-phone">
            <div className="preview-phone-top"><span>REELLEARN</span><span>0:36</span></div>
            <div className="preview-motion" aria-hidden>
              <span className="preview-ring" /><span className="preview-ring second" /><strong>01</strong>
            </div>
            <p>{source?.mode === 'research' ? 'FROM WEB RESEARCH' : source ? 'FROM YOUR SOURCE' : 'YOUR NEXT CONCEPT'}</p>
            <h3>{goal || 'One idea, made visual.'}</h3>
            <div className="preview-caption"><span>Watch the idea</span> build one clear layer at a time.</div>
            <div className="preview-track"><span /></div>
          </div>
          <p className="preview-note"><Sparkles size={14} /> Changes update the whole content set.</p>
        </aside>
      </div>
    </div>
  );
}
