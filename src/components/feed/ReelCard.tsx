import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import type { ReelContent } from '../../types';
import { THEME_META } from '../../data/mock';
import { KaraokeCaptions } from './KaraokeCaptions';
import { LedgerScene, ReelScene } from './ReelScene';
import './ReelCard.css';

interface Props {
  reel: ReelContent;
  active: boolean;
  muted: boolean;
  onToggleMute: () => void;
}

export function ReelCard({ reel, active, muted, onToggleMute }: Props) {
  const [t, setT] = useState(0);
  const theme = THEME_META[reel.theme];
  const [g0, g1] = reel.posterGradient;

  useEffect(() => {
    if (!active) {
      setT(0);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      setT(((now - start) / 1000) % Math.max(reel.duration_s, 8));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reel.duration_s]);

  const progress = Math.min(t / reel.duration_s, 1);
  const Scene = reel.theme === 'ledger' ? LedgerScene : ReelScene;

  return (
    <article
      className={`reel-card ${active ? 'is-active' : ''}`}
      style={{
        ['--reel-a' as string]: g0,
        ['--reel-b' as string]: g1,
        ['--reel-accent' as string]: theme.accent,
      }}
    >
      <div className="reel-wash" aria-hidden />
      <div className="reel-vignette" aria-hidden />

      <Scene id={reel.id} accent={theme.accent} progress={progress} t={t} active={active} />

      <div className="reel-meta">
        <div className="reel-series-row">
          <span className="reel-series">{reel.seriesTitle}</span>
          <span className="reel-dur">{reel.duration_s}s</span>
        </div>
        <h2 className="reel-topic">{reel.topic}</h2>
        <div className="reel-caption-block">
          <KaraokeCaptions captions={reel.captions} t={t} looping />
        </div>
      </div>

      <div className="reel-side">
        <button type="button" className="reel-icon-btn" onClick={onToggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <div className="reel-theme-chip">{theme.name}</div>
      </div>

      <div className="reel-progress">
        <div className="reel-progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>
    </article>
  );
}
