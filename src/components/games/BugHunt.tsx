import { useState } from 'react';
import type { BugHuntPayload, GameContent } from '../../types';

interface Props {
  game: GameContent;
  onDone: () => void;
}

export function BugHunt({ game, onDone }: Props) {
  const payload = game.payload as BugHuntPayload;
  const [picked, setPicked] = useState<number | null>(null);
  const correct = picked === payload.bugLineIndex;

  return (
    <div className="bug-hunt">
      <h4 className="quiz-prompt">{payload.prompt}</h4>
      <ol className="bug-lines">
        {payload.lines.map((line, i) => {
          let cls = 'bug-line';
          if (picked !== null) {
            if (i === payload.bugLineIndex) cls += ' bug';
            else if (i === picked) cls += ' miss';
          }
          return (
            <li key={line}>
              <button
                type="button"
                className={cls}
                disabled={picked !== null}
                onClick={() => setPicked(i)}
              >
                <span className="bug-n">{i + 1}</span>
                <code>{line}</code>
              </button>
            </li>
          );
        })}
      </ol>
      {picked !== null && (
        <div className="quiz-explain">
          <p>
            {correct ? 'Caught it.' : 'That line was fine.'} {payload.explanation}
          </p>
          <button type="button" className="game-primary" onClick={onDone}>
            Back to feed
          </button>
        </div>
      )}
    </div>
  );
}
