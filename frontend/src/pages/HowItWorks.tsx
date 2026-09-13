import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  CloudSun,
  Cpu,
  Zap,
  Sun,
  Wind,
  Shield,
  BarChart3,
} from 'lucide-react';

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 via-white to-white text-slate-900">
      {/* ==================== NAV ==================== */}
      <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/80 px-6 py-4 backdrop-blur-sm md:px-14">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 shadow-md shadow-emerald-600/25">
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
          <span className="text-xl font-bold tracking-tight text-slate-900">UrjaCast</span>
        </Link>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </button>
      </nav>

      {/* ==================== HERO ==================== */}
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-10 text-center md:px-14 md:pt-24">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-700">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          How UrjaCast works
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-[-0.02em] text-slate-900 md:text-6xl">
          From weather to a{' '}
          <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500 bg-clip-text text-transparent">
            grid decision
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
          One journey, five layers: site, conditions, forecast, and the action
          you take because of it — every value traceable back to where it came
          from.
        </p>
      </section>

      {/* ==================== JOURNEY STEPS ==================== */}
      <section className="mx-auto max-w-6xl px-6 pb-20 md:px-14">
        <div className="grid gap-5 md:grid-cols-5">
          <StepCard
            index={1}
            icon={<MapPin className="h-5 w-5" />}
            title="Pick a site"
            body="Choose a solar or wind site on the map. UrjaCast resolves it to State → District → Block → Panchayat automatically."
          />
          <StepCard
            index={2}
            icon={<CloudSun className="h-5 w-5" />}
            title="Read conditions"
            body="A 72-hour weather forecast — irradiance, wind, humidity, pressure — is pulled for that exact coordinate."
          />
          <StepCard
            index={3}
            icon={<Cpu className="h-5 w-5" />}
            title="Forecast output"
            body="A physical PV or turbine baseline anchors the estimate; an ML layer corrects for the site's own behaviour."
          />
          <StepCard
            index={4}
            icon={<BarChart3 className="h-5 w-5" />}
            title="Spot surplus / shortfall"
            body="Predicted generation is compared against the site's operating requirement, hour by hour, across the horizon."
          />
          <StepCard
            index={5}
            icon={<Zap className="h-5 w-5" />}
            title="Get a recommendation"
            body="Storage dispatch, load-shift, backup prep, or curtailment — a plain, explainable next step."
          />
        </div>
      </section>

      {/* ==================== SOLAR / WIND SPLIT ==================== */}
      <section className="border-y border-slate-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-14">
          <div className="mb-10 max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
              Physics first, ML second
            </div>
            <h2 className="mt-3 text-3xl font-extrabold leading-[1.15] tracking-[-0.02em] text-slate-900 md:text-4xl">
              Solar and wind are modelled differently — on purpose.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white p-8">
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Sun className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-bold tracking-[-0.01em] text-slate-900">
                Solar
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                A pvlib physical baseline models expected output from
                irradiance and panel geometry. XGBoost then learns only the
                site-specific residual correction — not the whole behaviour
                from scratch.
              </p>
            </div>

            <div className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-white p-8">
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <Wind className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-bold tracking-[-0.01em] text-slate-900">
                Wind
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                A turbine power curve converts forecast wind speed and air
                density into expected output, with an optional ML correction
                layer where sufficient plant history exists.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== TRUST / PRINCIPLES ==================== */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:px-14">
        <div className="mb-12 max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Why trust the number
          </div>
          <h2 className="mt-3 text-3xl font-extrabold leading-[1.15] tracking-[-0.02em] text-slate-900 md:text-4xl">
            Every number traceable. Every decision explainable.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
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
            icon={<Zap className="h-5 w-5" />}
            title="Forecast becomes action"
            body="Surplus and shortfall windows are converted into storage, load-shift, backup, and curtailment guidance."
          />
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section className="border-t border-slate-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50/40">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-16 text-center md:px-14">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Ready to see it on a real site?
          </h2>
          <p className="mt-3 max-w-xl text-slate-600">
            Sign in and pick a location in Gujarat to run your first 72-hour
            forecast.
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
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </button>
          </div>
        </div>
      </section>

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
function StepCard({
  index,
  icon,
  title,
  body,
}: {
  index: number;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-slate-100 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_20px_40px_-20px_rgba(16,185,129,0.25)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
          {icon}
        </div>
        <span className="text-2xl font-extrabold text-slate-100">
          {String(index).padStart(2, '0')}
        </span>
      </div>
      <h3 className="mb-1.5 text-sm font-bold leading-snug tracking-[-0.01em] text-slate-900">
        {title}
      </h3>
      <p className="text-xs leading-relaxed text-slate-600">{body}</p>
    </div>
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