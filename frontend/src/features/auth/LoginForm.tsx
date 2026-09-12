import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useLogin } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/Toast'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const login = useLogin()
  const loginAsDemo = useAuthStore((s) => s.loginAsDemo)
  const navigate = useNavigate()
  const { showToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await login.mutateAsync({ email, password })
      showToast('Signed in successfully.', 'success')
      navigate('/dashboard')
    } catch (err: any) {
      showToast(err?.message || 'Sign in failed. Try demo mode instead.', 'error')
    }
  }

  function handleDemo() {
    loginAsDemo()
    showToast('Continuing as demo user.', 'success')
    navigate('/dashboard')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email / Username"
        type="email"
        name="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="button"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          onClick={() => setShowPassword((s) => !s)}
          className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      <div className="flex items-center justify-between text-xs">
        <label className="flex items-center gap-2 text-slate-500">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          Remember me
        </label>
        <button type="button" className="font-medium text-emerald-700 hover:underline">
          Forgot password?
        </button>
      </div>

      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? 'Signing in…' : 'Login'}
      </Button>

      <div className="relative py-2 text-center text-xs text-slate-400">
        <span className="bg-white px-2 relative z-10">Or continue with</span>
        <div className="absolute left-0 top-1/2 h-px w-full bg-slate-200" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" className="w-full">
          Google
        </Button>
        <Button type="button" variant="outline" className="w-full">
          Microsoft
        </Button>
      </div>

      <Button type="button" variant="secondary" className="w-full" onClick={handleDemo}>
        Continue as Demo User
      </Button>
    </form>
  )
}