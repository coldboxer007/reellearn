import type { ShareContent } from '../../types';
import './AmbientCards.css';

export function ShareCard({ share }: { share: ShareContent }) {
  return (
    <article className="ambient-card share-card">
      <p className="ambient-eyebrow">Shared with class</p>
      <h2 className="ambient-title">{share.topic}</h2>
      <blockquote className="share-note">“{share.note}”</blockquote>
      <p className="ambient-meta">from {share.from}</p>
    </article>
  );
}

export function SignalCard({ signal }: { signal: { text: string } }) {
  return (
    <article className="ambient-card signal-card">
      <p className="ambient-eyebrow">Class pulse</p>
      <h2 className="ambient-title ambient-title-soft">{signal.text}</h2>
      <p className="ambient-meta">Ambient · no exact timestamps</p>
    </article>
  );
}
