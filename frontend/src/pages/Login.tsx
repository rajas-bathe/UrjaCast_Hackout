import { LoginForm } from '@/features/auth/LoginForm'
import { Link } from 'react-router-dom'
import { Sun, Wind } from 'lucide-react'

export default function Login() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      <div className="flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/25">
              <svg
                className="h-5 w-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v20M2 12h20" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">UrjaCast</span>
          </div>

          <div className="mb-8">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700">
              Welcome back
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Log in to your account
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Pick up right where your forecasts left off.
            </p>
          </div>

          <LoginForm />

          <p className="mt-8 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden lg:flex items-center justify-center overflow-hidden bg-gradient-to-br from-amber-100 via-amber-50 to-emerald-50 p-12">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 800 800"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <circle cx="620" cy="150" r="140" fill="#FCD34D" opacity="0.25" />
          <circle cx="620" cy="150" r="90" fill="#FCD34D" opacity="0.3" />
          <path
            d="M0 620 Q 200 580 400 610 Q 600 640 800 590 L 800 800 L 0 800 Z"
            fill="#10B981"
            opacity="0.12"
          />
          <path
            d="M0 680 Q 220 650 440 675 Q 640 700 800 660 L 800 800 L 0 800 Z"
            fill="#059669"
            opacity="0.15"
          />
        </svg>

        <div className="relative z-10 max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/70 shadow-md backdrop-blur-sm">
            <Sun className="h-8 w-8 text-amber-500" strokeWidth={1.75} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">
            Smarter Forecasts. Better Decisions.
          </h2>
          <p className="text-slate-600 leading-relaxed">
            Site-aware renewable generation forecasting and decision intelligence
            for Gujarat, India.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-medium text-slate-600 backdrop-blur-sm">
            <Wind className="h-3.5 w-3.5 text-sky-500" />
            Solar &amp; wind, forecast together
          </div>
        </div>
      </div>
    </div>
  )
}