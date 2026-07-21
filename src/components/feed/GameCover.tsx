import { useState } from 'react';
import { Play } from 'lucide-react';
import type { GameContent, GameEngine } from '../../types';
import { THEME_META } from '../../data/mock';
import { GameShell } from '../games/GameShell';
import './GameCover.css';

interface Props {
  game: GameContent;
  active: boolean;
  onActiveChange: (active: boolean) => void;
}

const ENGINE_LABEL: Record<GameEngine, string> = {
  'tap-quiz': 'Timed quiz',
  'pair-match': 'Match pairs',
  'order-up': 'Order steps',
  'slider-predict': 'Predict value',
  'bug-hunt': 'Find the error',
};

function EngineArt({ engine }: { engine: GameEngine }) {
  switch (engine) {
    case 'tap-quiz':
      return (
        <svg className="engine-art" viewBox="0 0 200 160" aria-hidden>
          <rect x="20" y="30" width="160" height="28" rx="2" fill="currentColor" opacity="0.15" />
          <rect x="20" y="70" width="72" height="40" fill="currentColor" opacity="0.35" />
          <rect x="108" y="70" width="72" height="40" fill="currentColor" opacity="0.2" />
          <rect x="20" y="120" width="72" height="24" fill="currentColor" opacity="0.12" />
          <rect x="108" y="120" width="72" height="24" fill="currentColor" opacity="0.12" />
        </svg>
      );
    case 'pair-match':
      return (
        <svg className="engine-art" viewBox="0 0 200 160" aria-hidden>
          <rect x="16" y="24" width="70" height="28" fill="currentColor" opacity="0.25" />
          <rect x="114" y="40" width="70" height="28" fill="currentColor" opacity="0.15" />
          <path d="M86 38 C100 38, 100 54, 114 54" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5" />
          <rect x="16" y="70" width="70" height="28" fill="currentColor" opacity="0.15" />
          <rect x="114" y="90" width="70" height="28" fill="currentColor" opacity="0.3" />
          <path d="M86 84 C100 84, 100 104, 114 104" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5" />
        </svg>
      );
    case 'order-up':
      return (
        <svg className="engine-art" viewBox="0 0 200 160" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <text x="24" y={40 + i * 30} fill="currentColor" fontSize="14" fontFamily="monospace" opacity="0.4">
                {i + 1}
              </text>
              <rect x="48" y={24 + i * 30} width={120 - i * 12} height="20" fill="currentColor" opacity={0.35 - i * 0.06} />
            </g>
          ))}
        </svg>
      );
    case 'slider-predict':
      return (
        <svg className="engine-art" viewBox="0 0 200 160" aria-hidden>
          <line x1="24" y1="90" x2="176" y2="90" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <circle cx="128" cy="90" r="14" fill="currentColor" opacity="0.5" />
          <text x="100" y="55" textAnchor="middle" fill="currentColor" fontSize="36" fontFamily="Georgia, serif" opacity="0.7">
            ?
          </text>
        </svg>
      );
    case 'bug-hunt':
      return (
        <svg className="engine-art" viewBox="0 0 200 160" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x="28"
              y={28 + i * 30}
              width={140 - (i === 2 ? 20 : 0)}
              height="16"
              fill="currentColor"
              opacity={i === 2 ? 0.55 : 0.15}
            />
          ))}
          <circle cx="168" cy="94" r="6" fill="currentColor" opacity="0.8" />
        </svg>
      );
  }
}

export function GameCover({ game, onActiveChange }: Props) {
  const [playing, setPlaying] = useState(false);
  const theme = THEME_META[game.theme];

  if (playing) {
    return (
      <GameShell
        game={game}
        onExit={() => {
          setPlaying(false);
          onActiveChange(false);
        }}
      />
    );
  }

  return (
    <article className="game-cover" style={{ ['--game-accent' as string]: theme.accent }}>
      <div className="game-cover-bg" aria-hidden>
        <div className="game-grid" />
        <div className="game-orb" />
      </div>

      <div className="game-art-wrap" style={{ color: theme.accent }}>
        <EngineArt engine={game.engine} />
      </div>

      <div className="game-cover-body">
        <p className="game-eyebrow">Playable · {game.difficulty}</p>
        <h2 className="game-title">{game.title}</h2>
        <p className="game-intro">{game.intro_line}</p>

        <div className="game-engine-row">
          <span className="game-engine-badge">{ENGINE_LABEL[game.engine]}</span>
          <span className="game-engine-id">{game.engine}</span>
        </div>

        <button
          type="button"
          className="game-play-btn"
          onClick={() => {
            setPlaying(true);
            onActiveChange(true);
          }}
        >
          <span className="game-play-icon">
            <Play size={16} fill="currentColor" />
          </span>
          Tap to play
        </button>
      </div>
    </article>
  );
}
