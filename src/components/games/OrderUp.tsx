import { useState } from 'react';
import type { GameContent, OrderUpPayload } from '../../types';

interface Props {
  game: GameContent;
  onDone: () => void;
}

export function OrderUp({ game, onDone }: Props) {
  const payload = game.payload as OrderUpPayload;
  const [order, setOrder] = useState(() =>
    [...payload.steps.keys()].sort(() => Math.random() - 0.5),
  );
  const [checked, setChecked] = useState(false);
  const correct =
    checked && order.every((idx, i) => idx === payload.correctOrder[i]);

  const move = (from: number, dir: -1 | 1) => {
    const to = from + dir;
    if (to < 0 || to >= order.length) return;
    setOrder((o) => {
      const next = [...o];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
    setChecked(false);
  };

  return (
    <div className="order-up">
      <h4 className="quiz-prompt">{payload.prompt}</h4>
      <ul className="order-list">
        {order.map((stepIdx, i) => (
          <li key={stepIdx} className="order-item">
            <span className="order-num">{i + 1}</span>
            <span className="order-text">{payload.steps[stepIdx]}</span>
            <div className="order-move">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === order.length - 1}
                aria-label="Move down"
              >
                ↓
              </button>
            </div>
          </li>
        ))}
      </ul>
      {!checked ? (
        <button type="button" className="game-primary" onClick={() => setChecked(true)}>
          Check order
        </button>
      ) : (
        <div className="quiz-explain">
          <p>{correct ? 'Perfect sequence.' : 'Not quite — reshuffle and try again.'}</p>
          {correct ? (
            <button type="button" className="game-primary" onClick={onDone}>
              Back to feed
            </button>
          ) : (
            <button type="button" className="game-primary" onClick={() => setChecked(false)}>
              Keep editing
            </button>
          )}
        </div>
      )}
    </div>
  );
}
