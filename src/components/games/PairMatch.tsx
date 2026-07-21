import { useMemo, useState } from 'react';
import type { GameContent, PairMatchPayload } from '../../types';

interface Props {
  game: GameContent;
  onDone: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function PairMatch({ game, onDone }: Props) {
  const payload = game.payload as PairMatchPayload;
  const lefts = payload.pairs.map((p) => p.left);
  const rights = useMemo(() => shuffle(payload.pairs.map((p) => p.right)), [payload.pairs]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, string>>({});
  const [miss, setMiss] = useState<string | null>(null);

  const map = useMemo(() => Object.fromEntries(payload.pairs.map((p) => [p.left, p.right])), [payload.pairs]);
  const done = Object.keys(matched).length === payload.pairs.length;

  const pickRight = (right: string) => {
    if (!selectedLeft || matched[selectedLeft]) return;
    if (map[selectedLeft] === right) {
      setMatched((m) => ({ ...m, [selectedLeft]: right }));
      setSelectedLeft(null);
      setMiss(null);
    } else {
      setMiss(right);
      setTimeout(() => setMiss(null), 450);
    }
  };

  if (done) {
    return (
      <div className="game-result">
        <p className="result-label">All pairs matched</p>
        <p className="result-score">100%</p>
        <p className="result-meta">Mappings locked in</p>
        <button type="button" className="game-primary" onClick={onDone}>
          Back to feed
        </button>
      </div>
    );
  }

  return (
    <div className="pair-match">
      <p className="pair-hint">Tap a term, then its match</p>
      <div className="pair-cols">
        <div className="pair-col">
          {lefts.map((l) => (
            <button
              key={l}
              type="button"
              className={`pair-chip ${selectedLeft === l ? 'selected' : ''} ${matched[l] ? 'matched' : ''}`}
              disabled={!!matched[l]}
              onClick={() => setSelectedLeft(l)}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="pair-col">
          {rights.map((r) => {
            const used = Object.values(matched).includes(r);
            return (
              <button
                key={r}
                type="button"
                className={`pair-chip ${miss === r ? 'miss' : ''} ${used ? 'matched' : ''}`}
                disabled={used || !selectedLeft}
                onClick={() => pickRight(r)}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
