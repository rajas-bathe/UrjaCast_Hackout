import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useSignup } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/components/ui/Toast'

export function SignupForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [team, setTeam] = useState('')
  const signup = useSignup()
  const loginAsDemo = useAuthStore((s) => s.loginAsDemo)
  const navigate = useNavigate()
  const { showToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await signup.mutateAsync({ name, email, password, team })
      showToast('Account created successfully.', 'success')
      navigate('/dashboard')
    } catch (err: any) {
      showToast(err?.message || 'Sign up failed. Try demo mode instead.', 'error')
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
        label="Full Name"
        name="name"
        placeholder="Rajas Bathe"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        label="Email"
        type="email"
        name="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label="Password"
        type="password"
        name="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Input
        label="Team / Organization"
        name="team"
        placeholder="HEXABYTE"
        value={team}
        onChange={(e) => setTeam(e.target.value)}
      />

      <Button type="submit" className="w-full" disabled={signup.isPending}>
        {signup.isPending ? 'Creating account…' : 'Sign Up'}
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