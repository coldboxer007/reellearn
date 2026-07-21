import type { WordTimestamp } from '../../types';
import './KaraokeCaptions.css';

interface Props {
  captions: WordTimestamp[];
  t: number;
  looping?: boolean;
}

export function KaraokeCaptions({ captions, t, looping }: Props) {
  if (!captions.length) return null;

  const span = captions[captions.length - 1].end_s;
  const clock = looping ? t % Math.max(span + 1.5, 1) : t;

  return (
    <p className="karaoke">
      {captions.map((w, i) => {
        const on = clock >= w.start_s && clock <= w.end_s + 0.05;
        const past = clock > w.end_s;
        return (
          <span key={`${w.word}-${i}`} className={`karaoke-word ${on ? 'on' : ''} ${past ? 'past' : ''}`}>
            {w.word}{' '}
          </span>
        );
      })}
    </p>
  );
}
