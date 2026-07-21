import { useCallback, useEffect, useRef, useState } from 'react';
import type { FeedItem as FeedItemType } from '../../types';
import { FeedCard } from './FeedCard';
import './FeedScreen.css';

interface Props {
  items: FeedItemType[];
  onOpenQuickDrop: () => void;
  onPlayingChange: (playing: boolean) => void;
}

export function FeedScreen({ items, onOpenQuickDrop, onPlayingChange }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [showHint, setShowHint] = useState(true);

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const h = el.clientHeight;
    const idx = Math.round(el.scrollTop / h);
    setActiveIndex(Math.max(0, Math.min(items.length - 1, idx)));
    if (el.scrollTop > 48) setShowHint(false);
  }, [items.length]);

  useEffect(() => {
    onPlayingChange(false);
  }, [activeIndex, onPlayingChange]);

  return (
    <div className="feed-screen">
      <header className="feed-chrome">
        <div className="feed-brand">
          <span className="feed-wordmark">ReelLearn</span>
          <span className="feed-sub">
            <i /> Today
          </span>
        </div>
        <button type="button" className="feed-drop-btn" onClick={onOpenQuickDrop}>
          <span className="feed-drop-plus">+</span>
          Drop
        </button>
      </header>

      <div ref={scrollerRef} className="feed-scroller" onScroll={onScroll}>
        {items.map((item, i) => (
          <div key={item.id} className="feed-page">
            <FeedCard
              item={item}
              active={i === activeIndex}
              muted={muted}
              onToggleMute={() => setMuted((m) => !m)}
              onGameActiveChange={onPlayingChange}
            />
          </div>
        ))}
      </div>

      {showHint && activeIndex === 0 && (
        <div className="feed-hint" aria-hidden>
          <div className="feed-hint-chevron" />
          <span>Next</span>
        </div>
      )}
    </div>
  );
}
