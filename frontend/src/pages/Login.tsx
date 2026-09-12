import React from 'react'
import { Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { LoginForm } from '@/features/auth/LoginForm'

export default function Login() {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="flex flex-col justify-center bg-white px-8 py-12 md:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
              <Leaf size={18} className="text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-900">UrjaCast</span>
          </div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-emerald-600">Welcome back</p>
          <h1 className="mb-6 text-2xl font-bold text-slate-900">Log in to your account</h1>
          <LoginForm />
          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-emerald-700 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
      <div className="hidden bg-gradient-to-br from-emerald-600 to-emerald-800 md:flex md:items-center md:justify-center">
        <div className="max-w-sm px-8 text-center text-white">
          <h2 className="text-2xl font-bold">Smarter Forecasts. Better Decisions.</h2>
          <p className="mt-3 text-sm text-emerald-50">
            Site-aware renewable generation forecasting and decision intelligence for Gujarat, India.
          </p>
        </div>
      </div>
    </div>
  )
}