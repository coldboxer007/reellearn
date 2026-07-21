interface SceneProps {
  id: string;
  accent: string;
  progress: number;
  t: number;
  active: boolean;
}

export function ReelScene({ id, accent, progress, t, active }: SceneProps) {
  const phase = (t * 0.4) % (Math.PI * 2);
  const curve = Math.sin(phase) * 32;
  const dot = 0.1 + progress * 0.78;
  const pulse = 0.75 + Math.sin(t * 2.4) * 0.25;
  const draw = Math.min(progress * 1.4, 1);

  return (
    <svg className="reel-viz" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={accent} stopOpacity="0.2" />
          <stop offset="50%" stopColor={accent} stopOpacity="1" />
          <stop offset="100%" stopColor="#E8C45A" stopOpacity="0.95" />
        </linearGradient>
        <radialGradient id={`glow-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E8C45A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#E8C45A" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soft chalk grid */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={`h${i}`}
          x1="120"
          y1={780 + i * 100}
          x2="960"
          y2={780 + i * 100}
          stroke="rgba(236,232,224,0.05)"
          strokeWidth="1"
        />
      ))}

      {/* Axes */}
      <line x1="160" y1="740" x2="160" y2="1280" stroke="rgba(236,232,224,0.22)" strokeWidth="2.5" />
      <line x1="160" y1="1280" x2="940" y2="1280" stroke="rgba(236,232,224,0.22)" strokeWidth="2.5" />

      {/* Tick marks */}
      {[0, 1, 2, 3].map((i) => (
        <line
          key={`t${i}`}
          x1={160 + (i + 1) * 180}
          y1="1280"
          x2={160 + (i + 1) * 180}
          y2="1292"
          stroke="rgba(236,232,224,0.25)"
          strokeWidth="2"
        />
      ))}

      {/* Curve */}
      <path
        d={`M 180 1140 C 360 ${1060 + curve}, 560 ${860 - curve}, 760 ${720 + curve * 0.3} S 900 680, 920 660`}
        fill="none"
        stroke={`url(#g-${id})`}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray="1050"
        strokeDashoffset={1050 - draw * 1050}
      />

      {/* Secant ghost */}
      <line
        x1="220"
        y1="1100"
        x2="520"
        y2={900 - curve * 0.4}
        stroke={accent}
        strokeWidth="2"
        strokeDasharray="8 10"
        opacity={0.25 + progress * 0.2}
      />

      {/* Traveling point + glow */}
      <circle
        cx={180 + dot * 740}
        cy={1140 - dot * 460 + Math.sin(dot * 6) * 16}
        r={28}
        fill={`url(#glow-${id})`}
        opacity={active ? 1 : 0.4}
      />
      <circle
        cx={180 + dot * 740}
        cy={1140 - dot * 460 + Math.sin(dot * 6) * 16}
        r={8 + pulse * 2}
        fill="#E8C45A"
        opacity={active ? 1 : 0.5}
      />

      {/* Result box — slate signature */}
      <g opacity={progress > 0.55 ? Math.min((progress - 0.55) * 3.5, 1) : 0}>
        <rect x="600" y="520" width="310" height="110" rx="4" fill="rgba(14,16,20,0.45)" stroke="#E8C45A" strokeWidth="3" />
        <text x="755" y="575" textAnchor="middle" fill="#ECE8E0" fontSize="28" fontFamily="Georgia, serif" opacity="0.55">
          result
        </text>
        <text x="755" y="612" textAnchor="middle" fill="#ECE8E0" fontSize="42" fontFamily="Georgia, serif">
          lim → L
        </text>
      </g>
    </svg>
  );
}

export function LedgerScene({ id, accent, progress, t, active }: SceneProps) {
  const value = Math.round(progress * 100);
  const barH = 80 + progress * 220;

  return (
    <svg className="reel-viz" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`bar-${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={accent} stopOpacity="0.3" />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
      </defs>
      {/* Hairline grid */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1="100" y1={700 + i * 90} x2="980" y2={700 + i * 90} stroke="rgba(236,232,224,0.06)" strokeWidth="1" />
      ))}
      <text
        x="540"
        y="620"
        textAnchor="middle"
        fill="#ECE8E0"
        fontSize={120 + Math.sin(t * 2) * 2}
        fontFamily="Syne, sans-serif"
        fontWeight="800"
        opacity={active ? 1 : 0.7}
      >
        {value}
        <tspan fontSize="48" dy="-48">%</tspan>
      </text>
      <text x="540" y="680" textAnchor="middle" fill="rgba(236,232,224,0.45)" fontSize="22" fontFamily="IBM Plex Sans, sans-serif" letterSpacing="4">
        STATIONARITY BAND
      </text>
      {[0, 1, 2, 3].map((i) => {
        const h = barH * (0.45 + i * 0.18);
        return (
          <rect
            key={i}
            x={200 + i * 180}
            y={1280 - h}
            width={100}
            height={h}
            fill={i === 2 ? `url(#bar-${id})` : 'rgba(236,232,224,0.1)'}
          />
        );
      })}
      <line x1="160" y1="1280" x2="920" y2="1280" stroke="rgba(236,232,224,0.3)" strokeWidth="2" />
    </svg>
  );
}
