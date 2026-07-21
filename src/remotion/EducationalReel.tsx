import type {CSSProperties, ReactNode} from 'react';
import {Audio} from '@remotion/media';
import {
  AbsoluteFill,
  Img,
  interpolate,
  Sequence,
  Series,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {
  MotionAssets,
  MotionDirection,
  MotionLink,
  MotionNode,
  MotionSpec,
  PhysicsBody,
  PhysicsPath,
  ReelTheme,
  ReelThemeId,
  ThemeTokens,
} from './visual-spec';
import {THEME} from './visual-spec';
import {
  activeStoryboardBeat,
  buildStoryboard,
  pacedCaptionWordIndex,
  resolveReelDirection,
  type ReelDirectionProfile,
  type StoryboardBeat,
} from './direction';

export type EducationalReelProps = {
  spec: MotionSpec;
  theme: ReelTheme;
  directionId?: ReelThemeId;
  audioUrl?: string | null;
};

type SceneProps = {
  spec: MotionSpec;
  theme: ThemeTokens;
  direction: ReelDirectionProfile;
  storyboardBeat?: StoryboardBeat;
};

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const resolveTheme = (specTheme: Partial<ThemeTokens> | undefined, theme: ReelTheme): ThemeTokens => ({
  ...THEME,
  ...theme,
  ...specTheme,
});

const appear = (frame: number, fps: number, delay = 0) =>
  spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: {damping: 18, stiffness: 150, mass: 0.82},
  });

const stageStyle = (theme: ThemeTokens, direction: ReelDirectionProfile): CSSProperties => ({
  position: 'absolute',
  left: direction.stage.left,
  right: direction.stage.right,
  top: direction.stage.top,
  bottom: direction.stage.bottom,
  overflow: 'hidden',
  border: `${direction.stage.borderWidth}px ${direction.stage.borderStyle} ${theme.line}`,
  borderRadius: direction.stage.radius,
  background: `linear-gradient(145deg, ${theme.panel}, ${theme.paper} 78%)`,
  boxShadow: direction.id === 'editorial'
    ? '12px 16px 0 rgba(43,26,24,.1), 0 28px 70px rgba(43,26,24,.18)'
    : direction.id === 'field-notes'
      ? '8px 10px 0 rgba(0,0,0,.16), 0 28px 72px rgba(0,0,0,.3)'
      : direction.id === 'kinetic'
        ? `18px 20px 0 ${theme.accentAlt}20, 0 34px 90px rgba(0,0,0,.42)`
        : `0 0 0 1px ${theme.accent}18, 0 36px 100px rgba(0,0,0,.38)`,
  transform: direction.stage.rotation ? `rotate(${direction.stage.rotation}deg)` : undefined,
});

const labelStyle = (theme: ThemeTokens, direction?: ReelDirectionProfile): CSSProperties => ({
  color: theme.muted,
  fontSize: direction?.id === 'editorial' ? 26 : 24,
  fontWeight: 760,
  letterSpacing: direction?.id === 'editorial' ? '0.08em' : '0.15em',
  textTransform: 'uppercase',
});

const nodeColor = (node: MotionNode, theme: ThemeTokens) => {
  if (node.accent) return node.accent;
  switch (node.kind) {
    case 'input':
      return theme.warning;
    case 'machine':
    case 'process':
      return theme.accent;
    case 'output':
      return theme.success;
    case 'carrier':
      return theme.accentAlt;
    case 'location':
      return theme.muted;
  }
};

const byKind = (nodes: MotionNode[], kind: MotionNode['kind']) =>
  nodes.filter((node) => node.kind === kind);

const preferred = (
  nodes: MotionNode[],
  predicate: (node: MotionNode) => boolean,
  fallbackKind: MotionNode['kind'],
) => nodes.find(predicate) ?? nodes.find((node) => node.kind === fallbackKind);

const limitWords = (value: string, max: number) => {
  const words = value.trim().split(/\s+/);
  return words.length <= max ? value : `${words.slice(0, max).join(' ')}…`;
};

const SceneHeading = ({spec, theme, direction, storyboardBeat}: SceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entry = appear(frame, fps);
  const eyebrow = storyboardBeat?.beat.label ?? spec.setting;
  const headline = storyboardBeat?.beat.headline ?? spec.objective;

  return (
    <div
      style={{
        position: 'absolute',
        top: direction.heading.top,
        left: direction.heading.left,
        right: direction.heading.right,
        textAlign: direction.heading.align,
        opacity: entry,
        transform: `translateY(${interpolate(entry, [0, 1], [direction.transition === 'scan' ? -14 : 22, 0])}px)`,
      }}
    >
      <div style={{...labelStyle(theme, direction), color: direction.id === 'editorial' ? theme.accent : theme.muted}}>{eyebrow}</div>
      <div
        style={{
          color: theme.ink,
          fontFamily: theme.displayFamily,
          fontSize: (headline.length > 110 ? 34 : headline.length > 75 ? 38 : 43) * direction.heading.scale,
          fontWeight: direction.id === 'editorial' ? 690 : 780,
          fontStyle: direction.id === 'editorial' ? 'italic' : 'normal',
          lineHeight: 1.08,
          letterSpacing: direction.id === 'neon-lab' ? '-0.015em' : '-0.035em',
          marginTop: 14,
          textTransform: direction.heading.uppercase ? 'uppercase' : 'none',
        }}
      >
        {headline}
      </div>
    </div>
  );
};

const LinkCaption = ({
  link,
  index,
  theme,
}: {
  link: MotionLink;
  index: number;
  theme: ThemeTokens;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entry = appear(frame, fps, 18 + index * 8);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        opacity: entry,
        transform: `translateX(${interpolate(entry, [0, 1], [24, 0])}px)`,
      }}
    >
      <div
        style={{
          width: 9,
          height: 9,
          borderRadius: '50%',
          background: theme.accent,
          boxShadow: `0 0 18px ${theme.accent}`,
        }}
      />
      <span style={{color: theme.muted, fontSize: 28, fontWeight: 620}}>
        {link.label}
      </span>
    </div>
  );
};

const EnergyTransferScene = ({spec, theme, direction, storyboardBeat}: SceneProps) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const machine = preferred(
    spec.nodes,
    (node) => /synthase|turbine|machine/i.test(node.label),
    'machine',
  );
  const gradient = preferred(
    spec.nodes,
    (node) => /h\+|proton|gradient/i.test(node.label),
    'input',
  );
  const carrier = preferred(
    spec.nodes,
    (node) => /adp|carrier/i.test(node.label),
    'carrier',
  );
  const phosphate = spec.nodes.find(
    (node) => node !== gradient && node !== carrier && /(^|\s)pi($|\s)|phosphate/i.test(node.label),
  );
  const output =
    spec.nodes.find((node) => node.kind === 'output') ??
    spec.nodes.find((node) => /(^|\s)atp($|\s)|energy/i.test(node.label));
  const location = spec.nodes.find((node) => node.kind === 'location');

  const turbineAngle = (frame * 7.5) % 360;
  const machineEntry = appear(frame, fps, 10);
  const reactionEntry = appear(frame, fps, 42);
  const reactionInput = [carrier?.label, phosphate?.label]
    .filter((label): label is string => Boolean(label))
    .join(' + ');
  const reaction = `${reactionInput || gradient?.label || 'Input'} → ${output?.label ?? 'Output'}`;
  const reactionFontSize = reaction.length > 34 ? 24 : reaction.length > 25 ? 30 : 38;
  const flowOpacity = interpolate(
    frame,
    [8, 20, Math.max(40, durationInFrames - 18)],
    [0, 1, 1],
    clamp,
  );

  return (
    <AbsoluteFill>
      <SceneHeading spec={spec} theme={theme} direction={direction} storyboardBeat={storyboardBeat} />
      <div style={stageStyle(theme, direction)}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 50% 42%, rgba(217,255,99,.12), transparent 34%), radial-gradient(circle at 14% 16%, rgba(255,180,92,.08), transparent 28%)',
          }}
        />
        <svg
          viewBox="0 0 900 1040"
          style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
        >
          <defs>
            <linearGradient id="mito-shell" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={theme.accentAlt} stopOpacity="0.2" />
              <stop offset="1" stopColor={theme.accentAlt} stopOpacity="0.04" />
            </linearGradient>
            <filter id="energy-glow">
              <feGaussianBlur stdDeviation="7" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <text x="62" y="100" fill={theme.muted} fontSize="20" fontWeight="700" letterSpacing="3">
            INTERMEMBRANE SPACE · HIGH H⁺
          </text>

          <path
            d="M82,322 C146,238 267,218 360,253 C435,281 502,280 573,247 C686,195 807,263 828,365 C850,472 760,580 654,573 C560,568 505,621 413,623 C326,624 273,574 190,574 C87,575 26,486 50,392 C57,366 68,342 82,322Z"
            fill="url(#mito-shell)"
            stroke={theme.accentAlt}
            strokeOpacity="0.6"
            strokeWidth="3"
          />

          <path
            d="M92 408 C160 350 220 466 291 408 S420 350 489 408 S618 466 689 408 S786 354 824 397"
            fill="none"
            stroke={theme.ink}
            strokeOpacity="0.42"
            strokeWidth="14"
          />
          <path
            d="M92 431 C160 373 220 489 291 431 S420 373 489 431 S618 489 689 431 S786 377 824 420"
            fill="none"
            stroke={theme.accentAlt}
            strokeOpacity="0.82"
            strokeWidth="8"
          />

          {Array.from({length: 10}, (_, index) => {
            const x = 115 + (index % 5) * 154 + (index > 4 ? 37 : 0);
            const y = 160 + Math.floor(index / 5) * 78;
            const pulse = 1 + Math.sin((frame + index * 4) / 8) * 0.08;
            return (
              <g key={`stored-proton-${index}`} transform={`translate(${x} ${y}) scale(${pulse})`}>
                <circle r="25" fill={theme.warning} fillOpacity="0.16" />
                <circle r="15" fill={theme.warning} filter="url(#energy-glow)" />
                <text x="-12" y="7" fill={theme.paper} fontSize="17" fontWeight="900">
                  H+
                </text>
              </g>
            );
          })}

          {Array.from({length: 4}, (_, index) => {
            const local = ((frame + index * 17) % 68) / 68;
            const y = interpolate(local, [0, 1], [245, 596]);
            const x = 450 + Math.sin(local * Math.PI * 2 + index) * 7;
            const opacity = interpolate(local, [0, 0.1, 0.86, 1], [0, 1, 1, 0], clamp);
            return (
              <g key={`moving-proton-${index}`} opacity={opacity * flowOpacity} transform={`translate(${x} ${y})`}>
                <circle r="20" fill={theme.warning} filter="url(#energy-glow)" />
                <text x="-11" y="6" fill={theme.paper} fontSize="15" fontWeight="900">
                  H+
                </text>
              </g>
            );
          })}

          <g
            opacity={machineEntry}
            transform={`translate(450 420) scale(${interpolate(machineEntry, [0, 1], [0.76, 1])}) translate(-450 -420)`}
          >
            <rect x="418" y="346" width="64" height="196" rx="30" fill={theme.accent} fillOpacity="0.92" />
            <circle cx="450" cy="555" r="76" fill={theme.panel} stroke={theme.accent} strokeWidth="12" />
            <g transform={`rotate(${turbineAngle} 450 555)`}>
              {Array.from({length: 6}, (_, index) => (
                <line
                  key={`rotor-${index}`}
                  x1="450"
                  y1="555"
                  x2="450"
                  y2="498"
                  stroke={theme.accent}
                  strokeWidth="13"
                  strokeLinecap="round"
                  transform={`rotate(${index * 60} 450 555)`}
                />
              ))}
              <circle cx="450" cy="555" r="20" fill={theme.accent} />
            </g>
            <path d="M392 632 Q450 688 508 632" fill="none" stroke={theme.accent} strokeWidth="15" strokeLinecap="round" />
          </g>

          <text x="450" y="690" fill={theme.accent} textAnchor="middle" fontSize="29" fontWeight="850">
            {machine?.label ?? 'Energy-coupling machine'}
          </text>
          <text x="450" y="724" fill={theme.muted} textAnchor="middle" fontSize="19">
            {machine?.detail ?? 'Flow turns molecular motion into stored energy'}
          </text>

          <text x="64" y="790" fill={theme.muted} fontSize="19" fontWeight="700" letterSpacing="3">
            MATRIX · LOW H⁺
          </text>

          <g
            opacity={reactionEntry}
            transform={`translate(${interpolate(reactionEntry, [0, 1], [0, 26])} 0)`}
          >
            <rect x="76" y="836" width="748" height="122" rx="34" fill={theme.paper} stroke={theme.line} />
            <circle cx="132" cy="897" r="26" fill={theme.accent} fillOpacity="0.18" />
            <path d="M121 897 h22 M132 886 v22" stroke={theme.accent} strokeWidth="5" strokeLinecap="round" />
            <text x="180" y="890" fill={theme.ink} fontSize={reactionFontSize} fontWeight="840">
              {reaction}
            </text>
            <text x="180" y="929" fill={theme.success} fontSize="20" fontWeight="720">
              coupled by {gradient?.label ?? 'stored potential'}
            </text>
          </g>
        </svg>

        <div
          style={{
            position: 'absolute',
            left: 50,
            right: 50,
            bottom: 34,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {spec.links.slice(0, 3).map((link, index) => (
            <LinkCaption key={`${link.from}-${link.to}`} link={link} index={index} theme={theme} />
          ))}
        </div>

        {location ? (
          <div
            style={{
              position: 'absolute',
              top: 26,
              right: 30,
              padding: '10px 16px',
              border: `1px solid ${theme.line}`,
              borderRadius: 999,
              color: theme.ink,
              background: 'rgba(9,12,18,.72)',
              fontSize: 18,
              fontWeight: 680,
            }}
          >
            {location.label}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

const SpatialProcessScene = ({spec, theme, direction, storyboardBeat}: SceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nodes = spec.nodes.slice(0, 7);
  const mapHeight = 1450;
  const pointFor = (node: MotionNode, index: number) => ({
    x: 110 + (node.x ?? ((index * 0.37) % 1)) * 680,
    y: 190 + (node.y ?? ((index * 0.53) % 1)) * 1040,
  });

  return (
    <AbsoluteFill>
      <SceneHeading spec={spec} theme={theme} direction={direction} storyboardBeat={storyboardBeat} />
      <div style={stageStyle(theme, direction)}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(${theme.line} 1px, transparent 1px), linear-gradient(90deg, ${theme.line} 1px, transparent 1px)`,
            backgroundSize: '76px 76px',
            opacity: 0.32,
          }}
        />
        <div style={{position: 'absolute', left: 44, top: 38, ...labelStyle(theme)}}>
          Spatial map · follow the route
        </div>
        <svg viewBox={`0 0 900 ${mapHeight}`} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
          {spec.links.map((link, index) => {
            const fromIndex = nodes.findIndex((node) => node.id === link.from);
            const toIndex = nodes.findIndex((node) => node.id === link.to);
            if (fromIndex < 0 || toIndex < 0) return null;
            const from = pointFor(nodes[fromIndex], fromIndex);
            const to = pointFor(nodes[toIndex], toIndex);
            const pathProgress = interpolate(frame, [12 + index * 8, 46 + index * 8], [0, 1], clamp);
            const particle = (frame / 52 + index * 0.29) % 1;
            const px = interpolate(particle, [0, 1], [from.x, to.x]);
            const py = interpolate(particle, [0, 1], [from.y, to.y]);
            return (
              <g key={`${link.from}-${link.to}`} opacity={pathProgress}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={theme.accent}
                  strokeWidth="5"
                  strokeDasharray="13 14"
                  strokeDashoffset={-frame * 1.8}
                  opacity="0.58"
                />
                <circle cx={px} cy={py} r="12" fill={theme.accent} />
              </g>
            );
          })}
        </svg>

        {nodes.map((node, index) => {
          const point = pointFor(node, index);
          const entry = appear(frame, fps, 4 + index * 7);
          return (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                left: `${(point.x / 900) * 100}%`,
                top: `${(point.y / mapHeight) * 100}%`,
                width: 238,
                minHeight: 120,
                padding: '22px 24px',
                border: `1px solid ${nodeColor(node, theme)}66`,
                borderRadius: 28,
                background: 'rgba(9,12,18,.88)',
                transform: `translate(-50%, -50%) scale(${interpolate(entry, [0, 1], [0.72, 1])})`,
                opacity: entry,
                boxShadow: `0 16px 44px ${nodeColor(node, theme)}18`,
              }}
            >
              <div style={{color: nodeColor(node, theme), fontSize: 16, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em'}}>
                {node.kind}
              </div>
              <div style={{color: theme.ink, fontSize: 26, fontWeight: 780, lineHeight: 1.08, marginTop: 7}}>
                {node.label}
              </div>
              {node.detail ? (
                <div style={{color: theme.muted, fontSize: 17, lineHeight: 1.24, marginTop: 8}}>
                  {limitWords(node.detail, 10)}
                </div>
              ) : null}
            </div>
          );
        })}

        <div
          style={{
            position: 'absolute',
            left: 44,
            right: 44,
            bottom: 42,
            color: theme.ink,
            fontSize: 26,
            fontWeight: 700,
          }}
        >
          {spec.links[Math.floor(frame / 38) % Math.max(1, spec.links.length)]?.label ?? spec.takeHome}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const LinearProcessScene = ({spec, theme, direction, storyboardBeat}: SceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nodes = spec.nodes.filter((node) => node.kind !== 'location').slice(0, 5);

  return (
    <AbsoluteFill>
      <SceneHeading spec={spec} theme={theme} direction={direction} storyboardBeat={storyboardBeat} />
      <div style={stageStyle(theme, direction)}>
        <div style={{position: 'absolute', left: 48, top: 42, ...labelStyle(theme)}}>
          Step-by-step mechanism
        </div>
        <div
          style={{
            position: 'absolute',
            top: 122,
            bottom: 70,
            left: 64,
            right: 64,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 24,
          }}
        >
          {nodes.map((node, index) => {
            const entry = appear(frame, fps, index * 10);
            const active = Math.min(nodes.length - 1, Math.floor(Math.max(0, frame - 6) / 28)) === index;
            return (
              <div key={node.id} style={{display: 'flex', alignItems: 'stretch', gap: 22, opacity: entry}}>
                <div style={{width: 58, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 18,
                      background: active ? nodeColor(node, theme) : theme.panel,
                      border: `2px solid ${nodeColor(node, theme)}`,
                      color: active ? theme.paper : nodeColor(node, theme),
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 22,
                      fontWeight: 900,
                    }}
                  >
                    {index + 1}
                  </div>
                  {index < nodes.length - 1 ? (
                    <div style={{flex: 1, width: 3, minHeight: 40, background: `linear-gradient(${theme.accent}, ${theme.line})`}} />
                  ) : null}
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: '26px 30px',
                    borderRadius: 30,
                    border: `1px solid ${active ? nodeColor(node, theme) : theme.line}`,
                    background: active ? `${nodeColor(node, theme)}12` : 'rgba(255,255,255,.025)',
                    transform: `translateX(${interpolate(entry, [0, 1], [70, 0])}px)`,
                  }}
                >
                  <div style={{color: nodeColor(node, theme), fontSize: 16, fontWeight: 820, letterSpacing: '0.12em', textTransform: 'uppercase'}}>
                    {node.kind}
                  </div>
                  <div style={{color: theme.ink, fontSize: 32, fontWeight: 800, marginTop: 7}}>{node.label}</div>
                  <div style={{color: theme.muted, fontSize: 21, lineHeight: 1.3, marginTop: 8}}>
                    {node.detail ?? spec.links[index]?.label ?? 'The process advances to the next state.'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CycleScene = ({spec, theme, direction, storyboardBeat}: SceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nodes = spec.nodes.filter((node) => node.kind !== 'location').slice(0, 6);
  const radius = 280;
  const center = {x: 450, y: 502};

  return (
    <AbsoluteFill>
      <SceneHeading spec={spec} theme={theme} direction={direction} storyboardBeat={storyboardBeat} />
      <div style={stageStyle(theme, direction)}>
        <div style={{position: 'absolute', left: 48, top: 42, ...labelStyle(theme)}}>
          Regenerating cycle
        </div>
        <svg viewBox="0 0 900 1040" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
          <circle cx={center.x} cy={center.y} r={radius} fill="none" stroke={theme.line} strokeWidth="4" strokeDasharray="16 14" />
          <circle
            cx={center.x + Math.cos((frame / 58) * Math.PI * 2 - Math.PI / 2) * radius}
            cy={center.y + Math.sin((frame / 58) * Math.PI * 2 - Math.PI / 2) * radius}
            r="15"
            fill={theme.accent}
          />
          <text x={center.x} y={center.y - 16} fill={theme.ink} textAnchor="middle" fontSize="42" fontWeight="850">
            REPEAT
          </text>
          <text x={center.x} y={center.y + 28} fill={theme.muted} textAnchor="middle" fontSize="21">
            output feeds the next turn
          </text>
          {nodes.map((node, index) => {
            const angle = (index / Math.max(1, nodes.length)) * Math.PI * 2 - Math.PI / 2;
            const x = center.x + Math.cos(angle) * radius;
            const y = center.y + Math.sin(angle) * radius;
            const entry = appear(frame, fps, index * 7);
            const activeIndex = Math.floor(frame / 18) % Math.max(1, nodes.length);
            const active = activeIndex === index;
            return (
              <g key={node.id} opacity={entry} transform={`translate(${x} ${y}) scale(${active ? 1.08 : 1})`}>
                <circle r="88" fill={theme.paper} stroke={active ? theme.accent : nodeColor(node, theme)} strokeWidth={active ? 8 : 3} />
                <text y="-6" fill={theme.ink} textAnchor="middle" fontSize="30" fontWeight="800">
                  {limitWords(node.label, 3)}
                </text>
                <text y="31" fill={nodeColor(node, theme)} textAnchor="middle" fontSize="19" fontWeight="780" letterSpacing="1.5">
                  {node.kind.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
        <div style={{position: 'absolute', left: 50, right: 50, bottom: 44, display: 'flex', flexDirection: 'column', gap: 9}}>
          {spec.links.slice(0, 2).map((link, index) => (
            <LinkCaption key={`${link.from}-${link.to}`} link={link} index={index} theme={theme} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ComparisonScene = ({spec, theme, direction, storyboardBeat}: SceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nodes = spec.nodes.filter((node) => node.kind !== 'location').slice(0, 6);
  const splitAt = Math.max(1, Math.ceil(nodes.length / 2));
  const columns = [nodes.slice(0, splitAt), nodes.slice(splitAt)];

  return (
    <AbsoluteFill>
      <SceneHeading spec={spec} theme={theme} direction={direction} storyboardBeat={storyboardBeat} />
      <div style={stageStyle(theme, direction)}>
        <div style={{position: 'absolute', left: 48, top: 42, ...labelStyle(theme)}}>
          Side-by-side comparison
        </div>
        <div style={{position: 'absolute', top: 112, bottom: 64, left: 48, right: 48, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22}}>
          {columns.map((column, columnIndex) => {
            const entry = appear(frame, fps, columnIndex * 10);
            return (
              <div
                key={`comparison-${columnIndex}`}
                style={{
                  border: `1px solid ${columnIndex === 0 ? theme.accentAlt : theme.accent}66`,
                  borderRadius: 34,
                  padding: '34px 28px',
                  background: columnIndex === 0 ? `${theme.accentAlt}0D` : `${theme.accent}0D`,
                  opacity: entry,
                  transform: `translateX(${interpolate(entry, [0, 1], [columnIndex === 0 ? -60 : 60, 0])}px)`,
                }}
              >
                <div style={{color: columnIndex === 0 ? theme.accentAlt : theme.accent, fontSize: 22, fontWeight: 850}}>
                  {column[0]?.label ?? (columnIndex === 0 ? 'Before' : 'After')}
                </div>
                <div style={{height: 2, background: theme.line, margin: '24px 0 30px'}} />
                {column.map((node, index) => (
                  <div key={node.id} style={{marginBottom: 30}}>
                    <div style={{color: theme.ink, fontSize: 27, fontWeight: 770}}>{index === 0 ? node.value ?? node.label : node.label}</div>
                    <div style={{color: theme.muted, fontSize: 20, lineHeight: 1.3, marginTop: 8}}>
                      {node.detail ?? node.kind}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 76,
              height: 76,
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'grid',
              placeItems: 'center',
              background: theme.ink,
              color: theme.paper,
              fontSize: 19,
              fontWeight: 900,
              border: `10px solid ${theme.paper}`,
            }}
          >
            VS
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const TimelineScene = ({spec, theme, direction, storyboardBeat}: SceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nodes = spec.nodes.filter((node) => node.kind !== 'location').slice(0, 6);
  const lineHeight = interpolate(frame, [5, 72], [0, 100], clamp);

  return (
    <AbsoluteFill>
      <SceneHeading spec={spec} theme={theme} direction={direction} storyboardBeat={storyboardBeat} />
      <div style={stageStyle(theme, direction)}>
        <div style={{position: 'absolute', left: 48, top: 42, ...labelStyle(theme)}}>
          Change across time
        </div>
        <div style={{position: 'absolute', top: 126, bottom: 72, left: 92, right: 56}}>
          <div style={{position: 'absolute', left: 34, top: 15, bottom: 15, width: 4, borderRadius: 4, background: theme.line}}>
            <div style={{width: '100%', height: `${lineHeight}%`, background: theme.accent, boxShadow: `0 0 18px ${theme.accent}`}} />
          </div>
          <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%'}}>
            {nodes.map((node, index) => {
              const entry = appear(frame, fps, index * 10);
              return (
                <div key={node.id} style={{display: 'grid', gridTemplateColumns: '72px 1fr', alignItems: 'center', opacity: entry}}>
                  <div
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: '50%',
                      background: theme.paper,
                      border: `4px solid ${nodeColor(node, theme)}`,
                      display: 'grid',
                      placeItems: 'center',
                      color: nodeColor(node, theme),
                      fontWeight: 900,
                      fontSize: 18,
                    }}
                  >
                    {node.value ?? String(index + 1).padStart(2, '0')}
                  </div>
                  <div style={{marginLeft: 30, padding: '18px 26px', borderRadius: 24, background: 'rgba(255,255,255,.035)', border: `1px solid ${theme.line}`}}>
                    <div style={{color: theme.ink, fontSize: 29, fontWeight: 800}}>{node.label}</div>
                    <div style={{color: theme.muted, fontSize: 19, lineHeight: 1.25, marginTop: 7}}>
                      {node.detail ?? spec.links[index]?.label ?? node.kind}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const NetworkScene = ({spec, theme, direction, storyboardBeat}: SceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nodes = spec.nodes.slice(0, 8);
  const fallbackPoints = [
    {x: 450, y: 460},
    {x: 210, y: 230},
    {x: 684, y: 222},
    {x: 735, y: 516},
    {x: 632, y: 747},
    {x: 268, y: 753},
    {x: 142, y: 480},
    {x: 452, y: 185},
  ];
  const pointFor = (node: MotionNode, index: number) => ({
    x: node.x === undefined ? fallbackPoints[index].x : 110 + node.x * 680,
    y: node.y === undefined ? fallbackPoints[index].y : 130 + node.y * 690,
  });

  return (
    <AbsoluteFill>
      <SceneHeading spec={spec} theme={theme} direction={direction} storyboardBeat={storyboardBeat} />
      <div style={stageStyle(theme, direction)}>
        <div style={{position: 'absolute', left: 48, top: 42, ...labelStyle(theme)}}>
          Connected system
        </div>
        <svg viewBox="0 0 900 1040" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
          {spec.links.map((link, index) => {
            const fromIndex = nodes.findIndex((node) => node.id === link.from);
            const toIndex = nodes.findIndex((node) => node.id === link.to);
            if (fromIndex < 0 || toIndex < 0) return null;
            const from = pointFor(nodes[fromIndex], fromIndex);
            const to = pointFor(nodes[toIndex], toIndex);
            const entry = interpolate(frame, [index * 7, index * 7 + 24], [0, 1], clamp);
            const pulse = (frame / 46 + index * 0.17) % 1;
            return (
              <g key={`${link.from}-${link.to}`} opacity={entry}>
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={theme.line} strokeWidth="5" />
                <circle
                  cx={interpolate(pulse, [0, 1], [from.x, to.x])}
                  cy={interpolate(pulse, [0, 1], [from.y, to.y])}
                  r="9"
                  fill={theme.accent}
                />
              </g>
            );
          })}
          {nodes.map((node, index) => {
            const point = pointFor(node, index);
            const entry = appear(frame, fps, index * 6);
            return (
              <g key={node.id} opacity={entry} transform={`translate(${point.x} ${point.y}) scale(${interpolate(entry, [0, 1], [0.65, 1])})`}>
                <circle r={node.kind === 'process' || node.kind === 'machine' ? 88 : 70} fill={theme.paper} stroke={nodeColor(node, theme)} strokeWidth="5" />
                <text y="-4" fill={theme.ink} textAnchor="middle" fontSize="28" fontWeight="800">
                  {limitWords(node.label, 2)}
                </text>
                <text y="29" fill={nodeColor(node, theme)} textAnchor="middle" fontSize="18" fontWeight="800">
                  {node.kind.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
        <div style={{position: 'absolute', bottom: 44, left: 48, right: 48, color: theme.muted, fontSize: 27, lineHeight: 1.35}}>
          {spec.links.slice(0, 3).map((link) => link.label).join('  ·  ') || spec.takeHome}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const EquationScene = ({spec, theme, direction, storyboardBeat}: SceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inputs = [...byKind(spec.nodes, 'input'), ...byKind(spec.nodes, 'carrier')].slice(0, 3);
  const operation = preferred(
    spec.nodes,
    (node) => node.kind === 'machine' || node.kind === 'process',
    'process',
  );
  const output = spec.nodes.find((node) => node.kind === 'output');
  const equation = `${inputs.map((node) => node.label).join(' + ') || 'Inputs'} → ${output?.label ?? 'Result'}`;

  return (
    <AbsoluteFill>
      <SceneHeading spec={spec} theme={theme} direction={direction} storyboardBeat={storyboardBeat} />
      <div style={stageStyle(theme, direction)}>
        <div style={{position: 'absolute', left: 48, top: 42, ...labelStyle(theme)}}>
          Build the equation
        </div>
        <div
          style={{
            position: 'absolute',
            top: 150,
            left: 50,
            right: 50,
            minHeight: 250,
            borderRadius: 36,
            padding: '50px 36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(130deg, ${theme.accentAlt}16, ${theme.accent}10)`,
            border: `1px solid ${theme.line}`,
          }}
        >
          {equation.split(/( \+ | → )/).map((part, index) => {
            const entry = appear(frame, fps, index * 8);
            const operator = part.trim() === '+' || part.trim() === '→';
            return (
              <span
                key={`${part}-${index}`}
                style={{
                  color: operator ? theme.accent : theme.ink,
                  fontSize: operator ? 56 : 41,
                  fontWeight: 860,
                  margin: operator ? '0 13px' : 0,
                  opacity: entry,
                  transform: `translateY(${interpolate(entry, [0, 1], [30, 0])}px)`,
                }}
              >
                {part}
              </span>
            );
          })}
        </div>

        <div style={{position: 'absolute', top: 470, left: 58, right: 58}}>
          <div style={{color: theme.accent, fontSize: 22, fontWeight: 820, letterSpacing: '0.1em', textTransform: 'uppercase'}}>
            Operator · {operation?.label ?? 'Transformation'}
          </div>
          <div style={{color: theme.ink, fontSize: 34, lineHeight: 1.22, fontWeight: 760, marginTop: 14}}>
            {operation?.detail ?? spec.objective}
          </div>
        </div>

        <div style={{position: 'absolute', left: 58, right: 58, bottom: 72, display: 'flex', flexDirection: 'column', gap: 18}}>
          {spec.links.slice(0, 4).map((link, index) => {
            const entry = appear(frame, fps, 28 + index * 8);
            return (
              <div key={`${link.from}-${link.to}`} style={{display: 'grid', gridTemplateColumns: '54px 1fr', gap: 18, alignItems: 'center', opacity: entry}}>
                <div style={{width: 52, height: 52, borderRadius: 16, display: 'grid', placeItems: 'center', color: theme.paper, background: theme.accent, fontSize: 20, fontWeight: 900}}>
                  {index + 1}
                </div>
                <div style={{padding: '20px 24px', borderRadius: 22, border: `1px solid ${theme.line}`, color: theme.muted, fontSize: 22, fontWeight: 650}}>
                  {link.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const MathEquationScene = ({spec, theme, direction, storyboardBeat}: SceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const math = spec.mathEquation;
  if (!math?.steps.length) return <EquationScene spec={spec} theme={theme} direction={direction} storyboardBeat={storyboardBeat} />;
  const isExample = storyboardBeat?.role === 'example';
  const startingStep = isExample ? Math.max(0, math.steps.length - 2) : 0;
  const activeStep = Math.min(math.steps.length - 1, startingStep + Math.floor(frame / Math.max(1, fps * 0.9)));

  return (
    <AbsoluteFill>
      <SceneHeading spec={spec} theme={theme} direction={direction} storyboardBeat={storyboardBeat} />
      <div style={stageStyle(theme, direction)}>
        <div style={{position: 'absolute', left: 48, top: 38, ...labelStyle(theme, direction)}}>
          Exact equation · {math.mode}
        </div>
        <div style={{position: 'absolute', left: 46, right: 46, top: 105, bottom: math.variables.length ? 145 : 42, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14}}>
          {math.steps.map((step, index) => {
            const entry = appear(frame, fps, index * 8);
            const isActive = index === activeStep;
            const equationSize = step.expression.length > 72 ? 42 : step.expression.length > 46 ? 44 : step.expression.length > 25 ? 48 : 56;
            const isFutureModelStep = !isExample && index > activeStep;
            return (
              <div key={`${step.expression}-${index}`} data-equation-step={index + 1} data-step-state={isActive ? 'active' : isFutureModelStep ? 'pending' : 'built'} style={{position: 'relative', display: 'grid', gridTemplateColumns: '52px minmax(0, 1fr)', gap: 18, alignItems: 'center', minHeight: 126, border: `1px solid ${isActive ? theme.accent : theme.line}`, borderRadius: direction.id === 'editorial' ? 5 : 25, padding: '18px 22px', opacity: entry * (isFutureModelStep ? .22 : 1), background: isActive ? `${theme.accent}12` : `${theme.ink}06`, transform: `translateY(${interpolate(entry, [0, 1], [30, 0])}px)`}}>
                <div style={{display: 'grid', width: 48, height: 48, placeItems: 'center', borderRadius: 15, color: isActive ? theme.paper : theme.muted, background: isActive ? theme.accent : theme.panel, fontSize: 18, fontWeight: 900}}>
                  {index + 1}
                </div>
                <div style={{minWidth: 0}}>
                  <div style={{overflowWrap: 'anywhere', color: isActive ? theme.ink : theme.muted, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: equationSize, fontWeight: 760, lineHeight: 1.05, letterSpacing: '-0.035em'}}>
                    {step.expression}
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 11, color: theme.muted, fontSize: 22, lineHeight: 1.3}}>
                    <span>{step.explanation}</span>
                    {step.focus ? <span style={{flex: '0 0 auto', borderRadius: 999, padding: '6px 10px', color: theme.accent, background: `${theme.accent}14`, fontSize: 18, fontWeight: 820}}>focus · {step.focus}</span> : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {math.variables.length ? (
          <div style={{position: 'absolute', right: 46, bottom: 40, left: 46, display: 'flex', flexWrap: 'wrap', gap: 9}}>
            {math.variables.map((variable, index) => (
              <div key={`${variable.symbol}-${index}`} style={{display: 'flex', alignItems: 'baseline', gap: 8, border: `1px solid ${theme.line}`, borderRadius: 999, padding: '9px 13px', color: theme.muted, background: theme.paper, fontSize: 18}}>
                <strong style={{color: theme.accent, fontFamily: 'ui-monospace, monospace', fontSize: 24}}>{variable.symbol}</strong>
                <span>{variable.meaning}{variable.unit ? ` · ${variable.unit}` : ''}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

const clampNumber = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

const physicsPoint = (x: number, y: number) => ({
  x: 95 + clampNumber(x) * 710,
  y: 205 + clampNumber(y) * 570,
});

const pointAlongPhysicsPath = (path: PhysicsPath, progress: number) => {
  const t = clampNumber(progress);
  const startX = clampNumber(path.startX);
  const startY = clampNumber(path.startY);
  const endX = clampNumber(path.endX);
  const endY = clampNumber(path.endY);
  if (path.kind === 'static') return physicsPoint(startX, startY);
  if (path.kind === 'circular') {
    const centerX = (startX + endX) / 2;
    const centerY = (startY + endY) / 2;
    const radiusX = Math.max(0.08, Math.abs(endX - startX) / 2);
    const radiusY = Math.max(0.08, Math.abs(endY - startY) / 2);
    return physicsPoint(centerX + Math.cos(t * Math.PI * 2) * radiusX, centerY + Math.sin(t * Math.PI * 2) * radiusY);
  }
  const x = startX + (endX - startX) * t;
  const baseY = startY + (endY - startY) * t;
  if (path.kind === 'parabolic') return physicsPoint(x, baseY - clampNumber(Math.abs(path.curvature)) * 4 * t * (1 - t));
  if (path.kind === 'oscillating') return physicsPoint((startX + endX) / 2 + Math.sin(t * Math.PI * 2 * Math.max(1, path.cycles)) * clampNumber(path.amplitude), baseY);
  if (path.kind === 'sine') return physicsPoint(x, baseY + Math.sin(t * Math.PI * 2 * Math.max(1, path.cycles)) * clampNumber(path.amplitude));
  return physicsPoint(x, baseY);
};

const physicsPathPoints = (path: PhysicsPath) => Array.from({length: 35}, (_, index) => pointAlongPhysicsPath(path, index / 34));

const tangentAlongPhysicsPath = (path: PhysicsPath, progress: number) => {
  const t = clampNumber(progress);
  const deltaX = clampNumber(path.endX) - clampNumber(path.startX);
  const deltaY = clampNumber(path.endY) - clampNumber(path.startY);
  let dx = deltaX;
  let screenDy = deltaY;
  if (path.kind === 'parabolic') screenDy -= clampNumber(Math.abs(path.curvature)) * 4 * (1 - 2 * t);
  if (path.kind === 'circular') {
    const radiusX = Math.max(.08, Math.abs(deltaX) / 2);
    const radiusY = Math.max(.08, Math.abs(deltaY) / 2);
    dx = -Math.sin(t * Math.PI * 2) * radiusX;
    screenDy = Math.cos(t * Math.PI * 2) * radiusY;
  }
  if (path.kind === 'oscillating') {
    dx = Math.cos(t * Math.PI * 2 * Math.max(1, path.cycles)) * Math.max(1, path.cycles) * clampNumber(path.amplitude);
    screenDy = deltaY;
  }
  if (path.kind === 'sine') {
    screenDy += Math.cos(t * Math.PI * 2 * Math.max(1, path.cycles)) * Math.PI * 2 * Math.max(1, path.cycles) * clampNumber(path.amplitude);
  }
  const physicsDy = -screenDy;
  const magnitude = Math.max(.001, Math.hypot(dx, physicsDy));
  return { dx: dx / magnitude, dy: physicsDy / magnitude };
};

const PhysicsBodyGlyph = ({body, point, theme}: {body: PhysicsBody; point: {x: number; y: number}; theme: ThemeTokens}) => {
  const size = 34 + clampNumber(body.size, 0.04, 0.24) * 230;
  const fill = body.shape === 'charge' ? theme.accentAlt : body.shape === 'source' ? theme.warning : theme.accent;
  const labelWidth = Math.min(230, Math.max(116, body.label.length * 19 + 34));
  const labelOnRight = point.x < labelWidth + 82;
  const labelX = labelOnRight ? size * .72 + 14 : -size * .72 - labelWidth - 14;
  return (
    <g data-physics-body={body.id} transform={`translate(${point.x} ${point.y})`}>
      {body.shape === 'block' ? <rect x={-size * 0.72} y={-size * 0.52} width={size * 1.44} height={size * 1.04} rx={12} fill={fill} />
        : body.shape === 'lens' ? <ellipse rx={size * 0.34} ry={size} fill={`${theme.accentAlt}38`} stroke={theme.accentAlt} strokeWidth="5" />
          : body.shape === 'source' ? <path d={`M 0 ${-size * 0.72} L ${size * 0.72} 0 L 0 ${size * 0.72} L ${-size * 0.72} 0 Z`} fill={fill} />
            : <circle r={size * 0.58} fill={fill} />}
      {body.shape === 'charge' ? <text y="9" textAnchor="middle" fill={theme.paper} fontSize="30" fontWeight="900">+</text> : null}
      <rect x={labelX} y="28" width={labelWidth} height="58" rx="16" fill={theme.paper} stroke={theme.line} />
      <text x={labelX + 16} y="68" fill={theme.ink} fontSize="34" fontWeight="800">{limitWords(body.label, 3)}</text>
    </g>
  );
};

const PhysicsDiagramScene = ({spec, theme, direction, storyboardBeat}: SceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const diagram = spec.physicsDiagram;
  if (!diagram?.bodies.length || !diagram.paths.length) return <SpatialProcessScene spec={spec} theme={theme} direction={direction} storyboardBeat={storyboardBeat} />;
  const sceneFrames = Math.max(1, storyboardBeat?.durationInFrames ?? fps * 3.2);
  const progress = storyboardBeat?.role === 'model'
    ? .08
    : interpolate(frame, [0, Math.max(1, sceneFrames - 1)], [0, 1], clamp);
  const pathByBody = new Map(diagram.paths.map((path) => [path.bodyId, path]));
  const pointByBody = new Map(diagram.bodies.map((body) => [body.id, pathByBody.has(body.id) ? pointAlongPhysicsPath(pathByBody.get(body.id)!, progress) : physicsPoint(body.x, body.y)]));
  const wavePhase = progress * Math.PI * 3.2;

  return (
    <AbsoluteFill>
      <SceneHeading spec={spec} theme={theme} direction={direction} storyboardBeat={storyboardBeat} />
      <div style={stageStyle(theme, direction)}>
        <div style={{position: 'absolute', left: 48, top: 38, ...labelStyle(theme, direction)}}>
          Physics diagram · {diagram.kind.replace('-', ' ')}
        </div>
        <svg viewBox="0 0 900 1040" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
          <defs>
            <marker id="physics-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={theme.accent} />
            </marker>
          </defs>

          <g opacity="0.42">
            {Array.from({length: 9}, (_, index) => <line key={`grid-x-${index}`} x1={95 + index * 88.75} y1="205" x2={95 + index * 88.75} y2="775" stroke={theme.line} strokeWidth="1" />)}
            {Array.from({length: 9}, (_, index) => <line key={`grid-y-${index}`} x1="95" y1={205 + index * 71.25} x2="805" y2={205 + index * 71.25} stroke={theme.line} strokeWidth="1" />)}
          </g>

          {diagram.kind === 'circuit' ? <g><rect x="205" y="250" width="490" height="430" rx="56" fill="none" stroke={theme.muted} strokeWidth="7" /><line x1="182" y1="420" x2="230" y2="420" stroke={theme.warning} strokeWidth="9" /><line x1="192" y1="455" x2="220" y2="455" stroke={theme.warning} strokeWidth="5" /><path d="M 470 246 l 18 -22 l 24 44 l 24 -44 l 24 44 l 24 -22" fill="none" stroke={theme.accent} strokeWidth="7" /></g> : null}
          {diagram.kind === 'ray' ? <g><line x1="450" y1="205" x2="450" y2="785" stroke={theme.accentAlt} strokeWidth="5" /><ellipse cx="450" cy="495" rx="28" ry="205" fill={`${theme.accentAlt}22`} stroke={theme.accentAlt} strokeWidth="4" /></g> : null}
          {diagram.kind === 'free-body' ? <line x1="120" y1="690" x2="780" y2="690" stroke={theme.muted} strokeWidth="8" /> : null}
          {diagram.kind === 'wave' ? <polyline points={Array.from({length: 50}, (_, index) => { const x = 105 + index * 14; const y = 505 + Math.sin(index / 49 * Math.PI * 4 - wavePhase) * 95; return `${x},${y}`; }).join(' ')} fill="none" stroke={theme.accentAlt} strokeWidth="6" opacity="0.72" /> : null}

          {diagram.paths.map((path, index) => {
            const points = physicsPathPoints(path);
            return <polyline key={`${path.bodyId}-${index}`} points={points.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke={theme.accentAlt} strokeWidth="5" strokeDasharray="13 12" opacity="0.58" />;
          })}

          {diagram.annotations.map((annotation, index) => {
            const words = annotation.text.trim().split(/\s+/).filter(Boolean).slice(0, 6);
            const lineBreak = Math.max(1, Math.ceil(words.length / 2));
            const lines = [words.slice(0, lineBreak).join(' '), words.slice(lineBreak).join(' ')].filter(Boolean);
            const width = 330;
            const x = index % 2 === 0 ? 95 : 475;
            const y = 835 - Math.floor(index / 2) * 90;
            const entry = appear(frame, fps, 8 + index * 5);
            return (
              <g key={`${annotation.text}-${index}`} opacity={entry}>
                <rect x={x} y={y} width={width} height="84" rx="20" fill={theme.paper} stroke={theme.line} />
                <text x={x + 18} y={y + (lines.length === 1 ? 53 : 35)} fill={theme.muted} fontSize="29" fontWeight="740">
                  {lines.map((line, lineIndex) => <tspan key={line} x={x + 18} dy={lineIndex === 0 ? 0 : 31}>{line}</tspan>)}
                </text>
              </g>
            );
          })}

          {diagram.bodies.map((body) => <PhysicsBodyGlyph key={body.id} body={body} point={pointByBody.get(body.id) ?? physicsPoint(body.x, body.y)} theme={theme} />)}

          {diagram.vectors.map((vector, index) => {
            const origin = pointByBody.get(vector.originId);
            if (!origin) return null;
            const entry = appear(frame, fps, 12 + index * 6);
            const path = pathByBody.get(vector.originId);
            const tangent = vector.quantity === 'velocity' && path ? tangentAlongPhysicsPath(path, progress) : null;
            const vectorDx = tangent?.dx ?? vector.dx;
            const vectorDy = tangent?.dy ?? vector.dy;
            const endX = clampNumber(origin.x + clampNumber(vectorDx, -1, 1) * 170 * entry, 60, 840);
            const endY = clampNumber(origin.y - clampNumber(vectorDy, -1, 1) * 170 * entry, 180, 820);
            const labelWidth = 330;
            const labelX = index % 2 === 0 ? 95 : 475;
            const labelY = 106 + Math.floor(index / 2) * 82;
            const connectorX = labelX + labelWidth / 2;
            const connectorY = labelY + 72;
            return (
              <g key={`${vector.originId}-${vector.label}-${index}`} data-physics-vector={`${vector.originId}-${index}`} opacity={entry}>
                <line x1={origin.x} y1={origin.y} x2={endX} y2={endY} stroke={theme.accent} strokeWidth="7" markerEnd="url(#physics-arrow)" />
                <line x1={endX} y1={endY} x2={connectorX} y2={connectorY} stroke={theme.line} strokeWidth="2" strokeDasharray="7 7" />
                <rect x={labelX} y={labelY} width={labelWidth} height="72" rx="18" fill={theme.paper} stroke={theme.line} />
                <text x={labelX + 18} y={labelY + 47} fill={theme.ink} fontSize="36" fontWeight="800">{limitWords(vector.label, 3)}{vector.magnitudeLabel ? ` · ${vector.magnitudeLabel}` : ''}</text>
              </g>
            );
          })}
        </svg>
        <div style={{position: 'absolute', right: 44, bottom: 38, left: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18}}>
          <span style={{color: theme.muted, fontSize: 34}}>{spec.takeHome}</span>
          <span style={{flex: '0 0 auto', borderRadius: 999, padding: '11px 16px', color: theme.paper, background: theme.accent, fontSize: 30, fontWeight: 900}}>t = {(progress * 3.2).toFixed(1)} s</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const GrammarScene = (props: SceneProps) => {
  switch (props.spec.grammar) {
    case 'energy-transfer':
      return <EnergyTransferScene {...props} />;
    case 'spatial-process':
      return <SpatialProcessScene {...props} />;
    case 'linear-process':
      return <LinearProcessScene {...props} />;
    case 'cycle':
      return <CycleScene {...props} />;
    case 'comparison':
      return <ComparisonScene {...props} />;
    case 'timeline':
      return <TimelineScene {...props} />;
    case 'network':
      return <NetworkScene {...props} />;
    case 'equation':
      return <EquationScene {...props} />;
    case 'math-equation':
      return <MathEquationScene {...props} />;
    case 'physics-diagram':
      return <PhysicsDiagramScene {...props} />;
  }
};

const IntroScene = ({spec, theme, direction, storyboardBeat}: SceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const title = storyboardBeat?.beat.headline ?? spec.title;
  const supportingCopy = storyboardBeat?.beat.body ?? spec.setting;
  const titleWords = title.split(/\s+/);
  const settingEntry = appear(frame, fps, 10);
  const alignItems = direction.id === 'editorial' ? 'center' : 'flex-start';

  return (
    <AbsoluteFill style={{padding: direction.id === 'editorial' ? '180px 96px 220px' : '180px 72px 220px', justifyContent: 'center', alignItems}}>
      {spec.assets?.artImageUrl ? <Img src={spec.assets.artImageUrl} style={{position: 'absolute', inset: direction.id === 'editorial' ? '150px 70px 210px' : '280px -80px 140px 380px', width: direction.id === 'editorial' ? 'auto' : 760, height: direction.id === 'editorial' ? 'auto' : 920, objectFit: 'cover', borderRadius: direction.id === 'editorial' ? 12 : 120, opacity: direction.id === 'editorial' ? .12 : .16, filter: direction.id === 'field-notes' ? 'grayscale(1) contrast(1.25)' : 'saturate(.8) contrast(1.08)', maskImage: 'linear-gradient(to bottom, transparent, black 22%, black 70%, transparent)'}} /> : null}
      <div style={{...labelStyle(theme, direction), color: theme.accent, opacity: settingEntry}}>
        {storyboardBeat?.beat.label ?? `Visual lesson · ${spec.grammar.replace('-', ' ')}`}
      </div>
      <div style={{position: 'relative', maxWidth: direction.id === 'editorial' ? 840 : 920, fontFamily: theme.displayFamily, fontSize: direction.id === 'editorial' ? 82 : direction.id === 'neon-lab' ? 76 : 92, fontWeight: direction.id === 'editorial' ? 650 : 860, fontStyle: direction.id === 'editorial' ? 'italic' : 'normal', lineHeight: direction.id === 'neon-lab' ? 1.05 : .98, letterSpacing: direction.id === 'neon-lab' ? '-.025em' : '-0.06em', marginTop: 30, textAlign: direction.id === 'editorial' ? 'center' : 'left'}}>
        {titleWords.map((word, index) => {
          const entry = appear(frame, fps, 2 + index * 3);
          const rotate = direction.transition === 'snap' ? interpolate(entry, [0, 1], [index % 2 === 0 ? -7 : 7, 0]) : direction.transition === 'sketch' ? interpolate(entry, [0, 1], [-2, .25]) : 0;
          return (
            <span key={`${word}-${index}`} style={{display: 'inline-block', marginRight: 22, opacity: entry, transform: direction.transition === 'scan' ? `translateX(${interpolate(entry, [0, 1], [-42, 0])}px)` : `translateY(${interpolate(entry, [0, 1], [62, 0])}px) rotate(${rotate}deg)`}}>
              {word}
            </span>
          );
        })}
      </div>
      <div
        style={{
          position: 'relative',
          marginTop: 50,
          width: direction.id === 'editorial' ? 690 : 760,
          padding: '26px 30px',
          border: direction.id === 'editorial' ? `1px solid ${theme.line}` : undefined,
          borderLeft: direction.id === 'editorial' ? undefined : `5px ${direction.id === 'field-notes' ? 'dashed' : 'solid'} ${theme.accent}`,
          borderRadius: direction.id === 'editorial' ? 4 : direction.id === 'neon-lab' ? 0 : 18,
          background: direction.id === 'editorial' ? `${theme.panel}CC` : `${theme.ink}08`,
          color: theme.muted,
          fontSize: 29,
          lineHeight: 1.35,
          textAlign: direction.id === 'editorial' ? 'center' : 'left',
          opacity: settingEntry,
          transform: `translateX(${interpolate(settingEntry, [0, 1], [-30, 0])}px)`,
        }}
      >
        {supportingCopy}
      </div>
    </AbsoluteFill>
  );
};

const OutroScene = ({spec, theme, direction, storyboardBeat}: SceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entry = appear(frame, fps, 2);
  const beatFrames = storyboardBeat?.durationInFrames ?? fps * 3;
  const revealStart = Math.min(Math.max(45, fps * 1.5), Math.max(12, beatFrames - 18));
  const reveal = interpolate(frame, [revealStart, Math.max(revealStart + 1, beatFrames - 2)], [0, 1], clamp);
  const prompt = storyboardBeat?.beat.headline ?? 'What will you remember?';
  const supportingCopy = 'Say it in your own words before the payoff appears.';

  return (
    <AbsoluteFill style={{padding: direction.id === 'editorial' ? '210px 100px' : '210px 72px', justifyContent: 'center', textAlign: direction.id === 'editorial' ? 'center' : 'left'}}>
      <div style={{...labelStyle(theme, direction), color: theme.success}}>{storyboardBeat?.beat.label ?? 'Retrieve it'}</div>
      <div
        style={{
          marginTop: 30,
          color: theme.ink,
          fontFamily: theme.displayFamily,
          fontSize: direction.id === 'editorial' ? 68 : 64,
          fontWeight: direction.id === 'editorial' ? 660 : 820,
          fontStyle: direction.id === 'editorial' ? 'italic' : 'normal',
          lineHeight: 1.12,
          letterSpacing: '-0.045em',
          opacity: entry,
          transform: `translateY(${interpolate(entry, [0, 1], [54, 0])}px)`,
        }}
      >
        {prompt}
      </div>
      <div style={{maxWidth: 760, margin: direction.id === 'editorial' ? '28px auto 0' : '28px 0 0', color: theme.muted, fontSize: 27, lineHeight: 1.4, opacity: entry}}>{supportingCopy}</div>
      <div data-answer-reveal style={{maxWidth: 840, margin: direction.id === 'editorial' ? '54px auto 0' : '54px 0 0', border: `${direction.stage.borderWidth}px ${direction.stage.borderStyle} ${theme.accent}`, borderRadius: direction.id === 'editorial' ? 4 : 24, padding: '28px 32px', color: theme.ink, background: direction.id === 'editorial' ? theme.panel : `${theme.accent}12`, fontSize: 32, fontWeight: 780, lineHeight: 1.28, opacity: reveal, transform: `translateY(${interpolate(reveal, [0, 1], [24, 0])}px)`}}>
        <span style={{display: 'block', marginBottom: 9, color: theme.accent, fontSize: 17, letterSpacing: '.13em', textTransform: 'uppercase'}}>Answer / payoff</span>
        {spec.takeHome}
      </div>
      <div style={{height: direction.id === 'editorial' ? 2 : 6, width: interpolate(entry, [0, 1], [0, 360]), borderRadius: 6, background: theme.accent, margin: direction.id === 'editorial' ? '48px auto 0' : '48px 0 0'}} />
    </AbsoluteFill>
  );
};

const AmbientBackground = ({theme, assets, direction, motionDirection}: {theme: ThemeTokens; assets?: MotionAssets; direction: ReelDirectionProfile; motionDirection?: MotionDirection}) => {
  const frame = useCurrentFrame();
  const tempo = motionDirection?.tempo === 'measured' ? .72 : motionDirection?.tempo === 'brisk' ? 1.28 : 1;
  const directedFrame = frame * tempo;
  const glowX = interpolate(Math.sin(directedFrame / 45), [-1, 1], [14, 78]);
  const drift = Math.sin(directedFrame / 34);
  return (
    <AbsoluteFill data-direction-background={direction.background}>
      {assets?.backgroundImageUrl ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(${theme.paper}D9, ${theme.paper}F2), url(${assets.backgroundImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ) : null}
      {direction.background === 'kinetic-shards' ? (
        <>
          <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at ${glowX}% 12%, ${theme.accentAlt}32, transparent 32%), linear-gradient(125deg, transparent 46%, ${theme.accent}0D 46% 54%, transparent 54%)`}} />
          <div style={{position: 'absolute', top: 120 + drift * 24, right: -80, width: 360, height: 360, borderRadius: 86, border: `22px solid ${theme.accent}18`, transform: `rotate(${18 + directedFrame * 0.15}deg)`}} />
          <div style={{position: 'absolute', bottom: 180, left: -110 + drift * 18, width: 310, height: 190, background: theme.accentAlt, opacity: .07, clipPath: 'polygon(0 30%, 100% 0, 78% 100%, 12% 82%)', transform: 'rotate(-12deg)'}} />
        </>
      ) : null}
      {direction.background === 'editorial-paper' ? (
        <>
          <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at 18% 12%, ${theme.accentAlt}16, transparent 30%), repeating-radial-gradient(circle at 0 0, ${theme.ink}0A 0 1px, transparent 1px 7px)`}} />
          <div style={{position: 'absolute', top: 0, bottom: 0, left: 126, width: 2, background: `${theme.accent}38`}} />
          <div style={{position: 'absolute', right: 58, bottom: 54, color: `${theme.ink}4A`, fontFamily: theme.displayFamily, fontSize: 22, fontStyle: 'italic'}}>ReelLearn folio</div>
        </>
      ) : null}
      {direction.background === 'field-contours' ? (
        <>
          <div style={{position: 'absolute', inset: 0, opacity: .24, backgroundImage: `repeating-linear-gradient(0deg, transparent 0 63px, ${theme.line} 64px 65px)`}} />
          {[0, 1, 2].map((index) => <div key={index} style={{position: 'absolute', right: -110 + index * 42, top: 180 + index * 78 + drift * 10, width: 430 - index * 65, height: 300 - index * 42, border: `3px ${index === 1 ? 'dashed' : 'solid'} ${theme.accentAlt}24`, borderRadius: '46% 54% 58% 42%', transform: `rotate(${-8 + index * 11}deg)`}} />)}
          <div style={{position: 'absolute', left: 46, bottom: 92, color: `${theme.accent}66`, fontSize: 40, letterSpacing: '.45em'}}>+ + +</div>
        </>
      ) : null}
      {direction.background === 'neon-grid' ? (
        <>
          <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at ${glowX}% 12%, ${theme.accentAlt}24, transparent 33%), radial-gradient(circle at 88% 88%, ${theme.accent}12, transparent 34%)`}} />
          <div style={{position: 'absolute', inset: 0, opacity: .2, backgroundImage: `linear-gradient(${theme.line} 1px, transparent 1px), linear-gradient(90deg, ${theme.line} 1px, transparent 1px)`, backgroundSize: '86px 86px', maskImage: 'linear-gradient(to bottom, black, transparent 72%)'}} />
          <div style={{position: 'absolute', right: 0, left: 0, top: `${(directedFrame * 5) % 1920}px`, height: 2, background: `linear-gradient(90deg, transparent, ${theme.accent}66, transparent)`, boxShadow: `0 0 16px ${theme.accent}44`}} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

const ProgressRail = ({theme, direction, storyboard}: {theme: ThemeTokens; direction: ReelDirectionProfile; storyboard: StoryboardBeat[]}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const progress = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 100], clamp);
  const railHeight = direction.id === 'editorial' ? 2 : direction.id === 'field-notes' ? 4 : 6;
  return (
    <div data-progress-variant={direction.id} style={{position: 'absolute', left: direction.id === 'editorial' ? 100 : 68, right: direction.id === 'editorial' ? 100 : 68, bottom: 58, height: railHeight, borderRadius: direction.id === 'neon-lab' ? 0 : 8, background: theme.line}}>
      <div style={{height: '100%', width: `${progress}%`, borderRadius: 'inherit', background: direction.id === 'editorial' ? theme.ink : direction.id === 'field-notes' ? theme.accent : `linear-gradient(90deg, ${theme.accentAlt}, ${theme.accent})`}} />
      {storyboard.slice(1).map((beat) => <span key={beat.role} style={{position: 'absolute', top: -4, left: `${(beat.startFrame / durationInFrames) * 100}%`, width: 2, height: railHeight + 8, background: direction.id === 'editorial' ? theme.accent : theme.ink, opacity: .48}} />)}
    </div>
  );
};

const NarrativeCaption = ({storyboard, theme, direction}: {storyboard: StoryboardBeat[]; theme: ThemeTokens; direction: ReelDirectionProfile}) => {
  const frame = useCurrentFrame();
  const active = activeStoryboardBeat(storyboard, frame);
  const beatIndex = storyboard.findIndex((beat) => beat.role === active.role);
  const localFrame = frame - active.startFrame;
  const fadeFrames = Math.min(10, Math.max(4, Math.floor(active.durationInFrames * .12)));
  const recallRevealStart = Math.min(45, Math.max(12, active.durationInFrames - 18));
  const captionCopy = active.role === 'recall' && localFrame < recallRevealStart
    ? 'Answer aloud before the payoff appears.'
    : active.beat.body;
  const opacity = interpolate(
    localFrame,
    [0, fadeFrames, Math.max(fadeFrames + 1, active.durationInFrames - fadeFrames), active.durationInFrames],
    [0, 1, 1, 0],
    clamp,
  );
  const isEditorial = direction.caption === 'folio';
  const isNote = direction.caption === 'note';
  const isTerminal = direction.caption === 'terminal';
  const captionWords = limitWords(captionCopy, 22).split(/\s+/).filter(Boolean);
  const activeWordIndex = pacedCaptionWordIndex(localFrame, active.durationInFrames, captionWords.length);

  return (
    <div
      data-caption-variant={direction.caption}
      style={{
        position: 'absolute',
        zIndex: 20,
        left: isEditorial ? 100 : direction.caption === 'impact' ? 54 : 68,
        right: isEditorial ? 100 : isNote ? 120 : 68,
        bottom: 220,
        display: 'grid',
        gridTemplateColumns: isEditorial ? '118px 1fr' : '142px 1fr',
        gap: 20,
        alignItems: 'center',
        minHeight: 88,
        border: `${direction.caption === 'impact' ? 2 : 1}px ${isNote ? 'dashed' : 'solid'} ${direction.caption === 'impact' ? theme.accent : theme.line}`,
        borderTop: isEditorial ? `2px solid ${theme.ink}` : undefined,
        borderBottom: isEditorial ? `2px solid ${theme.ink}` : undefined,
        borderRadius: isEditorial || isTerminal ? 0 : isNote ? 8 : 24,
        padding: '16px 24px',
        color: theme.ink,
        background: isEditorial ? `${theme.panel}F2` : `${theme.paper}F0`,
        boxShadow: isEditorial ? 'none' : '0 18px 44px rgba(0,0,0,.28)',
        opacity,
        transform: isNote ? 'rotate(.35deg)' : direction.caption === 'impact' ? 'rotate(-.25deg)' : undefined,
        fontFamily: isTerminal ? theme.displayFamily : theme.fontFamily,
      }}
    >
      <div>
        <div style={{color: theme.accent, fontSize: 26, fontWeight: 820, letterSpacing: '.12em', textTransform: 'uppercase'}}>
          {String(beatIndex + 1).padStart(2, '0')} / {String(storyboard.length).padStart(2, '0')}
        </div>
        <div style={{marginTop: 5, color: theme.muted, fontSize: 20, fontWeight: 760, textTransform: 'uppercase'}}>
          {active.role}
        </div>
      </div>
      <div>
        <div data-caption-timing="beat-paced" style={{fontFamily: isTerminal ? theme.displayFamily : theme.fontFamily, color: theme.ink, fontSize: isEditorial ? 34 : 36, fontWeight: isEditorial ? 620 : 670, fontStyle: isEditorial ? 'italic' : 'normal', lineHeight: 1.28, letterSpacing: '-.01em'}}>
          {captionWords.map((word, index) => {
            const isActiveWord = index === activeWordIndex;
            const isReadWord = index < activeWordIndex;
            return (
              <span
                key={`${word}-${index}`}
                data-caption-word-state={isActiveWord ? 'active' : isReadWord ? 'read' : 'upcoming'}
                style={{
                  display: 'inline-block',
                  marginRight: 9,
                  color: isActiveWord ? theme.accent : isReadWord ? theme.ink : theme.muted,
                  opacity: isActiveWord ? 1 : isReadWord ? .92 : .48,
                  transform: `translateY(${isActiveWord ? -2 : 0}px) scale(${isActiveWord ? 1.04 : 1})`,
                  textShadow: isActiveWord && !isEditorial ? `0 0 20px ${theme.accent}55` : 'none',
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Wordmark = ({theme, direction}: {theme: ThemeTokens; direction: ReelDirectionProfile}) => (
  <div
    data-wordmark-variant={direction.id}
    style={{
      position: 'absolute',
      left: direction.id === 'editorial' ? 100 : 68,
      top: 30,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      color: theme.ink,
      fontFamily: theme.displayFamily,
      fontSize: direction.id === 'editorial' ? 23 : 20,
      fontWeight: direction.id === 'editorial' ? 650 : 820,
      fontStyle: direction.id === 'editorial' ? 'italic' : 'normal',
      letterSpacing: direction.id === 'neon-lab' ? '.08em' : '-0.02em',
    }}
  >
    <div style={{width: 29, height: 29, borderRadius: direction.id === 'kinetic' ? 8 : direction.id === 'editorial' ? '50%' : direction.id === 'field-notes' ? 2 : 0, border: direction.id === 'field-notes' || direction.id === 'neon-lab' ? `2px solid ${theme.accent}` : 0, background: direction.id === 'field-notes' || direction.id === 'neon-lab' ? 'transparent' : theme.accent, display: 'grid', placeItems: 'center', color: direction.id === 'field-notes' || direction.id === 'neon-lab' ? theme.accent : theme.paper, fontSize: 16, transform: direction.id === 'kinetic' ? 'rotate(-8deg)' : undefined}}>R</div>
    ReelLearn
  </div>
);

const Layer = ({children}: {children: ReactNode}) => <>{children}</>;

const DirectedScene = ({direction, beat, theme, motionDirection, children}: {direction: ReelDirectionProfile; beat: StoryboardBeat; theme: ThemeTokens; motionDirection?: MotionDirection; children: ReactNode}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const baseConfig = direction.transition === 'snap' ? {damping: 15, stiffness: 210, mass: .7} : direction.transition === 'sketch' ? {damping: 22, stiffness: 105, mass: 1} : {damping: 20, stiffness: 135, mass: .9};
  const energy = motionDirection?.transitionEnergy === 'gentle'
    ? {damping: 1.18, stiffness: .78, mass: 1.08}
    : motionDirection?.transitionEnergy === 'punchy'
      ? {damping: .86, stiffness: 1.24, mass: .86}
      : {damping: 1, stiffness: 1, mass: 1};
  const tempo = motionDirection?.tempo === 'measured' ? .84 : motionDirection?.tempo === 'brisk' ? 1.18 : 1;
  const entry = spring({frame: frame * tempo, fps, config: {damping: baseConfig.damping * energy.damping, stiffness: baseConfig.stiffness * energy.stiffness, mass: baseConfig.mass * energy.mass}});
  const transform = direction.transition === 'snap'
    ? `translateX(${interpolate(entry, [0, 1], [beat.role === 'example' ? 90 : -90, 0])}px) rotate(${interpolate(entry, [0, 1], [beat.role === 'example' ? 2.5 : -2.5, 0])}deg)`
    : direction.transition === 'folio'
      ? `translateY(${interpolate(entry, [0, 1], [42, 0])}px)`
      : direction.transition === 'sketch'
        ? `translate(${interpolate(entry, [0, 1], [-28, 0])}px, ${interpolate(entry, [0, 1], [24, 0])}px) rotate(${interpolate(entry, [0, 1], [-.8, 0])}deg)`
        : `scaleY(${interpolate(entry, [0, 1], [.94, 1])})`;
  return (
    <AbsoluteFill data-beat-role={beat.role} data-visual-kind={beat.visualKind} data-direction-id={direction.id} data-motion-tempo={motionDirection?.tempo ?? 'balanced'} data-transition-energy={motionDirection?.transitionEnergy ?? 'balanced'}>
      <AbsoluteFill style={{opacity: entry, transform, transformOrigin: '50% 48%'}}>{children}</AbsoluteFill>
      {(beat.role === 'model' || beat.role === 'example') ? <div style={{position: 'absolute', zIndex: 18, top: 186, right: direction.stage.right, display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${theme.line}`, borderRadius: direction.id === 'editorial' ? 2 : 999, padding: '7px 11px', color: theme.muted, background: `${theme.paper}D9`, fontSize: 16, fontWeight: 820, letterSpacing: '.1em', textTransform: 'uppercase'}}>{beat.role === 'model' ? 'Build · 02' : 'Apply · 03'}</div> : null}
    </AbsoluteFill>
  );
};

export const EducationalReel = ({
  spec,
  theme: reelTheme,
  directionId,
  audioUrl,
}: EducationalReelProps) => {
  const {durationInFrames} = useVideoConfig();
  const theme = resolveTheme(spec.theme, reelTheme);
  const direction = resolveReelDirection(directionId);
  const assets = spec.assets;
  const storyboard = buildStoryboard(spec, durationInFrames);

  return (
    <AbsoluteFill
      data-reel-direction={direction.id}
      style={{
        background: theme.paper,
        color: theme.ink,
        fontFamily: theme.fontFamily,
        overflow: 'hidden',
      }}
    >
      <AmbientBackground theme={theme} assets={assets} direction={direction} motionDirection={spec.motionDirection} />
      {audioUrl ? <Audio src={audioUrl} /> : null}

      <Series>
        {storyboard.map((beat) => (
          <Series.Sequence key={beat.role} durationInFrames={beat.durationInFrames} name={`${beat.role} · ${beat.visualKind}`}>
            <DirectedScene direction={direction} beat={beat} theme={theme} motionDirection={spec.motionDirection}>
              {beat.role === 'hook'
                ? <IntroScene spec={spec} theme={theme} direction={direction} storyboardBeat={beat} />
                : beat.role === 'recall'
                  ? <OutroScene spec={spec} theme={theme} direction={direction} storyboardBeat={beat} />
                  : <GrammarScene spec={spec} theme={theme} direction={direction} storyboardBeat={beat} />}
            </DirectedScene>
          </Series.Sequence>
        ))}
      </Series>

      <Sequence from={0} durationInFrames={durationInFrames} name="ReelLearn chrome">
        <Layer>
          <Wordmark theme={theme} direction={direction} />
          <NarrativeCaption storyboard={storyboard} theme={theme} direction={direction} />
          <ProgressRail theme={theme} direction={direction} storyboard={storyboard} />
        </Layer>
      </Sequence>
    </AbsoluteFill>
  );
};
