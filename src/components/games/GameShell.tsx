import { X } from 'lucide-react';
import type { GameContent } from '../../types';
import { TapQuiz } from './TapQuiz';
import { PairMatch } from './PairMatch';
import { OrderUp } from './OrderUp';
import { SliderPredict } from './SliderPredict';
import { BugHunt } from './BugHunt';
import './games.css';

interface Props {
  game: GameContent;
  onExit: () => void;
}

export function GameShell({ game, onExit }: Props) {
  return (
    <div className="game-shell">
      <header className="game-shell-bar">
        <div>
          <p className="game-shell-engine">{game.engine}</p>
          <h3 className="game-shell-title">{game.title}</h3>
        </div>
        <button type="button" className="game-exit" onClick={onExit} aria-label="Exit game">
          <X size={20} />
        </button>
      </header>
      <div className="game-shell-body">
        {game.engine === 'tap-quiz' && <TapQuiz game={game} onDone={onExit} />}
        {game.engine === 'pair-match' && <PairMatch game={game} onDone={onExit} />}
        {game.engine === 'order-up' && <OrderUp game={game} onDone={onExit} />}
        {game.engine === 'slider-predict' && <SliderPredict game={game} onDone={onExit} />}
        {game.engine === 'bug-hunt' && <BugHunt game={game} onDone={onExit} />}
      </div>
    </div>
  );
}
