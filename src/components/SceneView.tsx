// Procedural cozy scenes drawn in SVG. Each scene's elements fade in as
// `progress` (fraction of safe cells revealed) rises, so clearing the board
// gradually uncovers the picture. No raster assets, so theme packs stay cheap.

interface SceneProps {
  sceneId: string;
  progress: number; // 0..1
  className?: string;
}

// Opacity for an element that should appear once progress passes `at`.
function fade(progress: number, at: number, span = 0.12): number {
  if (progress >= at) return 1;
  const start = at - span;
  if (progress <= start) return 0;
  return (progress - start) / span;
}

export function SceneView({ sceneId, progress, className }: SceneProps) {
  return (
    <svg
      viewBox="0 0 320 200"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {sceneId === 'meadow' && <Meadow p={progress} />}
      {sceneId === 'windowsill' && <Windowsill p={progress} />}
      {sceneId === 'campsite' && <Campsite p={progress} />}
    </svg>
  );
}

function Meadow({ p }: { p: number }) {
  return (
    <g>
      <rect x="0" y="0" width="320" height="200" fill="#bfe3ef" />
      <rect x="0" y="0" width="320" height="120" fill="#d7eef4" opacity={fade(p, 0.05)} />
      <circle cx="262" cy="48" r="26" fill="#f7c873" opacity={fade(p, 0.2)} />
      <circle cx="262" cy="48" r="34" fill="#f7c873" opacity={fade(p, 0.35) * 0.25} />
      <ellipse cx="70" cy="46" rx="34" ry="14" fill="#ffffff" opacity={fade(p, 0.45) * 0.9} />
      <ellipse cx="98" cy="40" rx="26" ry="12" fill="#ffffff" opacity={fade(p, 0.55) * 0.9} />
      <path d="M0 140 Q80 118 160 134 T320 128 V200 H0 Z" fill="#8fc06a" opacity={fade(p, 0.15)} />
      <path d="M0 162 Q90 146 180 160 T320 156 V200 H0 Z" fill="#6fa84f" opacity={fade(p, 0.3)} />
      <rect x="0" y="180" width="320" height="20" fill="#5b9142" opacity={fade(p, 0.3)} />
      {[40, 92, 150, 210, 268].map((x, i) => (
        <g
          key={x}
          opacity={fade(p, 0.6 + i * 0.06)}
          transform={`translate(${x},${168 - (i % 2) * 6})`}
        >
          <line x1="0" y1="0" x2="0" y2="16" stroke="#3f6f2e" strokeWidth="2" />
          <circle
            cx="0"
            cy="-2"
            r="5"
            fill={['#f06a8a', '#f6b73c', '#c98bd6', '#ef7d63', '#f4d04a'][i]}
          />
          <circle cx="0" cy="-2" r="2" fill="#fff7e0" />
        </g>
      ))}
    </g>
  );
}

function Windowsill({ p }: { p: number }) {
  return (
    <g>
      <rect x="0" y="0" width="320" height="200" fill="#243049" />
      <rect x="36" y="20" width="248" height="150" rx="8" fill="#7fa9c9" opacity={fade(p, 0.1)} />
      <rect
        x="36"
        y="20"
        width="248"
        height="150"
        rx="8"
        fill="#9cc2dc"
        opacity={fade(p, 0.25) * 0.5}
      />
      {[...Array(7)].map((_, i) => (
        <line
          key={i}
          x1={60 + i * 30}
          y1={28}
          x2={40 + i * 30}
          y2={162}
          stroke="#cfe3f0"
          strokeWidth="1.4"
          opacity={fade(p, 0.4 + i * 0.04) * 0.7}
        />
      ))}
      <rect x="28" y="166" width="264" height="14" rx="3" fill="#caa06a" opacity={fade(p, 0.15)} />
      <rect x="150" y="20" width="20" height="150" fill="#2e3c57" opacity={fade(p, 0.2)} />
      <rect x="36" y="92" width="248" height="12" fill="#2e3c57" opacity={fade(p, 0.2)} />
      <g opacity={fade(p, 0.55)} transform="translate(86,150)">
        <path d="M-14 16 L-10 -2 H10 L14 16 Z" fill="#d98a5a" />
        <path d="M0 -2 C-18 -22 -6 -34 0 -22 C6 -34 18 -22 0 -2" fill="#5fa15a" />
        <path d="M0 -2 C-12 -16 -2 -30 0 -18 C2 -30 12 -16 0 -2" fill="#6fb86a" />
      </g>
      <g opacity={fade(p, 0.78)} transform="translate(214,150)">
        <ellipse cx="0" cy="6" rx="22" ry="10" fill="#1c2740" />
        <path d="M-16 6 C-18 -10 -6 -16 0 -14 C6 -16 18 -10 16 6 Z" fill="#26324b" />
        <circle cx="-6" cy="-6" r="2" fill="#f7c873" />
        <circle cx="6" cy="-6" r="2" fill="#f7c873" />
      </g>
    </g>
  );
}

function Campsite({ p }: { p: number }) {
  return (
    <g>
      <rect x="0" y="0" width="320" height="200" fill="#1b2440" />
      <rect x="0" y="0" width="320" height="140" fill="#2a2350" opacity={fade(p, 0.05)} />
      {[
        [40, 30],
        [88, 22],
        [150, 40],
        [210, 26],
        [266, 34],
        [120, 64],
        [248, 70],
        [300, 50],
      ].map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i % 3 === 0 ? 1.8 : 1.1}
          fill="#fdf6d8"
          opacity={fade(p, 0.25 + i * 0.05)}
        />
      ))}
      <circle cx="270" cy="40" r="16" fill="#f4ecc6" opacity={fade(p, 0.3)} />
      <path d="M0 150 L70 96 L150 150 Z" fill="#20305a" opacity={fade(p, 0.18)} />
      <path d="M120 150 L210 86 L300 150 Z" fill="#1a2950" opacity={fade(p, 0.25)} />
      <rect x="0" y="148" width="320" height="52" fill="#15203a" opacity={fade(p, 0.2)} />
      <g opacity={fade(p, 0.5)} transform="translate(96,150)">
        <path d="M-26 0 L0 -40 L26 0 Z" fill="#c66a4a" />
        <path d="M0 -40 L0 0 L-26 0 Z" fill="#a8543a" />
        <path d="M-3 0 L0 -34 L3 0 Z" fill="#1b2440" />
      </g>
      <g opacity={fade(p, 0.72)} transform="translate(210,146)">
        <path d="M0 0 L-8 -10 L0 -4 L8 -12 L4 0 Z" fill="#f6a23c" />
        <path d="M0 2 L-5 -6 L0 -2 L5 -8 L2 2 Z" fill="#f6d24c" />
        <ellipse cx="0" cy="6" rx="16" ry="4" fill="#7a3a1a" opacity="0.6" />
      </g>
      <g opacity={fade(p, 0.72) * 0.6}>
        <circle cx="210" cy="120" r="44" fill="#f6a23c" opacity="0.08" />
      </g>
    </g>
  );
}
