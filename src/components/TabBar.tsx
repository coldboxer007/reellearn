import { BookOpen, Clapperboard, Flame, Users } from 'lucide-react';
import './TabBar.css';

export type TabId = 'feed' | 'plan' | 'class' | 'you';

const tabs: { id: TabId; label: string; icon: typeof Flame }[] = [
  { id: 'feed', label: 'Feed', icon: Clapperboard },
  { id: 'plan', label: 'Plan', icon: BookOpen },
  { id: 'class', label: 'Class', icon: Users },
  { id: 'you', label: 'You', icon: Flame },
];

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
  hide?: boolean;
}

export function TabBar({ active, onChange, hide }: Props) {
  if (hide) return null;
  const activeIndex = tabs.findIndex((t) => t.id === active);

  return (
    <nav className="tab-bar" aria-label="Main">
      <div className="tab-dock">
        <div
          className="tab-indicator"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
          aria-hidden
        />
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`tab-btn ${active === id ? 'active' : ''}`}
            onClick={() => onChange(id)}
            aria-current={active === id ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={active === id ? 2.4 : 1.7} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
