import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BellRing,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  FileText,
  ExternalLink,
  Flame,
  LayoutGrid,
  Link2,
  MessageCircle,
  Play,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react';
import { classActivity, deriveMotionPlan, getTemplate, librarySamples, type CourseWorkspace, type OutputFormat, type TopicLesson, type ViewId } from '../../product';
import { deriveLearningArcPolicy } from '../../planning';
import { PostExperience, ReelExperience } from './LearningExperiences';

interface WorkspaceViewProps {
  workspace: CourseWorkspace;
  onNavigate: (view: ViewId) => void;
  onOpen: (topic: TopicLesson, format?: OutputFormat) => void;
  contentOpen?: boolean;
}

function friendlyDate(date: string, includeYear = false) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: includeYear ? undefined : 'short',
    month: 'short',
    day: 'numeric',
    year: includeYear ? 'numeric' : undefined,
  });
}

export function TodayView({ workspace, onNavigate, onOpen, contentOpen = false }: WorkspaceViewProps) {
  const topic = workspace.topics.find((item) => item.status === 'ready') ?? workspace.topics[0];
  const template = getTemplate(workspace.templateId);
  const motionPlan = topic.motionPlan ?? deriveMotionPlan(topic, workspace.subject);
  const motionMark = motionPlan.grammar === 'math-equation' ? 'fx'
    : motionPlan.grammar === 'physics-diagram' ? '→'
      : motionPlan.grammar === 'energy-transfer' ? 'ATP'
        : topic.title.split(/\s+/).map((word) => word[0]).join('').slice(0, 3).toUpperCase();
  const reelSeconds = Math.round((topic.motionVideo?.durationInFrames ?? 360) / (topic.motionVideo?.fps ?? 30));
  const completed = workspace.topics.filter((item) => item.status === 'complete').length;
  const progress = Math.max(12, Math.round((completed / workspace.topics.length) * 100));

  return (
    <div className="today-view page-enter">
      <header className="today-welcome">
        <div>
          <p className="eyebrow"><span className="live-dot" /> Tuesday · your learning pulse</p>
          <h1>Good afternoon, Sahil.</h1>
          <p>You’re one focused session away from keeping your week on track.</p>
        </div>
        <button type="button" className="button-primary" onClick={() => onNavigate('create')}>
          <WandSparkles size={17} /> Create lesson
        </button>
      </header>

      <section className="course-hero" style={{ ['--course-accent' as string]: template.accent, ['--course-accent-2' as string]: template.accent2 }}>
        <div className="course-hero-copy">
          <div className="course-source"><FileText size={14} /> {workspace.sourceName}<span>{workspace.sourceKind}</span></div>
          <p className="eyebrow">TODAY’S LEARNING DROP · {workspace.subject.toUpperCase()}</p>
          <h2>{topic.title}</h2>
          <p className="course-summary">{topic.summary}</p>
          <div className="course-facts">
            <span><Clock3 size={15} /> {topic.minutes} min</span>
            <span><Play size={15} fill="currentColor" /> Reel + post + recall</span>
            <span><Target size={15} /> +80 XP</span>
          </div>
          <div className="course-actions">
            <button type="button" className="hero-play" onClick={() => onOpen(topic, 'reel')}>
              <span><Play size={19} fill="currentColor" /></span> Start today’s lesson
            </button>
            <button type="button" className="hero-plan" onClick={() => onNavigate('plan')}>View plan <ArrowRight size={16} /></button>
          </div>
          <div className="course-progress-row">
            <span>Course progress</span>
            <div><span style={{ width: `${progress}%` }} /></div>
            <strong>{progress}%</strong>
          </div>
        </div>
        <div className="course-hero-player">
          {contentOpen ? (
            <div className="course-hero-reel-cover" aria-hidden="true">
              <span>{String(workspace.topics.findIndex((item) => item.id === topic.id) + 1).padStart(2, '0')}</span>
              <strong>{motionMark}</strong>
              <p>Learning path open</p>
            </div>
          ) : (
            <ReelExperience workspace={workspace} topic={topic} compact onExpand={() => onOpen(topic, 'reel')} />
          )}
          <div className="hero-floating-note">
            <span><Sparkles size={14} /> AI storyboard</span>
            <strong>4 visual scenes</strong>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-section format-section">
          <header className="section-heading-row">
            <div><p className="eyebrow">ONE CONCEPT · THREE ANGLES</p><h2>Learn it your way.</h2></div>
            <button type="button" onClick={() => onNavigate('library')}>Open library <ArrowRight size={15} /></button>
          </header>
          <div className="format-cards">
            <button type="button" className="format-card reel-format" onClick={() => onOpen(topic, 'reel')}>
              <div className="format-mini-reel">
                <span className="mini-orbit" /><strong>{motionMark}</strong><i><Play size={12} fill="currentColor" /></i>
              </div>
              <span className="format-type"><Play size={14} /> Motion reel</span>
              <h3>See the concept move</h3>
              <p>{reelSeconds} sec · animated explainer</p>
            </button>
            <button type="button" className="format-card post-format" onClick={() => onOpen(topic, 'post')}>
              <div className="format-mini-post"><span>01</span><strong>{topic.title.split(' ').slice(0, 4).join(' ')}</strong><i>Swipe →</i></div>
              <span className="format-type"><LayoutGrid size={14} /> Infographic post</span>
              <h3>Save the mental model</h3>
              <p>{topic.infographicSlides?.length ?? 3} slides · topic-directed</p>
            </button>
            <button type="button" className="format-card game-format" onClick={() => onOpen(topic, 'playable')}>
              <div className="format-mini-game"><span>?</span><i /><i /><i /></div>
              <span className="format-type"><Zap size={14} /> Playable recall</span>
              <h3>Prove you can retrieve it</h3>
              <p>4 questions · instant feedback</p>
            </button>
          </div>
        </section>

        <aside className="dashboard-section week-section">
          <header className="section-heading-row">
            <div><p className="eyebrow">YOUR ARC</p><h2>This week.</h2></div>
            <span>{completed}/{workspace.topics.length}</span>
          </header>
          <ol className="week-list">
            {workspace.topics.slice(0, 4).map((item, index) => (
              <li key={item.id} className={`week-item status-${item.status}`}>
                <span className="week-index">{item.status === 'complete' ? <Check size={14} /> : String(index + 1).padStart(2, '0')}</span>
                <button type="button" onClick={() => onOpen(item, 'reel')}>
                  <strong>{item.title}</strong><em>{friendlyDate(item.scheduledDate)} · {item.minutes} min</em>
                </button>
                <ChevronRight size={16} />
              </li>
            ))}
          </ol>
          <button type="button" className="week-plan-link" onClick={() => onNavigate('plan')}>See full learning plan <ArrowRight size={15} /></button>
        </aside>
      </div>

      <section className="class-strip">
        <div className="class-strip-title"><span><Users size={18} /></span><div><p className="eyebrow">CLASS PULSE</p><h2>You’re learning with 28 others.</h2></div></div>
        <div className="class-avatars">
          {classActivity.map((item) => <span key={item.id} style={{ ['--avatar-color' as string]: item.color }}>{item.initials}</span>)}
          <span className="avatar-more">+24</span>
        </div>
        <p><strong>Maya and 3 others</strong> finished today’s concept.</p>
        <button type="button" onClick={() => onNavigate('classroom')}>Join them <ArrowRight size={15} /></button>
      </section>
    </div>
  );
}

export function PlanView({ workspace, onOpen }: WorkspaceViewProps) {
  const [completedIds, setCompletedIds] = useState(() => new Set(workspace.topics.filter((item) => item.status === 'complete').map((item) => item.id)));
  const completeCount = completedIds.size;
  const progress = Math.round((completeCount / workspace.topics.length) * 100);
  const arcPolicy = deriveLearningArcPolicy(workspace.hoursPerWeek, workspace.level);

  const toggleComplete = (id: string) => {
    setCompletedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="plan-view page-enter">
      <header className="page-heading plan-page-heading">
        <div>
          <p className="eyebrow"><CalendarDays size={14} /> Adaptive study plan</p>
          <h1>{workspace.title}</h1>
          <p>{workspace.generation?.research ? `Built from web research on ${workspace.sourceName}.` : `Built from ${workspace.sourceName}.`} Finish a lesson and the plan keeps your review rhythm visible.</p>
        </div>
        <div className="exam-card"><span>Target date</span><strong>{friendlyDate(workspace.examDate, true)}</strong><em>{workspace.hoursPerWeek}h / week</em></div>
      </header>

      <section className="plan-overview">
        <div className="plan-ring" style={{ ['--plan-progress' as string]: `${progress * 3.6}deg` }}><span><strong>{progress}%</strong><em>complete</em></span></div>
        <div className="plan-overview-copy"><p className="eyebrow">PACE CHECK · {arcPolicy.depthLabel.toUpperCase()}</p><h2>{progress >= 60 ? 'You’re ahead of the curve.' : 'A steady week beats a heroic night.'}</h2><p>{workspace.topics.length - completeCount} connected reels remain. Your {workspace.hoursPerWeek}-hour weekly capacity shaped this arc.</p></div>
        <div className="plan-metrics"><span><strong>{workspace.topics.length}</strong><em>reels</em></span><span><strong>{workspace.topics.reduce((sum, item) => sum + item.minutes, 0)}</strong><em>minutes</em></span><span><strong>2</strong><em>review loops</em></span></div>
      </section>

      <div className="plan-content-grid">
        <section className="plan-timeline-section">
          <header className="section-heading-row"><div><p className="eyebrow">LEARNING ARC</p><h2>Reel by reel.</h2></div><button type="button"><Sparkles size={14} /> Rebalance</button></header>
          <ol className="plan-timeline">
            {workspace.topics.map((topic, index) => {
              const complete = completedIds.has(topic.id);
              return (
                <li key={topic.id} className={complete ? 'is-complete' : index === completeCount ? 'is-current' : ''}>
                  <button type="button" className="timeline-check" onClick={() => toggleComplete(topic.id)} aria-label={`${complete ? 'Mark incomplete' : 'Mark complete'}: ${topic.title}`}>
                    {complete ? <Check size={15} /> : <span>{index + 1}</span>}
                  </button>
                  <div className="timeline-line" />
                  <div className="timeline-card">
                    <div className="timeline-card-top"><span>{topic.unit}</span><time>{friendlyDate(topic.scheduledDate)}</time></div>
                    <h3>{topic.title}</h3>
                    {index > 0 && <div className="timeline-connection"><Link2 size={12} /><span>Builds from reel {String(index).padStart(2, '0')}</span><strong>{topic.arc?.bridgeFromPrevious ?? `Extends ${workspace.topics[index - 1].title}.`}</strong></div>}
                    <p>{topic.summary}</p>
                    <div className="timeline-meta"><span><Clock3 size={14} /> {topic.minutes} min</span><span><Play size={14} /> {workspace.outputs.length} formats</span><button type="button" onClick={() => onOpen(topic, 'reel')}>{complete ? 'Review' : 'Open lesson'} <ArrowRight size={14} /></button></div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <aside className="revision-rail">
          <section className="revision-card"><span className="revision-icon"><Target size={19} /></span><p className="eyebrow">SPACED REVIEW</p><h3>Your memory loop is on.</h3><p>Completed concepts return as 20-second remixes and mixed recall rounds.</p><div className="review-dates"><span><strong>24</strong><em>Jul</em></span><i /><span><strong>31</strong><em>Jul</em></span><i /><span><strong>08</strong><em>Aug</em></span></div></section>
          <section className="source-card"><FileText size={20} /><div><span>{workspace.generation?.research ? 'Research topic' : 'Plan source'}</span><strong>{workspace.sourceName}</strong><em>{workspace.sourceKind}</em></div><CircleCheck size={17} /></section>
          {workspace.generation?.research && (
            <details className="plan-research-sources">
              <summary>{workspace.generation.research.sources.length} research sources <ChevronRight size={14} /></summary>
              <ul>
                {workspace.generation.research.sources.map((source) => (
                  <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer"><ExternalLink size={11} />{source.title}</a></li>
                ))}
              </ul>
            </details>
          )}
        </aside>
      </div>
    </div>
  );
}

export function LibraryView({ workspace, onOpen }: WorkspaceViewProps) {
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const filters = ['All', 'Reels', 'Posts', 'Playables'];
  const samples = useMemo(() => librarySamples.filter((item) => {
    const matchesFilter = filter === 'All' || (filter === 'Reels' && item.format === 'Reel') || (filter === 'Posts' && item.format === 'Post') || (filter === 'Playables' && item.format === 'Playable');
    const matchesQuery = `${item.title} ${item.topic}`.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  }), [filter, query]);

  return (
    <div className="library-view page-enter">
      <header className="page-heading library-heading"><div><p className="eyebrow"><BookOpen size={14} /> Learning library</p><h1>Everything you’ve made, ready to revisit.</h1><p>Watch, swipe or play. Your progress follows the concept—not the format.</p></div><div className="library-stat"><strong>{librarySamples.length + workspace.topics.length}</strong><span>learning pieces</span></div></header>
      <div className="library-toolbar">
        <div className="library-filters" role="group" aria-label="Filter library">{filters.map((item) => <button key={item} type="button" className={filter === item ? 'is-active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div>
        <label className="library-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search concepts" /></label>
      </div>

      <section className="featured-library">
        <div className="featured-post"><PostExperience workspace={workspace} topic={workspace.topics[0]} /></div>
        <div className="featured-copy"><p className="eyebrow">FEATURED SET · {workspace.subject.toUpperCase()}</p><h2>{workspace.topics[0].title}</h2><p>{workspace.topics[0].summary}</p><div className="featured-chips"><span><Play size={14} /> Remotion reel</span><span><LayoutGrid size={14} /> {workspace.topics[0].infographicSlides?.length ?? 3} directed slides</span><span><Zap size={14} /> Recall round</span></div><button type="button" className="button-primary" onClick={() => onOpen(workspace.topics[0], 'reel')}>Open lesson set <ArrowRight size={16} /></button></div>
      </section>

      <section className="library-grid-section">
        <header className="section-heading-row"><div><p className="eyebrow">YOUR COLLECTION</p><h2>{filter === 'All' ? 'Recent learning pieces' : filter}</h2></div><span>{samples.length} results</span></header>
        <div className="library-grid">
          {samples.map((item, index) => {
            const template = getTemplate(item.templateId);
            const topic = workspace.topics[index % workspace.topics.length];
            const format: OutputFormat = item.format === 'Reel' ? 'reel' : item.format === 'Post' ? 'post' : 'playable';
            return (
              <button key={item.id} type="button" className={`library-card library-${format}`} style={{ ['--library-accent' as string]: template.accent, ['--library-accent-2' as string]: template.accent2, ['--library-surface' as string]: template.surface, ['--library-ink' as string]: template.ink }} onClick={() => onOpen(topic, format)}>
                <div className="library-art"><span>{format === 'reel' ? <Play size={20} fill="currentColor" /> : format === 'post' ? 'Aa' : '?'}</span><i /><i /></div>
                <div className="library-card-copy"><span className="format-pill">{item.format}</span><h3>{item.title}</h3><p>{item.topic}</p><div><span>{item.duration}</span><span>{template.name}</span></div></div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

type LeaderboardPeriod = 'week' | 'all-time';
type ChallengeStatus = 'idle' | 'playing' | 'complete';

interface DemoActivity {
  id: string;
  initials: string;
  name: string;
  action: string;
  time: string;
  color: string;
  reactionCount: number;
}

interface DemoNotice {
  id: string;
  title: string;
  message: string;
  tone: 'pulse' | 'social' | 'success';
}

const leaderboardSeed = [
  { id: 'maya', initials: 'MC', name: 'Maya Chen', color: '#ff9b73', weekXp: 1290, allTimeXp: 11240, movement: 2 },
  { id: 'arjun', initials: 'AS', name: 'Arjun Singh', color: '#7a70f8', weekXp: 1100, allTimeXp: 11890, movement: -1 },
  { id: 'noor', initials: 'NK', name: 'Noor Khan', color: '#45b995', weekXp: 980, allTimeXp: 8690, movement: 1 },
  { id: 'you', initials: 'ST', name: 'Sahil Tanna', color: '#513ea8', weekXp: 940, allTimeXp: 8320, movement: 1, isYou: true },
  { id: 'leo', initials: 'LR', name: 'Leo Rivera', color: '#e4a441', weekXp: 810, allTimeXp: 7540, movement: 0 },
];

function classCodeFor(subject: string) {
  const prefix = subject.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase().padEnd(3, 'X');
  return `${prefix || 'CLS'}-204`;
}

export function ClassroomView({ workspace, onOpen }: WorkspaceViewProps) {
  const primaryTopic = workspace.topics[0];
  const nextTopic = workspace.topics[1] ?? primaryTopic;
  const challengeTopics = workspace.topics.slice(0, 4);
  const generatedClassCode = classCodeFor(workspace.subject);
  const matchTimer = useRef<number | null>(null);
  const ambientNoticeShown = useRef(false);
  const activitySequence = useRef(0);
  const [joined, setJoined] = useState(true);
  const [code, setCode] = useState(generatedClassCode);
  const [matching, setMatching] = useState(false);
  const [matched, setMatched] = useState(false);
  const [helloSent, setHelloSent] = useState(false);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>('week');
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(true);
  const [reactions, setReactions] = useState<Record<string, boolean>>({});
  const [postedActivities, setPostedActivities] = useState<DemoActivity[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [updateText, setUpdateText] = useState('');
  const [notice, setNotice] = useState<DemoNotice | null>(null);
  const [challengeStatus, setChallengeStatus] = useState<ChallengeStatus>('idle');
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [challengeAnswers, setChallengeAnswers] = useState<Array<number | null>>([]);
  const [challengeScore, setChallengeScore] = useState(0);

  const seededActivities = useMemo<DemoActivity[]>(() => {
    const topics = workspace.topics.length ? workspace.topics : [{ title: workspace.title }];
    const actions = [
      `mastered ${topics[0]?.title ?? workspace.title}`,
      `shared a memory cue for ${topics[1]?.title ?? topics[0]?.title ?? workspace.title}`,
      `finished ${topics[2]?.title ?? topics[0]?.title ?? workspace.title} recall round`,
    ];

    return classActivity.map((item, index) => ({
      ...item,
      action: actions[index],
      reactionCount: [12, 8, 16][index],
    }));
  }, [workspace.title, workspace.topics]);

  const leaderboard = useMemo(() => {
    const scoreKey = leaderboardPeriod === 'week' ? 'weekXp' : 'allTimeXp';
    return leaderboardSeed
      .map((entry) => ({
        ...entry,
        xp: entry[scoreKey] + (entry.isYou && challengeStatus === 'complete' ? 80 : 0),
      }))
      .sort((a, b) => b.xp - a.xp);
  }, [challengeStatus, leaderboardPeriod]);

  const allActivities = [...postedActivities, ...seededActivities];
  const currentChallenge = challengeTopics[challengeIndex];
  const selectedChallengeAnswer = challengeAnswers[challengeIndex];

  const pushNotice = (next: Omit<DemoNotice, 'id'>) => {
    ambientNoticeShown.current = true;
    setNotice({ ...next, id: `${Date.now()}-${activitySequence.current++}` });
  };

  useEffect(() => {
    if (!joined || ambientNoticeShown.current || !primaryTopic) return;
    const timer = window.setTimeout(() => {
      if (ambientNoticeShown.current) return;
      ambientNoticeShown.current = true;
      setNotice({
        id: 'ambient-class-pulse',
        title: 'Noor just finished a recall round',
        message: `${primaryTopic.title} is active in your demo class.`,
        tone: 'pulse',
      });
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [joined, primaryTopic]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 5200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => () => {
    if (matchTimer.current) window.clearTimeout(matchTimer.current);
  }, []);

  const findMatch = () => {
    if (matchTimer.current) window.clearTimeout(matchTimer.current);
    setMatching(true);
    matchTimer.current = window.setTimeout(() => {
      setMatching(false);
      setMatched(true);
      pushNotice({
        title: 'Study match found',
        message: `Maya is also revising ${primaryTopic?.title ?? workspace.title}.`,
        tone: 'social',
      });
    }, 1200);
  };

  const toggleReaction = (activity: DemoActivity) => {
    const willReact = !reactions[activity.id];
    setReactions((current) => ({ ...current, [activity.id]: willReact }));
    pushNotice({
      title: willReact ? `You cheered ${activity.name}` : 'Reaction removed',
      message: willReact ? 'The reaction is visible only in this local demo.' : 'The demo reaction count was restored.',
      tone: 'social',
    });
  };

  const postUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = updateText.trim();
    if (!message) return;
    setPostedActivities((current) => [{
      id: `you-update-${activitySequence.current++}`,
      initials: 'ST',
      name: 'You',
      action: `shared: “${message}”`,
      time: 'now',
      color: '#513ea8',
      reactionCount: 0,
    }, ...current]);
    setUpdateText('');
    setComposerOpen(false);
    pushNotice({
      title: 'Study update added',
      message: 'It appears in this demo pulse; nothing was sent online.',
      tone: 'success',
    });
  };

  const startChallenge = () => {
    if (!challengeTopics.length) return;
    setChallengeStatus('playing');
    setChallengeIndex(0);
    setChallengeAnswers(Array(challengeTopics.length).fill(null));
    setChallengeScore(0);
    pushNotice({
      title: 'You joined the class challenge',
      message: `${challengeTopics.length} source-grounded question${challengeTopics.length === 1 ? '' : 's'} are ready.`,
      tone: 'social',
    });
  };

  const answerChallenge = (answerIndex: number) => {
    if (selectedChallengeAnswer !== null && selectedChallengeAnswer !== undefined) return;
    setChallengeAnswers((current) => {
      const next = [...current];
      next[challengeIndex] = answerIndex;
      return next;
    });
  };

  const advanceChallenge = () => {
    if (selectedChallengeAnswer === null || selectedChallengeAnswer === undefined) return;
    if (challengeIndex < challengeTopics.length - 1) {
      setChallengeIndex((current) => current + 1);
      return;
    }

    const score = challengeTopics.reduce((total, topic, index) => total + (challengeAnswers[index] === topic.correctAnswer ? 1 : 0), 0);
    setChallengeScore(score);
    setChallengeStatus('complete');
    setPostedActivities((current) => [{
      id: `you-challenge-${activitySequence.current++}`,
      initials: 'ST',
      name: 'You',
      action: `completed the class challenge · ${score}/${challengeTopics.length}`,
      time: 'now',
      color: '#513ea8',
      reactionCount: 0,
    }, ...current]);
    pushNotice({
      title: `Challenge complete · +80 XP`,
      message: `${score}/${challengeTopics.length} correct. You moved up in the weekly leaderboard.`,
      tone: 'success',
    });
  };

  const sendHello = () => {
    setHelloSent(true);
    pushNotice({
      title: 'Study hello added to the demo',
      message: 'No real message was sent to Maya.',
      tone: 'success',
    });
  };

  const resetDemo = () => {
    if (matchTimer.current) window.clearTimeout(matchTimer.current);
    setJoined(true);
    setCode(generatedClassCode);
    setMatching(false);
    setMatched(false);
    setHelloSent(false);
    setLeaderboardPeriod('week');
    setLeaderboardOptIn(true);
    setReactions({});
    setPostedActivities([]);
    setComposerOpen(false);
    setUpdateText('');
    setNotice(null);
    setChallengeStatus('idle');
    setChallengeIndex(0);
    setChallengeAnswers([]);
    setChallengeScore(0);
  };

  if (!joined) {
    return (
      <div className="classroom-view class-join-view page-enter">
        <div className="join-illustration"><span>MC</span><span>AS</span><span>NK</span><i><Link2 size={24} /></i></div>
        <p className="eyebrow">LOCAL CLASS DEMO</p>
        <h1>Join your class space.</h1>
        <p>Try the connection flow for {workspace.subject}. This invite stays on your device and does not join a real class.</p>
        <label><span>Demo invite code</span><input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} /></label>
        <button type="button" className="button-primary" disabled={code.trim().length < 4} onClick={() => {
          setJoined(true);
          pushNotice({ title: 'Welcome to the demo class', message: 'Explore reactions, ranking and a study match locally.', tone: 'success' });
        }}>Join demo class <ArrowRight size={16} /></button>
        <small>You control what progress is visible. No account or message is created.</small>
      </div>
    );
  }

  return (
    <>
      <div className="classroom-view page-enter">
      <header className="classroom-hero">
        <div>
          <p className="eyebrow"><Users size={14} /> DEMO CLASS · LOCAL ONLY</p>
          <h1>{workspace.subject} · Cohort A</h1>
          <p>28 demo learners · 6 active in this simulation · shared goal: {primaryTopic?.title ?? workspace.title}</p>
          <div className="class-member-stack">{classActivity.map((item) => <span key={item.id} style={{ ['--avatar-color' as string]: item.color }}>{item.initials}</span>)}<span>+25</span></div>
        </div>
        <div className="class-week-score">
          <span><Flame size={18} fill="currentColor" /> CLASS STREAK</span><strong>12 days</strong><em>{generatedClassCode} · simulated activity</em>
          <button type="button" className="class-demo-reset" onClick={resetDemo}><RotateCcw size={13} /> Reset demo</button>
        </div>
      </header>

      <div className="classroom-grid">
        <main>
          <section className="class-section-card class-pulse-card">
            <header className="section-heading-row"><div><p className="eyebrow">LIVE PULSE · SIMULATED</p><h2>Your class is moving.</h2></div><span className="active-now"><i /> 6 active</span></header>
            <ul className="activity-list">{allActivities.map((item) => {
              const reacted = Boolean(reactions[item.id]);
              return <li key={item.id}><span className="activity-avatar" style={{ ['--avatar-color' as string]: item.color }}>{item.initials}</span><div><p><strong>{item.name}</strong> {item.action}</p><span>{item.time}{item.time === 'now' ? '' : ' ago'}</span></div><button type="button" className={reacted ? 'is-reacted' : ''} aria-label={`${reacted ? 'Remove reaction from' : 'React to'} ${item.name}`} aria-pressed={reacted} onClick={() => toggleReaction(item)}><Sparkles size={16} fill={reacted ? 'currentColor' : 'none'} /><span>{item.reactionCount + (reacted ? 1 : 0)}</span></button></li>;
            })}</ul>
            {composerOpen ? (
              <form className="class-update-composer" onSubmit={postUpdate}>
                <label htmlFor="class-update">Share one useful study cue</label>
                <textarea id="class-update" value={updateText} onChange={(event) => setUpdateText(event.target.value)} maxLength={140} autoFocus placeholder={`What clicked about ${primaryTopic?.title ?? workspace.subject}?`} />
                <div><span>{updateText.length}/140 · local demo only</span><button type="button" onClick={() => { setComposerOpen(false); setUpdateText(''); }}>Cancel</button><button type="submit" disabled={!updateText.trim()}><Send size={14} /> Post update</button></div>
              </form>
            ) : <button type="button" className="class-share" onClick={() => setComposerOpen(true)}><MessageCircle size={16} /> Share a study update</button>}
          </section>

          <section className="class-section-card class-leaderboard-card">
            <header className="section-heading-row"><div><p className="eyebrow"><Trophy size={13} /> OPT-IN LEADERBOARD</p><h2>Friendly momentum, not pressure.</h2></div><span className={`leaderboard-privacy ${leaderboardOptIn ? 'is-visible' : ''}`}><CircleCheck size={13} /> {leaderboardOptIn ? 'You’re visible' : 'You’re private'}</span></header>
            <div className="leaderboard-period-tabs" role="tablist" aria-label="Leaderboard period">
              <button type="button" role="tab" aria-selected={leaderboardPeriod === 'week'} className={leaderboardPeriod === 'week' ? 'is-active' : ''} onClick={() => setLeaderboardPeriod('week')}>This week</button>
              <button type="button" role="tab" aria-selected={leaderboardPeriod === 'all-time'} className={leaderboardPeriod === 'all-time' ? 'is-active' : ''} onClick={() => setLeaderboardPeriod('all-time')}>All time</button>
            </div>
            <ol className="leaderboard-list">{leaderboard.map((entry, index) => {
              const isPrivate = entry.isYou && !leaderboardOptIn;
              const movement = entry.isYou && challengeStatus === 'complete' && leaderboardPeriod === 'week' ? 2 : entry.movement;
              return <li key={entry.id} className={`${entry.isYou ? 'is-you' : ''} ${index < 3 ? `is-podium rank-${index + 1}` : ''}`} aria-current={entry.isYou ? 'true' : undefined}>
                <span className="leaderboard-rank">{index + 1}</span><span className="leaderboard-avatar" style={{ ['--avatar-color' as string]: entry.color }}>{entry.initials}</span><div><strong>{entry.name}</strong>{entry.isYou && <em>You · {isPrivate ? 'hidden from class' : 'opted in'}</em>}</div><b>{isPrivate ? 'Private' : `${entry.xp.toLocaleString()} XP`}</b><span className={`rank-movement ${movement > 0 ? 'is-up' : movement < 0 ? 'is-down' : ''}`}>{movement > 0 ? <><TrendingUp size={13} /> {movement}</> : movement < 0 ? `↓ ${Math.abs(movement)}` : '—'}</span>
              </li>;
            })}</ol>
            <footer><p>Only shared XP appears here. Answers, mistakes and source files stay private.</p><button type="button" onClick={() => {
              const next = !leaderboardOptIn;
              setLeaderboardOptIn(next);
              pushNotice({ title: next ? 'Leaderboard sharing enabled' : 'Your rank is now private', message: 'This preference changes only the local demo.', tone: 'social' });
            }}>{leaderboardOptIn ? 'Leave leaderboard' : 'Join leaderboard'}</button></footer>
          </section>

          <section className={`class-section-card challenge-card challenge-${challengeStatus}`}>
            <div className="challenge-icon"><Zap size={23} /></div>
            <div><p className="eyebrow">CLASS CHALLENGE · {challengeStatus === 'complete' ? 'COMPLETE' : 'DEMO'}</p><h2>{workspace.subject} speed round</h2><p>{challengeTopics.length} source-grounded question{challengeTopics.length === 1 ? '' : 's'}. Explanations unlock after each answer.</p><div><span>{18 + (challengeStatus === 'idle' ? 0 : 1)} played</span><span>72% class average</span><span>Ends Friday</span></div></div>
            <button type="button" disabled={challengeStatus !== 'idle' || !challengeTopics.length} onClick={startChallenge}>{challengeStatus === 'idle' ? <>Join challenge <ArrowRight size={16} /></> : challengeStatus === 'playing' ? <>Question {challengeIndex + 1}/{challengeTopics.length}</> : <><Check size={14} /> 80 XP earned</>}</button>

            {challengeStatus === 'playing' && currentChallenge && (
              <div className="challenge-playground" aria-live="polite">
                <div className="challenge-progress"><span>Question {challengeIndex + 1} of {challengeTopics.length}</span><div><i style={{ width: `${((challengeIndex + 1) / challengeTopics.length) * 100}%` }} /></div></div>
                <p className="challenge-topic-label">{currentChallenge.title}</p>
                <h3>{currentChallenge.question}</h3>
                <div className="challenge-answer-grid">{currentChallenge.answers.map((answer, answerIndex) => {
                  const answered = selectedChallengeAnswer !== null && selectedChallengeAnswer !== undefined;
                  const isSelected = selectedChallengeAnswer === answerIndex;
                  const isCorrect = answered && answerIndex === currentChallenge.correctAnswer;
                  return <button key={answer} type="button" disabled={answered} className={`${isSelected ? 'is-selected' : ''} ${isCorrect ? 'is-correct' : ''} ${answered && isSelected && !isCorrect ? 'is-wrong' : ''}`} onClick={() => answerChallenge(answerIndex)}><span>{String.fromCharCode(65 + answerIndex)}</span>{answer}</button>;
                })}</div>
                {selectedChallengeAnswer !== null && selectedChallengeAnswer !== undefined && <div className={`challenge-feedback ${selectedChallengeAnswer === currentChallenge.correctAnswer ? 'is-correct' : 'is-wrong'}`}><strong>{selectedChallengeAnswer === currentChallenge.correctAnswer ? 'Exactly right.' : 'Good attempt—here’s the link.'}</strong><p>{currentChallenge.explanation}</p></div>}
                <button type="button" className="challenge-next" disabled={selectedChallengeAnswer === null || selectedChallengeAnswer === undefined} onClick={advanceChallenge}>{challengeIndex === challengeTopics.length - 1 ? 'Finish & add 80 XP' : 'Next question'} <ArrowRight size={15} /></button>
              </div>
            )}

            {challengeStatus === 'complete' && (
              <div className="challenge-result" aria-live="polite"><span><Trophy size={24} /></span><div><p className="eyebrow">ROUND COMPLETE · +80 XP</p><h3>{challengeScore}/{challengeTopics.length} correct</h3><p>Your demo activity and weekly rank have updated.</p></div>{primaryTopic && <button type="button" onClick={() => onOpen(primaryTopic, 'playable')}>Review the lesson <ArrowRight size={15} /></button>}</div>
            )}
          </section>
        </main>

        <aside>
          <section className={`study-match-card ${matched ? 'has-match' : ''}`} aria-live="polite">
            {!matched ? (
              <><div className="match-orbits" aria-hidden><span>ST</span><i /><i /></div><p className="eyebrow">STUDY MATCH · DEMO</p><h2>Find someone on your concept.</h2><p>We’ll simulate a match with a classmate studying <strong>{primaryTopic?.title ?? workspace.title}</strong> this week.</p><button type="button" disabled={matching} onClick={findMatch}>{matching ? <><span className="mini-loader" /> Finding your match…</> : <>Find my study match <ArrowRight size={16} /></>}</button><small>Local simulation · first name only · no account created</small></>
            ) : (
              <><p className="eyebrow">MATCH FOUND · 86% OVERLAP</p><div className="matched-profile"><span>MC</span><div><h2>Maya Chen</h2><p>Demo profile · 7 day streak</p></div></div><p className="match-reason">You’re both revising {primaryTopic?.title ?? workspace.title} and prefer short evening sessions.</p><div className="shared-topic"><Target size={16} /><div><span>Shared next concept</span><strong>{nextTopic?.title ?? workspace.title}</strong></div></div>{primaryTopic && <button type="button" onClick={() => onOpen(primaryTopic, 'playable')}><Zap size={16} /> Race the recall round</button>}<button type="button" className="match-message" disabled={helloSent} onClick={sendHello}>{helloSent ? <><Check size={16} /> Hello added</> : <><MessageCircle size={16} /> Send a study hello</>}</button><small>Matches stay in this demo; no message will be sent.</small></>
            )}
          </section>
          <section className="privacy-card"><CircleCheck size={20} /><div><strong>Built for healthy motivation.</strong><p>Leaderboard sharing is opt-in. Source files, answers, mistakes and unshared scores stay private.</p></div></section>
          <button type="button" className="leave-class" onClick={() => {
            if (matchTimer.current) window.clearTimeout(matchTimer.current);
            setMatching(false);
            setJoined(false);
            setCode(generatedClassCode);
          }}>Demo the join flow</button>
        </aside>
      </div>

      </div>
      {notice && <div key={notice.id} className={`class-floating-notice notice-${notice.tone}`} role="status" aria-live="polite"><span><BellRing size={18} /></span><div><em>SIMULATED ACTIVITY</em><strong>{notice.title}</strong><p>{notice.message}</p></div><button type="button" aria-label="Dismiss class notification" onClick={() => setNotice(null)}><X size={15} /></button></div>}
    </>
  );
}
