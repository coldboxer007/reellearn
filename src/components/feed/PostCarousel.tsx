import { useRef, useState } from 'react';
import type { PostContent } from '../../types';
import { THEME_META } from '../../data/mock';
import './PostCarousel.css';

interface Props {
  post: PostContent;
  active: boolean;
}

export function PostCarousel({ post }: Props) {
  const [slide, setSlide] = useState(0);
  const touchX = useRef<number | null>(null);
  const theme = THEME_META[post.theme];
  const current = post.slides[slide];

  const go = (dir: -1 | 1) => {
    setSlide((s) => Math.max(0, Math.min(post.slides.length - 1, s + dir)));
  };

  return (
    <article
      className="post-card"
      style={{ ['--post-accent' as string]: current.accent, ['--post-theme' as string]: theme.accent }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (dx < -40) go(1);
        if (dx > 40) go(-1);
        touchX.current = null;
      }}
    >
      <div className="post-atmosphere" aria-hidden />

      <div className="post-frame">
        <div key={current.slide_number} className={`post-slide layout-${current.layout}`}>
          <div className="post-top">
            <span className="post-wordmark">ReelLearn</span>
            <span className="post-count">
              {slide + 1}/{post.slides.length}
            </span>
          </div>

          <h2 className="post-headline">{current.headline}</h2>

          <div className="post-visual" aria-hidden>
            {current.layout === 'cover' && (
              <div className="viz-cover">
                <span className="viz-ring" />
                <span className="viz-ring delay" />
              </div>
            )}
            {current.layout === 'concept' && <div className="viz-node" />}
            {current.layout === 'steps' && (
              <div className="viz-steps">
                {current.body_lines.map((_, i) => (
                  <span key={i} style={{ ['--i' as string]: i }} />
                ))}
              </div>
            )}
            {current.layout === 'compare' && <div className="viz-split" />}
            {current.layout === 'recall' && <div className="viz-flip">?</div>}
          </div>

          <ul className="post-body">
            {current.body_lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>

          {current.layout === 'recall' && (
            <p className="post-recall-hint">Flip for the answer · worth saving</p>
          )}
        </div>

        <div className="post-rail">
          {post.slides.map((s, i) => (
            <button
              key={s.slide_number}
              type="button"
              className={`post-rail-seg ${i === slide ? 'on' : ''} ${i < slide ? 'done' : ''}`}
              onClick={() => setSlide(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <footer className="post-footer">
        <div className="post-footer-copy">
          <p className="post-topic">{post.reelTopic}</p>
          <p className="post-caption">{post.caption}</p>
        </div>
        <div className="post-nav">
          <button type="button" onClick={() => go(-1)} disabled={slide === 0} aria-label="Previous">
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={slide === post.slides.length - 1}
            aria-label="Next"
          >
            ›
          </button>
        </div>
      </footer>
    </article>
  );
}
