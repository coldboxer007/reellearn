import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bell,
  BookOpen,
  CalendarDays,
  Flame,
  Home,
  Menu,
  Plus,
  Search,
  Sparkles,
  Users,
  WandSparkles,
  X,
} from 'lucide-react';
import { CreateStudio } from './components/revamp/CreateStudio';
import { ContentTheater } from './components/revamp/LearningExperiences';
import { ClassroomView, LibraryView, PlanView, TodayView } from './components/revamp/ProductViews';
import { starterWorkspace, type CourseWorkspace, type OutputFormat, type TopicLesson, type ViewId } from './product';

const STORAGE_KEY = 'reellearn.workspace.v2';

const navigation = [
  { id: 'today' as const, label: 'Today', Icon: Home },
  { id: 'create' as const, label: 'Create', Icon: WandSparkles },
  { id: 'library' as const, label: 'Library', Icon: BookOpen },
  { id: 'plan' as const, label: 'Plan', Icon: CalendarDays },
  { id: 'classroom' as const, label: 'Class', Icon: Users },
];

function loadWorkspace() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return starterWorkspace;
    const parsed = JSON.parse(saved) as CourseWorkspace;
    return parsed.topics?.length ? parsed : starterWorkspace;
  } catch {
    return starterWorkspace;
  }
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand-mark ${compact ? 'is-compact' : ''}`} aria-label="ReelLearn">
      <span className="brand-symbol"><i /><i /><strong>R</strong></span>
      {!compact && <span className="brand-word">Reel<span>Learn</span></span>}
    </span>
  );
}

export default function App() {
  const [view, setView] = useState<ViewId>('today');
  const [workspace, setWorkspace] = useState<CourseWorkspace>(loadWorkspace);
  const [theater, setTheater] = useState<{ topic: TopicLesson; format: OutputFormat } | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState('');
  const contentTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    } catch {
      setToast('The lesson is ready, but this browser could not persist it locally.');
    }
  }, [workspace]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const navigate = useCallback((nextView: ViewId) => {
    setView(nextView);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openContent = useCallback((topic: TopicLesson, format: OutputFormat = 'reel') => {
    if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
      contentTriggerRef.current = document.activeElement;
    }
    setTheater({ topic, format });
  }, []);

  const closeContent = useCallback(() => {
    setTheater(null);
    window.requestAnimationFrame(() => contentTriggerRef.current?.focus());
  }, []);

  const finishGeneration = useCallback((nextWorkspace: CourseWorkspace) => {
    setWorkspace(nextWorkspace);
    setView('today');
    setToast(nextWorkspace.generation?.provider === 'openai'
      ? 'OpenAI built the plan, source-grounded lessons and available media assets.'
      : 'Your locally generated plan, reels, posts and recall set are ready.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const renderView = () => {
    const shared = { workspace, onNavigate: navigate, onOpen: openContent, contentOpen: Boolean(theater) };
    if (view === 'create') return <CreateStudio onComplete={finishGeneration} />;
    if (view === 'library') return <LibraryView {...shared} />;
    if (view === 'plan') return <PlanView {...shared} />;
    if (view === 'classroom') return <ClassroomView {...shared} />;
    return <TodayView {...shared} />;
  };

  return (
    <div
      className="app-frame"
      onPointerDownCapture={(event) => {
        if (theater || !(event.target instanceof Element)) return;
        const trigger = event.target.closest('button, a[href], [tabindex]');
        if (trigger instanceof HTMLElement) contentTriggerRef.current = trigger;
      }}
    >
      <aside className={`sidebar ${mobileMenu ? 'is-open' : ''}`}>
        <div className="sidebar-brand-row">
          <BrandMark />
          <button type="button" className="sidebar-close" onClick={() => setMobileMenu(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>

        <button type="button" className="sidebar-create" onClick={() => navigate('create')}>
          <span><Plus size={19} /></span> New learning drop
        </button>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <p>Workspace</p>
          {navigation.map(({ id, label, Icon }) => (
            <button key={id} type="button" className={view === id ? 'is-active' : ''} onClick={() => navigate(id)}>
              <Icon size={19} strokeWidth={1.9} /><span>{label}</span>{id === 'classroom' && <i>6</i>}
            </button>
          ))}
        </nav>

        <div className="sidebar-course">
          <div className="course-orbit" aria-hidden><span /><i /></div>
          <p>ACTIVE LEARNING ARC</p>
          <h3>{workspace.title}</h3>
          <span>{workspace.topics.length} connected reels · {workspace.hoursPerWeek}h/week</span>
          <div><span style={{ width: '22%' }} /></div>
          <button type="button" onClick={() => navigate('plan')}>Open plan</button>
        </div>

        <div className="sidebar-user">
          <span className="user-avatar">DL<i /></span>
          <div><strong>Demo Learner</strong><span><Flame size={12} fill="currentColor" /> 9 day streak</span></div>
          <button type="button" aria-label="Account menu">•••</button>
        </div>
      </aside>

      {mobileMenu && <button type="button" className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileMenu(false)} />}

      <div className="app-main">
        <header className="topbar">
          <div className="mobile-brand">
            <button type="button" onClick={() => setMobileMenu(true)} aria-label="Open navigation"><Menu size={21} /></button>
            <BrandMark />
          </div>
          <label className="global-search"><Search size={17} /><input placeholder="Search your learning world" aria-label="Search your learning world" /><kbd>⌘ K</kbd></label>
          <div className="topbar-actions">
            <div className="streak-pill"><Flame size={15} fill="currentColor" /><strong>9</strong><span>day streak</span></div>
            <button type="button" className="icon-button notification-button" aria-label="Notifications"><Bell size={19} /><span /></button>
            <button type="button" className="topbar-avatar" aria-label="Open profile">DL</button>
          </div>
        </header>

        <main className="app-content">{renderView()}</main>
      </div>

      <nav className="mobile-tabbar" aria-label="Mobile navigation">
        {navigation.map(({ id, label, Icon }) => (
          <button key={id} type="button" className={`${view === id ? 'is-active' : ''} ${id === 'create' ? 'is-create' : ''}`} onClick={() => navigate(id)}>
            {id === 'create' ? <span><Plus size={22} /></span> : <Icon size={20} />}<em>{label}</em>
          </button>
        ))}
      </nav>

      {theater && (
        <ContentTheater
          workspace={workspace}
          topic={theater.topic}
          initialFormat={theater.format}
          onClose={closeContent}
        />
      )}

      {toast && (
        <div className="app-toast" role="status">
          <span><Sparkles size={17} /></span><p><strong>Learning drop built</strong>{toast}</p><button type="button" onClick={() => setToast('')} aria-label="Dismiss"><X size={16} /></button>
        </div>
      )}
    </div>
  );
}
