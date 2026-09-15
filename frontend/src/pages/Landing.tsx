import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Cpu, Zap, Shield, BarChart3, Globe } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ==================== HERO (illustration fills it) ==================== */}
      <section className="relative h-screen min-h-[720px] w-full overflow-hidden">
        <HeroIllustration />

        {/* NAV */}
        <nav className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-6 py-5 md:px-14">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-2xl font-bold tracking-tight text-slate-900">UrjaCast</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/how-it-works')}
              className="hidden text-sm font-medium text-slate-700 transition hover:text-emerald-700 md:block"
            >
              How it works
            </button>
            <button
              onClick={() => navigate('/login')}
              className="rounded-full border border-slate-200 bg-white/80 px-5 py-2 text-sm font-medium text-slate-900 backdrop-blur-sm transition hover:bg-white"
            >
              Sign in
            </button>
          </div>
        </nav>

        {/* HEADLINE OVERLAY */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <h1 className="mx-auto max-w-5xl text-5xl font-extrabold leading-[1.03] tracking-[-0.03em] text-slate-900 md:text-7xl">
            Renewable energy,
            <br />
            <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500 bg-clip-text text-transparent">
              forecast by site.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-700 md:text-xl">
            UrjaCast turns weather forecasts into site-level renewable generation
            forecasts — and those forecasts into clear, actionable grid decisions.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/40"
            >
              Launch live demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => navigate('/how-it-works')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-7 py-3.5 text-base font-semibold text-slate-900 backdrop-blur-sm transition hover:bg-white"
            >
              How it works
            </button>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ==================== STATS ==================== */}
      <section className="border-y border-slate-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-8 py-10 md:grid-cols-4 md:px-14">
          {[
            { k: '72h', v: 'Forecast horizon' },
            { k: '4 levels', v: 'State → Panchayat' },
            { k: 'Gujarat', v: 'Pilot region' },
            { k: 'Physics + ML', v: 'Not a black box' },
          ].map((s) => (
            <div key={s.k}>
              <div className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                {s.k}
              </div>
              <div className="mt-1 text-sm text-slate-500">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== FEATURES ==================== */}
      <section className="mx-auto max-w-7xl px-8 py-20 md:px-14">
        <div className="mb-12 max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Built for the field
          </div>
          <h2 className="mt-3 text-4xl font-extrabold leading-[1.1] tracking-[-0.02em] text-slate-900 md:text-5xl">
            Every number traceable.
            <br />
            Every decision explainable.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Feature
            icon={<MapPin className="h-5 w-5" />}
            title="Site-aware, not region-aware"
            body="Every site is resolved to its exact State → District → Block → Panchayat context before any forecast runs."
          />
          <Feature
            icon={<Cpu className="h-5 w-5" />}
            title="Physics first, ML second"
            body="A physical PV or turbine baseline anchors the model. XGBoost corrects the residual — not the whole thing."
          />
          <Feature
            icon={<Zap className="h-5 w-5" />}
            title="Forecast becomes action"
            body="Surplus and shortfall windows are converted into storage, load-shift, backup, and curtailment guidance."
          />
          <Feature
            icon={<Shield className="h-5 w-5" />}
            title="Provenance on every value"
            body="Each data point is tagged as measured, model-derived, static geospatial, or simulated — no ambiguity."
          />
          <Feature
            icon={<BarChart3 className="h-5 w-5" />}
            title="Honest evaluation"
            body="Chronological splits, MAE / RMSE / nMAE per lead time, with explicit uncertainty — no invented numbers."
          />
          <Feature
            icon={<Globe className="h-5 w-5" />}
            title="India-ready by design"
            body="Gujarat is the pilot region. The architecture extends to any state with available Panchayat GIS layers."
          />
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="border-t border-slate-100 px-8 py-8 md:px-14">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-sm text-slate-500 md:flex-row">
          <div>UrjaCast · Team Sa.Ta.Ra · HackOut 2026</div>
          <div>Sarthak Agiwale · Tanmay Agrawal · Rajas Bathe</div>
        </div>
      </footer>
    </div>
  );
}

/* ================================================================ */
function Logo() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 shadow-md shadow-emerald-600/25">
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    </div>
  );
}

/* ================================================================ */
function HeroIllustration() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="42%" stopColor="#FEF3C7" />
          <stop offset="72%" stopColor="#FEF9F3" />
        </linearGradient>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.7" />
          <stop offset="55%" stopColor="#FCD34D" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#FCD34D" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="towerGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
        <linearGradient id="panelGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1E3A5F" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>

      <rect width="1920" height="1080" fill="url(#skyGrad)" />

      <circle cx="1420" cy="360" r="520" fill="url(#sunGlow)" />
      <g>
        <animateTransform
          attributeName="transform"
          type="scale"
          values="1; 1.04; 1"
          dur="7s"
          repeatCount="indefinite"
          additive="sum"
        />
        <circle cx="1420" cy="360" r="82" fill="#F59E0B" />
        <circle cx="1420" cy="360" r="70" fill="#FCD34D" />
      </g>

      <Cloud x={280} y={190} scale={1} drift={120} dur="90s" />
      <Cloud x={820} y={130} scale={0.72} drift={90} dur="110s" delay="10s" />
      <Cloud x={1620} y={240} scale={0.9} drift={140} dur="95s" delay="4s" />

      <g opacity="0.35" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round">
        <path d="M 100 420 Q 380 400 660 420" strokeDasharray="5 12">
          <animate attributeName="stroke-dashoffset" from="0" to="-68" dur="4s" repeatCount="indefinite" />
        </path>
        <path d="M 160 480 Q 460 458 760 480" strokeDasharray="5 12">
          <animate attributeName="stroke-dashoffset" from="0" to="-68" dur="5s" repeatCount="indefinite" />
        </path>
        <path d="M 220 540 Q 480 520 720 540" strokeDasharray="5 12">
          <animate attributeName="stroke-dashoffset" from="0" to="-68" dur="6s" repeatCount="indefinite" />
        </path>
      </g>

      <g opacity="0.55" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round">
        <path d="M 1030 240 Q 1040 230 1050 240 Q 1060 230 1070 240">
          <animate attributeName="transform" type="translate" values="0 0; -40 -8; 0 0" dur="14s" repeatCount="indefinite" />
        </path>
        <path d="M 1090 275 Q 1098 267 1106 275 Q 1114 267 1122 275">
          <animate attributeName="transform" type="translate" values="0 0; -50 -5; 0 0" dur="17s" repeatCount="indefinite" />
        </path>
        <path d="M 1130 220 Q 1136 214 1142 220 Q 1148 214 1154 220">
          <animate attributeName="transform" type="translate" values="0 0; -30 -6; 0 0" dur="19s" repeatCount="indefinite" />
        </path>
      </g>

      <path
        d="M 0 720 Q 320 640 640 690 Q 960 740 1280 680 Q 1600 620 1920 680 L 1920 1080 L 0 1080 Z"
        fill="#BBF7D0"
      />
      <path
        d="M 0 800 Q 400 730 800 780 Q 1200 830 1600 770 Q 1780 742 1920 780 L 1920 1080 L 0 1080 Z"
        fill="#86EFAC"
      />

      <Windmill x={250} baseY={930} scale={1.15} delay="0s" />
      <Windmill x={520} baseY={900} scale={1.35} delay="1.6s" />
      <Windmill x={120} baseY={990} scale={0.85} delay="2.4s" />

      <path
        d="M 0 900 Q 480 860 960 890 Q 1440 920 1920 875 L 1920 1080 L 0 1080 Z"
        fill="#4ADE80"
      />
      <path
        d="M 0 990 Q 500 970 1000 990 Q 1500 1010 1920 985 L 1920 1080 L 0 1080 Z"
        fill="#22C55E"
      />

      <SolarPanel x={1290} baseY={940} scale={1.3} rotation={-14} />
      <SolarPanel x={1560} baseY={955} scale={1.1} rotation={-14} />
      <SolarPanel x={1140} baseY={970} scale={0.95} rotation={-14} />
      <SolarPanel x={1760} baseY={975} scale={1.0} rotation={-14} />

      <g stroke="#15803D" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.65">
        <path d="M 640 1010 Q 642 995 644 1010" />
        <path d="M 648 1010 Q 650 998 652 1010" />
        <path d="M 890 1030 Q 892 1015 894 1030" />
        <path d="M 380 1040 Q 382 1025 384 1040" />
        <path d="M 1560 1040 Q 1562 1025 1564 1040" />
        <path d="M 1050 1050 Q 1052 1035 1054 1050" />
      </g>

      <g>
        <circle cx="700" cy="1000" r="2.5" fill="#FCD34D" />
        <circle cx="450" cy="1020" r="2" fill="#FBCFE8" />
        <circle cx="960" cy="1015" r="2" fill="#FBCFE8" />
        <circle cx="1420" cy="1030" r="2.5" fill="#FCD34D" />
      </g>
    </svg>
  );
}

function Cloud({
  x,
  y,
  scale = 1,
  drift = 100,
  dur = "80s",
  delay = "0s",
}: {
  x: number;
  y: number;
  scale?: number;
  drift?: number;
  dur?: string;
  delay?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          from="0 0"
          to={`${drift} 0`}
          dur={dur}
          begin={delay}
          repeatCount="indefinite"
        />
        <ellipse cx="0" cy="0" rx="70" ry="24" fill="#FFFFFF" opacity="0.85" />
        <ellipse cx="-30" cy="-10" rx="50" ry="22" fill="#FFFFFF" opacity="0.9" />
        <ellipse cx="40" cy="-6" rx="55" ry="20" fill="#FFFFFF" opacity="0.85" />
        <ellipse cx="-10" cy="10" rx="80" ry="14" fill="#FFFFFF" opacity="0.7" />
      </g>
    </g>
  );
}

function Windmill({
  x,
  baseY,
  scale = 1,
  delay = "0s",
}: {
  x: number;
  baseY: number;
  scale?: number;
  delay?: string;
}) {
  const towerHeight = 340 * scale;
  const hubY = baseY - towerHeight;
  const bladeLength = 110 * scale;

  return (
    <g>
      <ellipse cx={x + 6} cy={baseY} rx={30 * scale} ry={5 * scale} fill="#166534" opacity="0.18" />

      <path
        d={`M ${x - 5 * scale} ${baseY} L ${x - 2 * scale} ${hubY} L ${x + 2 * scale} ${hubY} L ${x + 5 * scale} ${baseY} Z`}
        fill="url(#towerGrad)"
        stroke="#94A3B8"
        strokeWidth={0.6 * scale}
      />

      <g transform={`translate(${x} ${hubY})`}>
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0"
            to="360"
            dur="7s"
            begin={delay}
            repeatCount="indefinite"
          />
          <Blade length={bladeLength} angle={0} />
          <Blade length={bladeLength} angle={120} />
          <Blade length={bladeLength} angle={240} />
        </g>
        <circle r={5 * scale} fill="#F1F5F9" stroke="#94A3B8" strokeWidth={0.8 * scale} />
        <circle r={1.6 * scale} fill="#475569" />
      </g>
    </g>
  );
}

function Blade({ length, angle }: { length: number; angle: number }) {
  return (
    <g transform={`rotate(${angle})`}>
      <path
        d={`M -3 0 Q -1.5 ${-length * 0.55} -2 ${-length} L 2 ${-length} Q 1.5 ${-length * 0.55} 3 0 Z`}
        fill="#FAF7F1"
        stroke="#B8C2CE"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
    </g>
  );
}

function SolarPanel({
  x,
  baseY,
  scale = 1,
  rotation = -14,
}: {
  x: number;
  baseY: number;
  scale?: number;
  rotation?: number;
}) {
  const legH = 46 * scale;
  const panelW = 84 * scale;
  const panelH = 14 * scale;
  const panelY = -legH - panelH;

  return (
    <g transform={`translate(${x} ${baseY}) scale(${scale})`}>
      <ellipse cx="0" cy="0" rx="42" ry="6" fill="#166534" opacity="0.18" />

      <rect x="-20" y={-legH} width="3" height={legH} fill="#475569" />
      <rect x="17" y={-legH} width="3" height={legH} fill="#475569" />

      <line x1="-20" y1={-legH * 0.55} x2="20" y2={-legH * 0.55} stroke="#475569" strokeWidth="2" />

      <g transform={`rotate(${rotation} 0 ${panelY})`}>
        <rect
          x={-panelW / 2}
          y={panelY}
          width={panelW}
          height={panelH}
          rx={1.5}
          fill="url(#panelGrad)"
          stroke="#0F172A"
          strokeWidth="0.6"
        />
        <g stroke="#60A5FA" strokeWidth="0.5" opacity="0.55">
          <line x1={-panelW / 2 + 10} y1={panelY} x2={-panelW / 2 + 10} y2={panelY + panelH} />
          <line x1={-panelW / 2 + 22} y1={panelY} x2={-panelW / 2 + 22} y2={panelY + panelH} />
          <line x1={-panelW / 2 + 34} y1={panelY} x2={-panelW / 2 + 34} y2={panelY + panelH} />
          <line x1={-panelW / 2 + 46} y1={panelY} x2={-panelW / 2 + 46} y2={panelY + panelH} />
          <line x1={-panelW / 2 + 58} y1={panelY} x2={-panelW / 2 + 58} y2={panelY + panelH} />
          <line x1={-panelW / 2 + 70} y1={panelY} x2={-panelW / 2 + 70} y2={panelY + panelH} />
        </g>
        <rect
          x={-panelW / 2 + 2}
          y={panelY + 1}
          width={panelW * 0.35}
          height={panelH - 2}
          fill="#BAE6FD"
          opacity="0.25"
        />
      </g>
    </g>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-100 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_20px_40px_-20px_rgba(16,185,129,0.25)]">
      <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-bold leading-snug tracking-[-0.01em] text-slate-900">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}