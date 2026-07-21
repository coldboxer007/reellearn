import { useState } from 'react';
import { FileUp, X } from 'lucide-react';
import { THEME_META } from '../../data/mock';
import type { ThemeId } from '../../types';
import './QuickDropModal.css';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (opts: { title: string; reelCount: number; theme: ThemeId }) => void;
}

const THEMES: ThemeId[] = ['auto', 'slate', 'folio', 'circuit', 'sprout', 'ledger'];

export function QuickDropModal({ open, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState('Lecture notes drop');
  const [reelCount, setReelCount] = useState(4);
  const [theme, setTheme] = useState<ThemeId>('auto');
  const [dropped, setDropped] = useState(false);

  if (!open) return null;

  const submit = () => {
    onSubmit({ title, reelCount, theme });
    setDropped(false);
    onClose();
  };

  return (
    <div className="qd-overlay" role="dialog" aria-modal="true" aria-label="Quick Drop">
      <div className="qd-sheet">
        <header className="qd-header">
          <div>
            <p className="qd-eyebrow">Flow B · Quick Drop</p>
            <h2>Turn notes into reels</h2>
          </div>
          <button type="button" className="qd-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <button
          type="button"
          className={`qd-dropzone ${dropped ? 'has-file' : ''}`}
          onClick={() => setDropped(true)}
        >
          <FileUp size={28} />
          <span>{dropped ? 'notes_midterm.pdf · ready' : 'Tap to attach PDF / notes / slides'}</span>
        </button>

        <label className="qd-field">
          <span>Series title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <label className="qd-field">
          <span>Reel count · {reelCount}</span>
          <input
            type="range"
            min={1}
            max={8}
            value={reelCount}
            onChange={(e) => setReelCount(Number(e.target.value))}
          />
        </label>

        <div className="qd-field">
          <span>Theme</span>
          <div className="qd-themes">
            {THEMES.map((id) => (
              <button
                key={id}
                type="button"
                className={`qd-theme ${theme === id ? 'on' : ''}`}
                style={{ ['--t' as string]: THEME_META[id].accent }}
                onClick={() => setTheme(id)}
              >
                <strong>{THEME_META[id].name}</strong>
                <em>{THEME_META[id].tagline}</em>
              </button>
            ))}
          </div>
        </div>

        <button type="button" className="qd-submit" disabled={!dropped} onClick={submit}>
          Generate series
        </button>
      </div>
    </div>
  );
}
