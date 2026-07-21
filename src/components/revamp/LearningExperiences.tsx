import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Pause,
  Play,
  RotateCcw,
  Share2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { CourseWorkspace, InfographicSlide, OutputFormat, TopicLesson } from '../../product';
import { deriveInfographicSlides, getTemplate } from '../../product';
import { ReelFeed } from './ReelFeed';

interface ExperienceProps {
  workspace: CourseWorkspace;
  topic: TopicLesson;
}

interface ReelExperienceProps extends ExperienceProps {
  compact?: boolean;
  autoPlay?: boolean;
  onExpand?: () => void;
}

const REEL_LENGTH_SECONDS = 36;

const RemotionReelPlayer = lazy(() => import('./RemotionReelPlayer'));

function RemotionReelFallback({ workspace, topic, compact = false, onExpand }: ReelExperienceProps) {
  const template = getTemplate(topic.styleId ?? workspace.templateId);

  return (
    <section
      className={`reel-experience remotion-reel remotion-loading template-${template.id} ${compact ? 'is-compact' : ''}`}
      aria-label={`Loading Remotion reel: ${topic.title}`}
      aria-busy="true"
    >
      <div className="remotion-loading-frame" aria-hidden="true">
        <span className="remotion-loading-orbit"><Play size={compact ? 17 : 21} fill="currentColor" /></span>
        <p>Preparing motion lesson</p>
        <h3>{topic.title}</h3>
        <i><span /></i>
      </div>
      <span className="remotion-proof">REMOTION · LOADING</span>
      {topic.motionVideo && <a className="rendered-reel-link" href={topic.motionVideo.url} target="_blank" rel="noreferrer">MP4</a>}
      {compact && onExpand && <button type="button" className="remotion-open" onClick={onExpand}>Open reel</button>}
    </section>
  );
}

function LegacyReelExperience({ workspace, topic, compact = false, autoPlay = true, onExpand }: ReelExperienceProps) {
  const [playing, setPlaying] = useState(autoPlay);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0.08);
  const [durationSeconds, setDurationSeconds] = useState(REEL_LENGTH_SECONDS);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const template = getTemplate(workspace.templateId);

  useEffect(() => {
    if (!topic.narration?.url) return;
    const audio = new Audio(topic.narration.url);
    audio.loop = true;
    audio.preload = 'metadata';
    audio.muted = true;
    const updateTime = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDurationSeconds(audio.duration);
        setProgress(audio.currentTime / audio.duration);
      }
    };
    audio.addEventListener('loadedmetadata', updateTime);
    audio.addEventListener('timeupdate', updateTime);
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', updateTime);
      audio.removeEventListener('timeupdate', updateTime);
      audioRef.current = null;
    };
  }, [topic.narration?.url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = muted;
    if (!muted && playing) void audio.play().catch(() => undefined);
  }, [muted, playing]);

  useEffect(() => {
    if (!playing) return;
    if (audioRef.current && !muted) return;
    const timer = window.setInterval(() => {
      setProgress((current) => (current >= 1 ? 0 : Math.min(1, current + 0.0028)));
    }, 100);
    return () => window.clearInterval(timer);
  }, [muted, playing]);

  const scene = Math.min(3, Math.floor(progress * 4));
  const sceneCopy = topic.reelScenes?.[scene] ?? [
    { label: 'Start with the surprise', headline: topic.title, body: 'One clear idea. No textbook fog.' },
    { label: 'Build the mental model', headline: topic.keyFacts[0], body: topic.summary },
    { label: 'Connect the pieces', headline: topic.keyFacts[1], body: topic.keyFacts[2] },
    { label: 'Lock it in', headline: topic.question, body: 'Pause. Answer before the reveal.' },
  ][scene];

  return (
    <section
      className={`reel-experience template-${template.id} ${compact ? 'is-compact' : ''}`}
      style={{
        ['--experience-accent' as string]: template.accent,
        ['--experience-accent-2' as string]: template.accent2,
        ['--experience-surface' as string]: template.surface,
        ['--experience-ink' as string]: template.ink,
      }}
      aria-label={`Animated reel: ${topic.title}`}
    >
      <div className="reel-grain" aria-hidden />
      <div className="reel-topline">
        <span className="reel-brand-chip">REELLEARN</span>
        <span>{workspace.subject.toUpperCase()} · 01/{String(workspace.topics.length).padStart(2, '0')}{topic.visual ? ' · GPT IMAGE' : ''}</span>
      </div>

      <div className={`reel-scene reel-scene-${scene}`} aria-live="polite">
        <p className="reel-scene-label">{sceneCopy.label}</p>
        <div className={`reel-visual ${topic.visual ? 'has-generated-art' : ''}`}>
          {topic.visual && <img className="generated-reel-art" src={topic.visual.url} alt={topic.visual.alt} />}
          <span className="visual-orbit orbit-one" />
          <span className="visual-orbit orbit-two" />
          <span className="visual-core">
            <strong>{scene === 0 ? '01' : scene === 1 ? 'IDEA' : scene === 2 ? 'LINK' : '?'}</strong>
          </span>
          <span className="visual-particle particle-one" />
          <span className="visual-particle particle-two" />
          <span className="visual-particle particle-three" />
        </div>
        <h2>{sceneCopy.headline}</h2>
        <p className="reel-scene-body">{sceneCopy.body}</p>
      </div>

      <div className="reel-caption">
        <span className="caption-active">{sceneCopy.headline.split(' ').slice(0, 5).join(' ')}</span>{' '}
        <span>{sceneCopy.body.split(' ').slice(0, compact ? 6 : 12).join(' ')}</span>
      </div>

      <div className="reel-controls">
        <button
          type="button"
          onClick={() => {
            const next = !playing;
            setPlaying(next);
            if (!next) audioRef.current?.pause();
            else if (!muted) void audioRef.current?.play().catch(() => undefined);
          }}
          aria-label={playing ? 'Pause reel' : 'Play reel'}
        >
          {playing ? <Pause size={compact ? 15 : 18} fill="currentColor" /> : <Play size={compact ? 15 : 18} fill="currentColor" />}
        </button>
        <button
          type="button"
          onClick={() => {
            const next = !muted;
            setMuted(next);
            if (!next && playing) void audioRef.current?.play().catch(() => undefined);
          }}
          aria-label={muted ? topic.narration ? 'Play AI narration' : 'Narration unavailable' : 'Mute reel'}
          disabled={muted && !topic.narration}
        >
          {muted ? <VolumeX size={compact ? 15 : 18} /> : <Volume2 size={compact ? 15 : 18} />}
        </button>
        <div className="reel-timeline" aria-label={`${Math.round(progress * 100)}% played`}>
          <span style={{ width: `${progress * 100}%` }} />
        </div>
        <time>{Math.floor(progress * durationSeconds)}s</time>
        {onExpand && (
          <button type="button" className="reel-expand" onClick={onExpand}>
            Open
          </button>
        )}
      </div>
    </section>
  );
}

export function ReelExperience(props: ReelExperienceProps) {
  if (!props.topic.keyFacts?.length) return <LegacyReelExperience {...props} />;

  return (
    <Suspense fallback={<RemotionReelFallback {...props} />}>
      <RemotionReelPlayer {...props} />
    </Suspense>
  );
}

function SemanticInfographic({ slide }: { slide: InfographicSlide }) {
  const labels = slide.exactText.slice(1);

  if (slide.grammar === 'linear-process') {
    return <div className="semantic-diagram semantic-linear">{labels.map((label, index) => <span key={label}><i>{index + 1}</i><strong>{label}</strong>{index < labels.length - 1 && <em>→</em>}</span>)}</div>;
  }
  if (slide.grammar === 'cycle') {
    return <div className="semantic-diagram semantic-cycle"><span className="cycle-ring" />{labels.map((label, index) => <strong key={label} style={{ ['--point' as string]: index }}>{label}</strong>)}</div>;
  }
  if (slide.grammar === 'anatomy-cutaway') {
    return <div className="semantic-diagram semantic-anatomy"><span className="anatomy-membrane"><i /><i /><i /><em /></span>{labels.map((label, index) => <strong key={label} className={`anatomy-label-${index + 1}`}>{label}</strong>)}</div>;
  }
  if (slide.grammar === 'spatial-process') {
    return <div className="semantic-diagram semantic-cutaway"><span className="cutaway-cell"><i /><i /><i /></span>{labels.map((label, index) => <strong key={label} className={`callout-${index + 1}`}>{label}</strong>)}</div>;
  }
  if (slide.grammar === 'comparison') {
    return <div className="semantic-diagram semantic-comparison"><span><small>01</small><strong>{labels[0]}</strong></span><i>VS</i><span><small>02</small><strong>{labels[1] ?? labels[0]}</strong></span></div>;
  }
  if (slide.grammar === 'timeline') {
    return <div className="semantic-diagram semantic-timeline"><span className="timeline-track" />{labels.map((label, index) => <strong key={label}><i>{String(index + 1).padStart(2, '0')}</i>{label}</strong>)}</div>;
  }
  if (slide.grammar === 'network') {
    return <div className="semantic-diagram semantic-network"><strong>{labels[0]}</strong>{labels.slice(1).map((label, index) => <span key={label} className={`network-node-${index + 1}`}>{label}</span>)}</div>;
  }
  if (slide.grammar === 'hierarchy') {
    return <div className="semantic-diagram semantic-hierarchy"><strong>{labels[0]}</strong><div>{labels.slice(1).map((label) => <span key={label}>{label}</span>)}</div></div>;
  }
  if (slide.grammar === 'equation') {
    return <div className="semantic-diagram semantic-equation">{labels.map((label, index) => <span key={label}><strong>{label}</strong>{index < labels.length - 1 && <i>{index === labels.length - 2 ? '=' : '+'}</i>}</span>)}</div>;
  }
  if (slide.grammar === 'data-evidence') {
    return <div className="semantic-diagram semantic-data">{labels.map((label, index) => <span key={label}><i style={{ height: `${38 + index * 17}%` }} /><strong>{label}</strong></span>)}</div>;
  }
  return <div className="semantic-diagram semantic-metaphor"><span>{labels[0]?.slice(0, 2)}</span>{labels.slice(1).map((label) => <strong key={label}>{label}</strong>)}</div>;
}

export function PostExperience({ workspace, topic }: ExperienceProps) {
  const [slide, setSlide] = useState(0);
  const template = getTemplate(topic.styleId ?? workspace.templateId);
  const slides = useMemo(
    () => topic.infographicSlides?.length ? topic.infographicSlides : deriveInfographicSlides(topic),
    [topic],
  );
  const current = slides[slide];

  return (
    <section
      className={`post-experience post-grammar-${current.grammar}`}
      style={{
        ['--experience-accent' as string]: template.accent,
        ['--experience-accent-2' as string]: template.accent2,
        ['--experience-surface' as string]: template.surface,
        ['--experience-ink' as string]: template.ink,
      }}
      aria-label={`Infographic post: ${topic.title}`}
    >
      <article className={`post-paper ${current.image ? 'has-ai-infographic' : 'has-semantic-fallback'}`}>
        {current.image ? (
          <img className="post-generated-infographic" src={current.image.url} alt={current.image.alt} />
        ) : (
          <>
            <header>
              <span>REELLEARN / {workspace.subject.toUpperCase()}</span>
              <span>{String(slide + 1).padStart(2, '0')}—{String(slides.length).padStart(2, '0')}</span>
            </header>
            <p className="post-kicker">{current.role.replace('-', ' ')}</p>
            <h2>{current.title}</h2>
            <p className="post-body-copy">{current.subtitle}</p>
            <SemanticInfographic slide={current} />
            <footer>
              <span>{template.name} · {current.grammar.replace('-', ' ')}</span>
              <span>Swipe to learn →</span>
            </footer>
          </>
        )}
      </article>
      <div className="post-pagination">
        <button type="button" onClick={() => setSlide((value) => Math.max(0, value - 1))} disabled={slide === 0} aria-label="Previous slide">
          <ChevronLeft size={18} />
        </button>
        <div className="post-dots" aria-label={`Slide ${slide + 1} of ${slides.length}`}>
          {slides.map((item, index) => (
            <button key={`${item.role}-${index}`} type="button" className={index === slide ? 'is-active' : ''} onClick={() => setSlide(index)} aria-label={`Go to slide ${index + 1}`} />
          ))}
        </div>
        <button type="button" onClick={() => setSlide((value) => Math.min(slides.length - 1, value + 1))} disabled={slide === slides.length - 1} aria-label="Next slide">
          <ChevronRight size={18} />
        </button>
      </div>
      <details className="infographic-transcript">
        <summary>Exact learning copy</summary>
        <p>{current.subtitle}</p>
        <ul>{current.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
        {current.image && <span>Visual rendered by {current.image.provider}; the text above is the authoritative accessible copy.</span>}
      </details>
    </section>
  );
}

export function PlayableExperience({ workspace, topic }: ExperienceProps) {
  const [answer, setAnswer] = useState<number | null>(null);
  const [round, setRound] = useState(1);
  const template = getTemplate(workspace.templateId);
  const isCorrect = answer === topic.correctAnswer;

  const reset = () => {
    setAnswer(null);
    setRound((value) => value + 1);
  };

  return (
    <section
      className="playable-experience"
      style={{
        ['--experience-accent' as string]: template.accent,
        ['--experience-accent-2' as string]: template.accent2,
      }}
      aria-label={`Playable recall: ${topic.title}`}
    >
      <header className="playable-header">
        <div>
          <p>ACTIVE RECALL · ROUND {String(round).padStart(2, '0')}</p>
          <h2>Can you retrieve it?</h2>
        </div>
        <span className="playable-score">+20 XP</span>
      </header>
      <div className="playable-progress"><span style={{ width: answer === null ? '42%' : '100%' }} /></div>
      <p className="playable-question">{topic.question}</p>
      <div className="answer-grid">
        {topic.answers.map((option, index) => {
          const selected = answer === index;
          const correct = answer !== null && index === topic.correctAnswer;
          const wrong = selected && !correct;
          return (
            <button
              key={option}
              type="button"
              className={`${selected ? 'is-selected' : ''} ${correct ? 'is-correct' : ''} ${wrong ? 'is-wrong' : ''}`}
              onClick={() => answer === null && setAnswer(index)}
              disabled={answer !== null}
            >
              <span>{String.fromCharCode(65 + index)}</span>
              {option}
              {correct && <Check size={18} />}
            </button>
          );
        })}
      </div>
      {answer !== null && (
        <div className={`answer-feedback ${isCorrect ? 'is-correct' : 'is-wrong'}`} role="status">
          <div>
            <strong>{isCorrect ? 'That’s it.' : 'Good miss—now it will stick.'}</strong>
            <p>{topic.explanation}</p>
          </div>
          <button type="button" onClick={reset}>
            <RotateCcw size={16} /> Try again
          </button>
        </div>
      )}
    </section>
  );
}

interface ContentTheaterProps extends ExperienceProps {
  initialFormat?: OutputFormat;
  onClose: () => void;
}

export function ContentTheater({ workspace, topic, initialFormat = 'reel', onClose }: ContentTheaterProps) {
  const availableFormats = workspace.outputs.length ? workspace.outputs : (['reel', 'post', 'playable'] as OutputFormat[]);
  const [format, setFormat] = useState<OutputFormat>(availableFormats.includes(initialFormat) ? initialFormat : availableFormats[0]);
  const topics = useMemo(() => workspace.topics.length ? workspace.topics : [topic], [topic, workspace.topics]);
  const feedWorkspace = useMemo(() => workspace.topics.length ? workspace : { ...workspace, topics }, [topics, workspace]);
  const requestedTopicIndex = Math.max(0, topics.findIndex((item) => item.id === topic.id));
  const [activeTopicIndex, setActiveTopicIndex] = useState(requestedTopicIndex);
  const activeTopic = topics[activeTopicIndex] ?? topic;
  const [saved, setSaved] = useState(false);
  const [actionStatus, setActionStatus] = useState('');
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveTopicIndex(requestedTopicIndex);
  }, [requestedTopicIndex, topic.id, workspace.id]);

  useEffect(() => {
    const bookmarkKey = `reellearn.bookmark.${workspace.id}.${activeTopic.id}`;
    try {
      setSaved(window.localStorage.getItem(bookmarkKey) === 'saved');
    } catch {
      setSaved(false);
    }
  }, [activeTopic.id, workspace.id]);

  useEffect(() => {
    if (!actionStatus) return;
    const timer = window.setTimeout(() => setActionStatus(''), 3200);
    return () => window.clearTimeout(timer);
  }, [actionStatus]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => dialogRef.current?.focus());
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  const toggleSaved = () => {
    const nextSaved = !saved;
    const bookmarkKey = `reellearn.bookmark.${workspace.id}.${activeTopic.id}`;
    try {
      if (nextSaved) window.localStorage.setItem(bookmarkKey, 'saved');
      else window.localStorage.removeItem(bookmarkKey);
      setSaved(nextSaved);
      setActionStatus(nextSaved ? 'Saved to this browser.' : 'Removed from saved lessons.');
    } catch {
      setActionStatus('This browser could not update saved lessons.');
    }
  };

  const shareTopic = async () => {
    const shareText = `${activeTopic.title} — ${activeTopic.summary}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${activeTopic.title} · ReelLearn`, text: shareText, url: window.location.href });
        setActionStatus('Share sheet opened.');
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
        setActionStatus('Lesson link copied.');
        return;
      }
      setActionStatus('Sharing is not available in this browser.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setActionStatus('Sharing is not available in this browser.');
    }
  };

  return (
    <div className="theater-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className={`content-theater ${format === 'reel' ? 'is-reel-mode' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Learning content for ${activeTopic.title}`}
        tabIndex={-1}
      >
        <header className="theater-header">
          <div>
            <p>{workspace.title}<span>Concept {activeTopicIndex + 1} of {topics.length}</span></p>
            <h2>{activeTopic.title}</h2>
          </div>
          <div className="theater-actions">
            <button type="button" className={saved ? 'is-active' : ''} onClick={toggleSaved} aria-label={saved ? 'Remove from saved lessons' : 'Save lesson'} aria-pressed={saved}><Bookmark size={18} fill={saved ? 'currentColor' : 'none'} /></button>
            <button type="button" onClick={() => void shareTopic()} aria-label="Share lesson"><Share2 size={18} /></button>
            <button type="button" onClick={onClose} aria-label="Close player"><X size={20} /></button>
          </div>
        </header>

        <span className="theater-action-status" role="status" aria-live="polite">{actionStatus}</span>

        <nav className="format-switcher" aria-label="Content format">
          {availableFormats.map((item) => (
            <button key={item} type="button" className={format === item ? 'is-active' : ''} onClick={() => setFormat(item)}>
              {item === 'reel' ? 'Watch' : item === 'post' ? 'Swipe' : 'Play'}
            </button>
          ))}
        </nav>

        <details className="source-drawer">
          <summary><FileText size={15} /><strong>{workspace.generation?.research ? 'Web-researched' : 'Source-backed'}</strong><span>{workspace.sourceName}</span><ChevronRight size={15} /></summary>
          <div>
            <p>{workspace.generation?.research
              ? `OpenAI searched the web, then planned this lesson from a bounded evidence brief with ${workspace.generation.research.sources.length} consulted source${workspace.generation.research.sources.length === 1 ? '' : 's'}.`
              : workspace.generation?.provider === 'openai'
              ? `Planned with ${workspace.generation.textModel} from the extracted source text. Responses application-state storage was disabled; standard API data controls still apply.`
              : 'This local lesson is derived from the uploaded text. It adds no unlabelled external facts.'}</p>
            <span>{workspace.sourceKind} · {workspace.generation?.sourceNote ?? 'No outside enrichment was added.'}</span>
            {workspace.generation?.research && (
              <ul className="research-source-list">
                {workspace.generation.research.sources.map((source) => (
                  <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer"><ExternalLink size={10} />{source.title}</a></li>
                ))}
              </ul>
            )}
            {workspace.generation?.warnings.map((warning) => <em key={warning}>{warning}</em>)}
          </div>
        </details>

        <div className={`theater-stage theater-${format}`}>
          {format === 'reel' && (
            <ReelFeed
              workspace={feedWorkspace}
              activeIndex={activeTopicIndex}
              onActiveIndexChange={setActiveTopicIndex}
              onOpenPost={availableFormats.includes('post') ? () => setFormat('post') : undefined}
              onOpenPlayable={availableFormats.includes('playable') ? () => setFormat('playable') : undefined}
              renderReel={(feedTopic, autoPlay) => <ReelExperience workspace={workspace} topic={feedTopic} autoPlay={autoPlay} />}
            />
          )}
          {format === 'post' && <PostExperience key={activeTopic.id} workspace={workspace} topic={activeTopic} />}
          {format === 'playable' && <PlayableExperience key={activeTopic.id} workspace={workspace} topic={activeTopic} />}
        </div>
      </div>
    </div>
  );
}
