import type { ClassPulse } from '../../types';
import './ClassScreen.css';

interface Props {
  pulse: ClassPulse;
}

export function ClassScreen({ pulse }: Props) {
  return (
    <div className="tab-screen class-screen">
      <header className="class-header">
        <p className="class-eyebrow">Class</p>
        <h1 className="class-title">{pulse.name}</h1>
        <p className="class-meta">
          {pulse.memberCount} members · invite <code>{pulse.invite_code}</code>
        </p>
      </header>

      {pulse.match && (
        <section className="match-card">
          <p className="match-eyebrow">Study Match · this week</p>
          <h2 className="match-partner">{pulse.match.partner}</h2>
          <p className="match-node">Both on {pulse.match.node_title}</p>
          <p className="match-ice">{pulse.match.icebreaker}</p>
          <button type="button" className="match-cta">
            Race the quiz
          </button>
        </section>
      )}

      <section className="class-section">
        <h2 className="class-section-title">Pulse</h2>
        <ul className="signal-list">
          {pulse.signals.map((s) => (
            <li key={s.id} className="signal-row">
              <div className="signal-avatar">{s.handle.slice(0, 2).toUpperCase()}</div>
              <div>
                <p className="signal-text">
                  <strong>{s.user}</strong> {s.text}
                </p>
                <p className="signal-day">{s.day}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="class-section">
        <h2 className="class-section-title">Leaderboard · opt-in</h2>
        <ol className="lb-list">
          {pulse.leaderboard.map((row, i) => (
            <li key={row.handle} className={`lb-row ${row.handle === 'you' ? 'you' : ''}`}>
              <span className="lb-rank">{i + 1}</span>
              <span className="lb-handle">@{row.handle}</span>
              <span className="lb-stat">{row.streak}d</span>
              <span className="lb-stat">{row.accuracy}%</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
