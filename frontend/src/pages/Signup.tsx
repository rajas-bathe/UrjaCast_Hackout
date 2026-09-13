import { SignupForm } from '@/features/auth/SignupForm'
import { Link } from 'react-router-dom'
import { Zap, MapPin } from 'lucide-react'

export default function Signup() {
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
              Get started
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Set up a site and get your first forecast in minutes.
            </p>
          </div>

          <SignupForm />

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden lg:flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-12">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 800 800"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <circle cx="180" cy="140" r="120" fill="#059669" opacity="0.1" />
          <circle cx="680" cy="620" r="160" fill="#38BDF8" opacity="0.12" />
          <path
            d="M0 640 Q 220 600 440 630 Q 640 660 800 610 L 800 800 L 0 800 Z"
            fill="#059669"
            opacity="0.12"
          />
          <path
            d="M0 700 Q 240 675 460 695 Q 660 715 800 680 L 800 800 L 0 800 Z"
            fill="#10B981"
            opacity="0.15"
          />
        </svg>

        <div className="relative z-10 max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/70 shadow-md backdrop-blur-sm">
            <Zap className="h-8 w-8 text-emerald-600" strokeWidth={1.75} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">
            Join UrjaCast
          </h2>
          <p className="text-slate-600 leading-relaxed">
            Forecast your renewable site's output 24–72 hours ahead and turn it
            into action.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-medium text-slate-600 backdrop-blur-sm">
            <MapPin className="h-3.5 w-3.5 text-emerald-600" />
            Site-aware, down to the Panchayat
          </div>
        </div>
      </div>
    </div>
  )
}