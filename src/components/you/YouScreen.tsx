import type { UserProfile } from '../../types';
import { THEME_META } from '../../data/mock';
import './YouScreen.css';

interface Props {
  user: UserProfile;
}

export function YouScreen({ user }: Props) {
  return (
    <div className="tab-screen you-screen">
      <header className="you-header">
        <div className="you-avatar">{user.display_name.slice(0, 1)}</div>
        <div>
          <h1 className="you-name">{user.display_name}</h1>
          <p className="you-handle">@{user.handle}</p>
        </div>
      </header>

      <div className="you-stats">
        <div className="stat">
          <p className="stat-n">{user.streak}</p>
          <p className="stat-l">Day streak</p>
        </div>
        <div className="stat">
          <p className="stat-n">{user.longestStreak}</p>
          <p className="stat-l">Best</p>
        </div>
        <div className="stat">
          <p className="stat-n">
            {user.masteredCount}/{user.totalNodes}
          </p>
          <p className="stat-l">Mastered</p>
        </div>
      </div>

      <section className="you-section">
        <h2 className="you-section-title">Mastery map</h2>
        <ul className="mastery-list">
          {user.masteryMap.map((m) => {
            const pct = m.total ? (m.mastered / m.total) * 100 : 0;
            return (
              <li key={m.unit} className="mastery-row">
                <div className="mastery-top">
                  <span>{m.unit}</span>
                  <span>
                    {m.mastered}/{m.total}
                  </span>
                </div>
                <div className="mastery-bar">
                  <div style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="you-section">
        <h2 className="you-section-title">Library</h2>
        <ul className="library-list">
          {user.library.map((item) => (
            <li key={item.id} className="library-item">
              <span
                className="library-swatch"
                style={{ background: THEME_META[item.theme].accent }}
              />
              <div>
                <p className="library-title">{item.title}</p>
                <p className="library-kind">
                  {item.kind} · {THEME_META[item.theme].name}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
