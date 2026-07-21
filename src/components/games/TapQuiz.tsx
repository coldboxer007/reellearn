import { useMemo, useState } from 'react';
import type { GameContent, TapQuizPayload } from '../../types';

interface Props {
  game: GameContent;
  onDone: () => void;
}

export function TapQuiz({ game, onDone }: Props) {
  const payload = game.payload as TapQuizPayload;
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = payload.questions[qi];
  const correct = picked !== null && picked === q.correct_index;

  const next = () => {
    if (picked === null) return;
    const gained = correct ? 100 * (1 + streak * 0.25) : 0;
    const newScore = score + gained;
    const newStreak = correct ? streak + 1 : 0;
    setScore(newScore);
    setStreak(newStreak);
    if (qi >= payload.questions.length - 1) {
      setFinished(true);
      return;
    }
    setQi((i) => i + 1);
    setPicked(null);
  };

  const accuracy = useMemo(() => {
    if (!finished) return 0;
    // approximate from score bands
    return Math.min(100, Math.round((score / (payload.questions.length * 100)) * 100));
  }, [finished, score, payload.questions.length]);

  if (finished) {
    return (
      <div className="game-result">
        <p className="result-label">Session complete</p>
        <p className="result-score">{Math.round(score)}</p>
        <p className="result-meta">~{accuracy}% accuracy · results sync to mastery</p>
        <button type="button" className="game-primary" onClick={onDone}>
          Back to feed
        </button>
      </div>
    );
  }

  return (
    <div className="tap-quiz">
      <div className="quiz-progress">
        <span>
          {qi + 1} / {payload.questions.length}
        </span>
        <span>
          streak ×{streak || 1} · {Math.round(score)} pts
        </span>
      </div>
      <h4 className="quiz-prompt">{q.prompt}</h4>
      <div className="quiz-options">
        {q.options.map((opt, i) => {
          let cls = 'quiz-opt';
          if (picked !== null) {
            if (i === q.correct_index) cls += ' correct';
            else if (i === picked) cls += ' wrong';
          }
          return (
            <button
              key={opt}
              type="button"
              className={cls}
              disabled={picked !== null}
              onClick={() => setPicked(i)}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="quiz-explain">
          <p>{q.explanation}</p>
          <button type="button" className="game-primary" onClick={next}>
            {qi >= payload.questions.length - 1 ? 'See score' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}
