// Time-of-day corner motifs — delicate single-line botanical art in the
// language of the landing page's corner leaf. One motif is chosen by the
// current hour and shown in BOTH the public landing corner and the CRM
// dashboard hero, so the two surfaces always match and shift through the day.

const MotifSprout = () => (
  <g>
    <path d="M14 206 C 14 130, 40 70, 104 36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".55"/>
    <path d="M104 36 C 70 44, 44 70, 36 104 C 74 100, 100 74, 104 36 Z" fill="currentColor" opacity=".10"/>
    <path d="M104 36 C 70 44, 44 70, 36 104" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".5"/>
    <path d="M36 150 C 24 134, 24 112, 38 100 C 50 116, 50 138, 36 150 Z" fill="currentColor" opacity=".10"/>
    <path d="M36 150 C 24 134, 24 112, 38 100" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".45"/>
    <circle cx="150" cy="60" r="3" fill="currentColor" opacity=".4"/>
    <circle cx="176" cy="96" r="2" fill="currentColor" opacity=".3"/>
  </g>
);

const MotifBloom = () => (
  <g>
    <path d="M22 206 C 32 152, 62 120, 96 90" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".5"/>
    <g transform="translate(96 84)">
      {[0, 72, 144, 216, 288].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <ellipse cx="0" cy="-22" rx="11" ry="22" fill="currentColor" opacity=".10"/>
          <ellipse cx="0" cy="-22" rx="11" ry="22" fill="none" stroke="currentColor" strokeWidth="1.1" opacity=".42"/>
        </g>
      ))}
      <circle r="7" fill="currentColor" opacity=".22"/>
    </g>
    <path d="M58 152 C 46 144, 44 128, 56 118 C 64 130, 66 144, 58 152 Z" fill="currentColor" opacity=".10"/>
    <path d="M58 152 C 46 144, 44 128, 56 118" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity=".4" fill="none"/>
    <circle cx="160" cy="70" r="3" fill="currentColor" opacity=".35"/>
    <circle cx="182" cy="104" r="2" fill="currentColor" opacity=".28"/>
  </g>
);

const MotifReeds = () => (
  <g>
    <g stroke="currentColor" fill="none" strokeLinecap="round">
      <path d="M40 206 C 44 150, 56 110, 80 70" strokeWidth="1.4" opacity=".5"/>
      <path d="M72 206 C 78 156, 94 120, 118 88" strokeWidth="1.2" opacity=".42"/>
      <path d="M106 206 C 114 162, 130 130, 152 104" strokeWidth="1" opacity=".34"/>
    </g>
    <ellipse cx="80" cy="64" rx="6" ry="15" fill="currentColor" opacity=".12" transform="rotate(-20 80 64)"/>
    <ellipse cx="118" cy="82" rx="5" ry="13" fill="currentColor" opacity=".10" transform="rotate(-16 118 82)"/>
    <circle cx="170" cy="120" r="2.4" fill="currentColor" opacity=".3"/>
    <circle cx="150" cy="150" r="1.6" fill="currentColor" opacity=".25"/>
  </g>
);

const MotifNight = () => (
  <g>
    <path d="M70 116 A 34 34 0 1 0 70 184 A 26 26 0 1 1 70 116 Z" fill="currentColor" opacity=".10"/>
    <path d="M70 116 A 34 34 0 1 0 70 184 A 26 26 0 1 1 70 116 Z" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".5"/>
    <path d="M124 206 C 128 176, 138 156, 154 142" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity=".4"/>
    <path d="M154 142 C 144 138, 134 142, 132 150 C 142 153, 150 150, 154 142 Z" fill="currentColor" opacity=".10"/>
    <circle cx="150" cy="58" r="2.4" fill="currentColor" opacity=".42"/>
    <circle cx="180" cy="92" r="1.8" fill="currentColor" opacity=".32"/>
    <circle cx="116" cy="92" r="1.4" fill="currentColor" opacity=".3"/>
    <g stroke="currentColor" strokeWidth=".8" opacity=".42" strokeLinecap="round">
      <path d="M150 50 v14 M143 57 h14"/>
    </g>
  </g>
);

// Each block: motif + a calm accent that nudges the hue toward the time of day.
// Low chroma throughout so the four read as one quiet family.
const TIME_MOTIFS = [
  { id: 'morning', from: 5,  Motif: MotifSprout, accent: 'oklch(0.60 0.050 155)', label: 'صبح' },
  { id: 'midday',  from: 11, Motif: MotifBloom,  accent: 'oklch(0.62 0.052 95)',  label: 'ظهر' },
  { id: 'evening', from: 16, Motif: MotifReeds,  accent: 'oklch(0.60 0.058 38)',  label: 'عصر' },
  { id: 'night',   from: 20, Motif: MotifNight,  accent: 'oklch(0.56 0.050 285)', label: 'شب' },
];

const timeMotif = (date = new Date()) => {
  const h = date.getHours();
  if (h >= 20 || h < 5) return TIME_MOTIFS[3];
  if (h >= 16) return TIME_MOTIFS[2];
  if (h >= 11) return TIME_MOTIFS[1];
  return TIME_MOTIFS[0];
};

// Drop-in <svg> wrapper — pass a className for positioning (.lp-min-corner,
// .dash-hero-motif). Repaints itself when the time block changes.
const TimeMotif = ({ className }) => {
  const [m, setM] = React.useState(timeMotif());
  React.useEffect(() => {
    const tick = () => setM(timeMotif());
    const t = setInterval(tick, 60 * 1000);
    return () => clearInterval(t);
  }, []);
  const Motif = m.Motif;
  return (
    <svg
      className={className}
      viewBox="0 0 220 220"
      fill="none"
      aria-hidden="true"
      style={{ color: m.accent }}>
      <Motif />
    </svg>
  );
};

Object.assign(window, { TIME_MOTIFS, timeMotif, TimeMotif });
