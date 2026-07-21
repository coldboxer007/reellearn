import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  deriveMotionPlan,
  getTemplate,
  type CourseWorkspace,
  type MotionSpec,
  type TopicLesson,
} from '../../product';

interface ReelFeedProps {
  workspace: CourseWorkspace;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onOpenPost?: () => void;
  onOpenPlayable?: () => void;
  renderReel: (topic: TopicLesson, autoPlay: boolean) => ReactNode;
}

const clampIndex = (index: number, length: number) => Math.min(Math.max(index, 0), Math.max(0, length - 1));
const END_SCROLL_INDEX = -1;

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ));

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(query.matches);
    updatePreference();
    query.addEventListener('change', updatePreference);
    return () => query.removeEventListener('change', updatePreference);
  }, []);

  return prefersReducedMotion;
}

function feedThemeStyle(workspace: CourseWorkspace, topic: TopicLesson): CSSProperties {
  const template = getTemplate(topic.styleId ?? workspace.templateId);
  return {
    ['--reel-feed-accent' as string]: template.accent,
    ['--reel-feed-accent-2' as string]: template.accent2,
    ['--reel-feed-surface' as string]: template.surface,
    ['--reel-feed-ink' as string]: template.ink,
  };
}

function grammarLabel(grammar: MotionSpec['grammar']) {
  if (grammar === 'math-equation') return 'Equation story';
  if (grammar === 'physics-diagram') return 'Moving diagram';
  return grammar.replaceAll('-', ' ');
}

function MathCover({ plan }: { plan: MotionSpec }) {
  const steps = plan.mathEquation?.steps.slice(0, 3) ?? [];
  if (!steps.length) return <StructureCover plan={plan} />;

  return (
    <ol className="reel-feed-equations" aria-label="Equation steps">
      {steps.map((step, index) => (
        <li className="reel-feed-equation-step" key={`${step.expression}-${index}`}>
          <span className="reel-feed-equation-index">{String(index + 1).padStart(2, '0')}</span>
          <strong className="reel-feed-equation-expression">{step.expression}</strong>
          <small className="reel-feed-equation-explanation">{step.explanation}</small>
        </li>
      ))}
    </ol>
  );
}

function PhysicsCover({ plan }: { plan: MotionSpec }) {
  const diagram = plan.physicsDiagram;
  if (!diagram) return <StructureCover plan={plan} />;

  return (
    <div className={`reel-feed-physics reel-feed-physics--${diagram.kind}`}>
      <div className="reel-feed-physics-grid" aria-hidden="true">
        <span className="reel-feed-physics-axis reel-feed-physics-axis--x" />
        <span className="reel-feed-physics-axis reel-feed-physics-axis--y" />
        <span className={`reel-feed-physics-track reel-feed-physics-track--${diagram.paths[0]?.kind ?? 'static'}`} />
        <span className="reel-feed-physics-body" />
        {diagram.vectors.slice(0, 3).map((vector, index) => {
          const angle = -Math.atan2(vector.dy, vector.dx) * (180 / Math.PI);
          const length = Math.min(1, Math.max(0.25, Math.hypot(vector.dx, vector.dy)));
          return (
            <span
              className={`reel-feed-physics-vector reel-feed-physics-vector--${vector.quantity}`}
              key={`${vector.originId}-${vector.label}-${index}`}
              style={{
                ['--reel-feed-vector-angle' as string]: `${angle}deg`,
                ['--reel-feed-vector-length' as string]: `${Math.round(length * 42)}%`,
              }}
            />
          );
        })}
      </div>
      <div className="reel-feed-physics-labels">
        {diagram.vectors.slice(0, 3).map((vector, index) => (
          <span key={`${vector.label}-${index}`}>
            <i aria-hidden="true" />
            {vector.label}{vector.magnitudeLabel ? ` · ${vector.magnitudeLabel}` : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

function StructureCover({ plan }: { plan: MotionSpec }) {
  const nodes = plan.nodes.filter((node) => node.kind !== 'location').slice(0, 4);
  return (
    <ol className={`reel-feed-structure reel-feed-structure--${plan.grammar}`} aria-label={`${grammarLabel(plan.grammar)} concept structure`}>
      {nodes.map((node, index) => (
        <li className={`reel-feed-node reel-feed-node--${node.kind}`} key={node.id}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <strong>{node.label}</strong>
          {index < nodes.length - 1 && <i className="reel-feed-link" aria-hidden="true">→</i>}
        </li>
      ))}
    </ol>
  );
}

function TopicCover({ workspace, topic, index }: { workspace: CourseWorkspace; topic: TopicLesson; index: number }) {
  const plan = useMemo(
    () => topic.motionPlan ?? deriveMotionPlan(topic, workspace.subject),
    [topic, workspace.subject],
  );

  return (
    <section
      className={`reel-feed-cover reel-feed-cover--${plan.grammar}`}
      style={feedThemeStyle(workspace, topic)}
      aria-label={`${grammarLabel(plan.grammar)} preview for ${topic.title}`}
    >
      <header className="reel-feed-cover-head">
        <span className="reel-feed-cover-index">{String(index + 1).padStart(2, '0')}</span>
        <span className="reel-feed-cover-grammar">{grammarLabel(plan.grammar)}</span>
      </header>
      <div className="reel-feed-cover-copy">
        <p>{topic.unit}</p>
        <h3>{topic.title}</h3>
      </div>
      <div className="reel-feed-cover-visual">
        {plan.grammar === 'math-equation'
          ? <MathCover plan={plan} />
          : plan.grammar === 'physics-diagram'
            ? <PhysicsCover plan={plan} />
            : <StructureCover plan={plan} />}
      </div>
      <footer className="reel-feed-cover-takeaway">
        <span>Key idea</span>
        <strong>{plan.takeHome}</strong>
      </footer>
    </section>
  );
}

export function ReelFeed({
  workspace,
  activeIndex,
  onActiveIndexChange,
  onOpenPost,
  onOpenPlayable,
  renderReel,
}: ReelFeedProps) {
  const topicCount = workspace.topics.length;
  const normalizedIndex = clampIndex(activeIndex, topicCount);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isAtEnd, setIsAtEnd] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Array<HTMLElement | null>>([]);
  const endPageRef = useRef<HTMLElement | null>(null);
  const pendingIndexRef = useRef<number | null>(null);
  const observerIndexRef = useRef<number | null>(null);
  const wheelGestureActiveRef = useRef(false);
  const wheelGestureResetRef = useRef<number | null>(null);
  const activeIndexRef = useRef(normalizedIndex);
  activeIndexRef.current = normalizedIndex;

  useEffect(() => () => {
    if (wheelGestureResetRef.current !== null) window.clearTimeout(wheelGestureResetRef.current);
  }, []);

  const scrollBehavior: ScrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

  const scrollToTopic = (index: number, notify = true) => {
    if (!topicCount) return;
    const nextIndex = clampIndex(index, topicCount);
    const scroller = scrollerRef.current;
    const page = pageRefs.current[nextIndex];
    if (!scroller || !page) return;
    setIsAtEnd(false);
    pendingIndexRef.current = Math.abs(scroller.scrollTop - page.offsetTop) < 2 ? null : nextIndex;
    scroller.scrollTo({ top: page.offsetTop, behavior: scrollBehavior });
    if (notify && nextIndex !== activeIndexRef.current) {
      activeIndexRef.current = nextIndex;
      onActiveIndexChange(nextIndex);
    }
  };

  const scrollToEnd = () => {
    const scroller = scrollerRef.current;
    const endPage = endPageRef.current;
    if (!scroller || !endPage) return;
    const finalTopicIndex = topicCount - 1;
    if (finalTopicIndex >= 0 && activeIndexRef.current !== finalTopicIndex) {
      activeIndexRef.current = finalTopicIndex;
      observerIndexRef.current = finalTopicIndex;
      onActiveIndexChange(finalTopicIndex);
    }
    pendingIndexRef.current = END_SCROLL_INDEX;
    scroller.scrollTo({ top: endPage.offsetTop, behavior: scrollBehavior });
  };

  const goPrevious = () => scrollToTopic(normalizedIndex - 1);
  const goNext = () => {
    if (normalizedIndex >= topicCount - 1) scrollToEnd();
    else scrollToTopic(normalizedIndex + 1);
  };

  useEffect(() => {
    if (!topicCount) return;
    if (observerIndexRef.current === normalizedIndex) {
      observerIndexRef.current = null;
      return;
    }
    const scroller = scrollerRef.current;
    const page = pageRefs.current[normalizedIndex];
    if (!scroller || !page) return;
    pendingIndexRef.current = Math.abs(scroller.scrollTop - page.offsetTop) < 2 ? null : normalizedIndex;
    const frame = window.requestAnimationFrame(() => {
      scroller.scrollTo({
        top: page.offsetTop,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [normalizedIndex, topicCount, prefersReducedMotion]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const pages = pageRefs.current.slice(0, topicCount).filter((page): page is HTMLElement => page !== null);
    const endPage = endPageRef.current;
    if (!scroller || !pages.length) return;

    const activateCandidate = (candidate: number) => {
      const pendingIndex = pendingIndexRef.current;
      if (pendingIndex !== null) {
        if (pendingIndex === END_SCROLL_INDEX) return;
        if (candidate === pendingIndex) pendingIndexRef.current = null;
        else return;
      }
      setIsAtEnd(false);
      if (candidate === activeIndexRef.current) return;
      activeIndexRef.current = candidate;
      observerIndexRef.current = candidate;
      onActiveIndexChange(candidate);
    };

    if (typeof IntersectionObserver === 'undefined') {
      const onScroll = () => {
        if (!scroller.clientHeight) return;
        const pageIndex = Math.round(scroller.scrollTop / scroller.clientHeight);
        if (pageIndex >= topicCount) {
          pendingIndexRef.current = null;
          setIsAtEnd(true);
        } else {
          setIsAtEnd(false);
          activateCandidate(clampIndex(pageIndex, topicCount));
        }
      };
      scroller.addEventListener('scroll', onScroll, { passive: true });
      return () => scroller.removeEventListener('scroll', onScroll);
    }

    const observer = new IntersectionObserver((entries) => {
      const candidate = entries
        .filter((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.66)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!candidate) return;
      const candidateElement = candidate.target as HTMLElement;
      if (candidateElement.dataset.reelEnd === 'true') {
        pendingIndexRef.current = null;
        setIsAtEnd(true);
        return;
      }
      const index = Number(candidateElement.dataset.reelIndex);
      if (Number.isInteger(index)) activateCandidate(clampIndex(index, topicCount));
    }, { root: scroller, threshold: [0.66, 0.8, 1] });

    pages.forEach((page) => observer.observe(page));
    if (endPage) observer.observe(endPage);
    return () => observer.disconnect();
  }, [onActiveIndexChange, topicCount]);

  const onFeedKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      const target = event.target as HTMLElement;
      if (target.closest('button, a, input, textarea, select, [role="slider"]')) return;
    }

    if (event.key === 'ArrowDown' || event.key === 'PageDown') {
      event.preventDefault();
      if (!isAtEnd) goNext();
    } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault();
      if (isAtEnd) scrollToTopic(topicCount - 1);
      else goPrevious();
    } else if (event.key === 'Home') {
      event.preventDefault();
      scrollToTopic(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      scrollToEnd();
    }
  };

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !topicCount) return;

    const navigateToTopic = (requestedIndex: number) => {
      const nextIndex = clampIndex(requestedIndex, topicCount);
      const page = pageRefs.current[nextIndex];
      if (!page) return;
      setIsAtEnd(false);
      pendingIndexRef.current = nextIndex;
      activeIndexRef.current = nextIndex;
      onActiveIndexChange(nextIndex);
      scroller.scrollTo({ top: page.offsetTop, behavior: scrollBehavior });
    };

    const onWheel = (event: globalThis.WheelEvent) => {
      if (Math.abs(event.deltaY) < Math.abs(event.deltaX) || Math.abs(event.deltaY) < 1) return;
      event.preventDefault();
      if (wheelGestureResetRef.current !== null) window.clearTimeout(wheelGestureResetRef.current);
      wheelGestureResetRef.current = window.setTimeout(() => {
        wheelGestureActiveRef.current = false;
        wheelGestureResetRef.current = null;
      }, 180);
      if (wheelGestureActiveRef.current) return;
      wheelGestureActiveRef.current = true;
      if (event.deltaY > 0) {
        if (isAtEnd) return;
        if (activeIndexRef.current >= topicCount - 1) {
          const endPage = endPageRef.current;
          if (endPage) {
            pendingIndexRef.current = END_SCROLL_INDEX;
            scroller.scrollTo({ top: endPage.offsetTop, behavior: scrollBehavior });
          }
          return;
        }
        navigateToTopic(activeIndexRef.current + 1);
        return;
      }
      navigateToTopic(isAtEnd ? topicCount - 1 : activeIndexRef.current - 1);
    };

    scroller.addEventListener('wheel', onWheel, { passive: false });
    return () => scroller.removeEventListener('wheel', onWheel);
  }, [isAtEnd, onActiveIndexChange, scrollBehavior, topicCount]);

  if (!topicCount) {
    return (
      <section className="reel-feed-empty" role="status">
        <p>No reel topics have been created for this learning drop yet.</p>
      </section>
    );
  }

  return (
    <section className="reel-feed" aria-label={`Reel learning path for ${workspace.title}`}>
      <header className="reel-feed-progress" aria-live="polite" aria-atomic="true">
        <span className="reel-feed-kicker">
          {workspace.subject} · source-backed
          <small title={workspace.sourceName}>{workspace.sourceName}</small>
        </span>
        <strong className="reel-feed-counter">
          {String(normalizedIndex + 1).padStart(2, '0')} / {String(topicCount).padStart(2, '0')}
        </strong>
      </header>

      <div
        className="reel-feed-scroller"
        ref={scrollerRef}
        tabIndex={0}
        onKeyDown={onFeedKeyDown}
        onPointerDown={() => { pendingIndexRef.current = null; }}
        aria-label="Scrollable concept reels. Use the arrow or page keys to move between topics."
      >
        {workspace.topics.map((topic, index) => {
          const isActive = index === normalizedIndex;
          const motionPlan = topic.motionPlan ?? deriveMotionPlan(topic, workspace.subject);
          return (
            <article
              className={`reel-feed-page ${isActive ? 'is-active' : ''}`}
              data-reel-index={index}
              key={topic.id}
              ref={(element) => { pageRefs.current[index] = element; }}
              aria-label={`Reel ${index + 1} of ${topicCount}: ${topic.title}`}
              aria-current={isActive ? 'step' : undefined}
              aria-posinset={index + 1}
              aria-setsize={topicCount}
            >
              <div className="reel-feed-page-inner" style={feedThemeStyle(workspace, topic)}>
                <div className="reel-feed-player-shell">
                  {isActive && !isAtEnd
                    ? renderReel(topic, !prefersReducedMotion)
                    : <TopicCover workspace={workspace} topic={topic} index={index} />}
                </div>

                <div className="reel-feed-copy">
                  <p className="reel-feed-copy-meta">
                    <span>{topic.unit}</span>
                    <span>{topic.minutes} min</span>
                    <span>{grammarLabel(motionPlan.grammar)}</span>
                  </p>
                  <h3>{topic.title}</h3>
                  <p>{topic.summary}</p>
                  {index > 0 && (
                    <div className="reel-feed-connection">
                      <span>Reel {String(index).padStart(2, '0')} → {String(index + 1).padStart(2, '0')}</span>
                      <strong>{topic.arc?.bridgeFromPrevious ?? `This reel extends ${workspace.topics[index - 1]?.title ?? 'the previous concept'}.`}</strong>
                    </div>
                  )}
                  <div className="reel-feed-copy-fact">
                    <span>Remember this</span>
                    <strong>{motionPlan.takeHome}</strong>
                  </div>

                  {(onOpenPost || onOpenPlayable) && (
                    <div className="reel-feed-actions" aria-label={`Other ways to learn ${topic.title}`}>
                      {onOpenPost && <button type="button" onClick={onOpenPost}>Open infographic</button>}
                      {onOpenPlayable && <button type="button" onClick={onOpenPlayable}>Try recall</button>}
                    </div>
                  )}
                </div>

                {isActive && (
                  <nav className="reel-feed-step-controls" aria-label="Reel navigation">
                    <button type="button" onClick={goPrevious} disabled={index === 0} aria-label="Previous concept">
                      <span aria-hidden="true">↑</span> Previous
                    </button>
                    <button type="button" onClick={goNext} aria-label={index === topicCount - 1 ? 'Finish reel path' : 'Next concept'}>
                      {index === topicCount - 1 ? 'Finish' : 'Next'} <span aria-hidden="true">↓</span>
                    </button>
                  </nav>
                )}
              </div>
            </article>
          );
        })}

        <section
          className="reel-feed-page reel-feed-end-page"
          data-reel-end="true"
          ref={endPageRef}
          aria-label="End of reel learning path"
        >
          <div className="reel-feed-end-card">
            <span className="reel-feed-end-mark" aria-hidden="true">✓</span>
            <p>Learning path complete</p>
            <h3>You watched {topicCount} connected reels.</h3>
            <p>Retrieval is the next move: answer without replaying first, then check the explanation.</p>
            <div className="reel-feed-end-actions">
              {onOpenPlayable && <button type="button" onClick={onOpenPlayable}>Start retrieval check</button>}
              {onOpenPost && <button type="button" onClick={onOpenPost}>Review the infographic</button>}
              <button type="button" onClick={() => scrollToTopic(0)}>Replay from concept one</button>
            </div>
          </div>
        </section>
      </div>

      <nav className="reel-feed-topic-nav" aria-label="Jump to a concept reel">
        {workspace.topics.map((topic, index) => (
          <button
            type="button"
            className={`reel-feed-topic-button ${index === normalizedIndex ? 'is-active' : ''}`}
            key={topic.id}
            onClick={() => scrollToTopic(index)}
            aria-label={`Go to concept ${index + 1}: ${topic.title}`}
            aria-current={index === normalizedIndex ? 'step' : undefined}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{topic.title}</strong>
          </button>
        ))}
      </nav>
    </section>
  );
}
