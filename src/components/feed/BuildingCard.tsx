import { useEffect, useState } from 'react';
import { THEME_META } from '../../data/mock';
import type { BuildingContent, JobStage } from '../../types';
import './BuildingCard.css';

interface Props {
  job: BuildingContent;
}

type StageStatus = 'pending' | 'running' | 'done';

export function BuildingCard({ job }: Props) {
  const theme = THEME_META[job.theme];
  const [stages, setStages] = useState(job.stages);
  const [reels, setReels] = useState(job.reels);

  useEffect(() => {
    setStages(job.stages);
    setReels(job.reels);
  }, [job]);

  useEffect(() => {
    const id = setInterval(() => {
      setStages((prev) => {
        const next = prev.map((s) => ({ ...s }));
        const runningIdx = next.findIndex((s) => s.status === 'running');
        const idx = runningIdx >= 0 ? runningIdx : next.findIndex((s) => s.status === 'pending');
        if (idx < 0) return prev;
        next[idx].status = 'done';
        if (idx + 1 < next.length) next[idx + 1].status = 'running';
        return next;
      });
      setReels((prev) => {
        const next = [...prev];
        const skel = next.findIndex((r) => r.status === 'skeleton');
        if (skel >= 0 && Math.random() > 0.4) {
          next[skel] = {
            ...next[skel],
            status: 'published',
            topic: next[skel].topic.startsWith('Reel')
              ? ['Separable ODEs', 'Integrating Factor', 'Phase Portraits', 'Uniqueness'][skel] ??
                next[skel].topic
              : next[skel].topic,
          };
        }
        return next;
      });
    }, 2200);

    return () => clearInterval(id);
  }, [job.id]);

  const doneStages = stages.filter((s) => s.status === 'done').length;
  const running = stages.find((s) => s.status === 'running');
  const pct = (doneStages / Math.max(stages.length, 1)) * 100;

  return (
    <article className="building-card" style={{ ['--build-accent' as string]: theme.accent }}>
      <div className="building-inner">
        <div className="building-live">
          <span className="live-dot" />
          Live job
        </div>
        <h2 className="building-title">{job.title}</h2>
        <p className="building-meta">
          {job.reelCount} reels
          <span className="dot">·</span>
          <span style={{ color: theme.accent }}>{theme.name}</span>
          <span className="dot">·</span>
          {running?.label ?? 'Done'}
        </p>

        <div className="building-progress">
          <div className="building-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="building-pct">{Math.round(pct)}% · stage graph</p>

        <ol className="building-stages">
          {stages.map((stage) => (
            <li key={stage.id} className={`stage stage-${stage.status as StageStatus}`}>
              <span className="stage-mark" />
              <span className="stage-label">{stage.label}</span>
              <span className="stage-tag">{statusTag(stage.status, stage.id)}</span>
            </li>
          ))}
        </ol>

        <div className="building-reels">
          {reels.map((reel) => (
            <div key={reel.n} className={`building-tile status-${reel.status}`}>
              {reel.status === 'published' ? (
                <>
                  <span className="tile-n">0{reel.n}</span>
                  <span className="tile-topic">{reel.topic}</span>
                </>
              ) : (
                <div className="tile-pending">
                  <span className="tile-skel" />
                  <span className="tile-skel short" />
                  <span className="tile-n muted">0{reel.n}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="building-foot">Leave anytime — push when published</p>
      </div>
    </article>
  );
}

function statusTag(status: string, _id: JobStage): string {
  if (status === 'done') return 'ok';
  if (status === 'running') return '…';
  return '';
}
