import { useState } from 'react';
import type { GameContent, SliderPredictPayload } from '../../types';

interface Props {
  game: GameContent;
  onDone: () => void;
}

export function SliderPredict({ game, onDone }: Props) {
  const payload = game.payload as SliderPredictPayload;
  const [value, setValue] = useState((payload.min + payload.max) / 2);
  const [revealed, setRevealed] = useState(false);
  const error = Math.abs(value - payload.trueValue);
  const range = payload.max - payload.min || 1;
  const accuracy = Math.max(0, Math.round((1 - error / range) * 100));

  return (
    <div className="slider-predict">
      <h4 className="quiz-prompt">{payload.prompt}</h4>
      <p className="slider-value">
        {value.toFixed(2)}
        {payload.unit}
      </p>
      <input
        className="slider"
        type="range"
        min={payload.min}
        max={payload.max}
        step={(payload.max - payload.min) / 100}
        value={value}
        disabled={revealed}
        onChange={(e) => setValue(Number(e.target.value))}
      />
      <div className="slider-ends">
        <span>{payload.min}</span>
        <span>{payload.max}</span>
      </div>
      {!revealed ? (
        <button type="button" className="game-primary" onClick={() => setRevealed(true)}>
          Reveal truth
        </button>
      ) : (
        <div className="quiz-explain">
          <p className="reveal-true">
            True value: <strong>{payload.trueValue}</strong> · you were {accuracy}% close
          </p>
          <p>{payload.explanation}</p>
          <button type="button" className="game-primary" onClick={onDone}>
            Back to feed
          </button>
        </div>
      )}
    </div>
  );
}
