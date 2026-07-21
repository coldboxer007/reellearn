import { Player } from '@remotion/player';
import type { CourseWorkspace, TopicLesson } from '../../product';
import { deriveMotionPlan, getTemplate } from '../../product';
import { EducationalReel } from '../../remotion/EducationalReel';
import { REEL_DURATION_IN_FRAMES, REEL_FPS, REEL_HEIGHT, REEL_WIDTH } from '../../remotion/config';
import { resolveReelTheme, resolveReelThemeId } from '../../remotion/visual-spec';

interface RemotionReelPlayerProps {
  workspace: CourseWorkspace;
  topic: TopicLesson;
  compact?: boolean;
  autoPlay?: boolean;
  onExpand?: () => void;
}

export default function RemotionReelPlayer({
  workspace,
  topic,
  compact = false,
  autoPlay = true,
  onExpand,
}: RemotionReelPlayerProps) {
  const template = getTemplate(topic.styleId ?? workspace.templateId);
  const baseMotionPlan = topic.motionPlan ?? deriveMotionPlan(topic, workspace.subject);
  const durationInFrames = topic.motionVideo?.durationInFrames ?? baseMotionPlan.durationInFrames ?? REEL_DURATION_IN_FRAMES;
  const fallbackBeats = [
    { label: 'Question first', headline: topic.question, body: 'Hold your answer for a moment. Let the visual model test it.' },
    { label: 'Build the model', headline: topic.title, body: topic.summary },
    { label: 'Watch the connection', headline: topic.keyFacts[0], body: topic.keyFacts[1] },
    { label: 'Retrieve it', headline: topic.question, body: 'Answer aloud before the payoff appears.' },
  ];
  const motionPlan = {
    ...baseMotionPlan,
    durationInFrames,
    assets: {
      ...baseMotionPlan.assets,
      ...(topic.visual?.url ? { artImageUrl: topic.visual.url } : {}),
    },
    narrativeBeats: baseMotionPlan.narrativeBeats?.length
      ? baseMotionPlan.narrativeBeats
      : topic.reelScenes ?? fallbackBeats,
  };
  const directionId = resolveReelThemeId(topic.styleId ?? workspace.templateId);

  return (
    <section
      className={`reel-experience remotion-reel template-${template.id} ${compact ? 'is-compact' : ''}`}
      aria-label={`Remotion reel: ${topic.title}`}
    >
      <Player
        component={EducationalReel}
        inputProps={{
          spec: { ...motionPlan, durationInFrames },
          theme: resolveReelTheme(directionId),
          directionId,
          audioUrl: topic.narration?.url ?? null,
        }}
        durationInFrames={durationInFrames}
        compositionWidth={REEL_WIDTH}
        compositionHeight={REEL_HEIGHT}
        fps={REEL_FPS}
        autoPlay={autoPlay}
        loop
        controls={!compact}
        clickToPlay={!compact}
        initiallyMuted
        showVolumeControls={Boolean(topic.narration?.url)}
        allowFullscreen
        acknowledgeRemotionLicense
        style={{ width: '100%', height: '100%' }}
      />
      <span className="remotion-proof">REMOTION · {motionPlan.grammar.replace('-', ' ').toUpperCase()}</span>
      {topic.motionVideo && <a className="rendered-reel-link" href={topic.motionVideo.url} target="_blank" rel="noreferrer">MP4</a>}
      {compact && onExpand && <button type="button" className="remotion-open" onClick={onExpand}>Open reel</button>}
    </section>
  );
}
