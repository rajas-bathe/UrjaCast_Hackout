import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/useAuthStore'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

export function SignupForm() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const authLogin = useAuthStore((s) => s.login)
  const loginAsDemo = useAuthStore((s) => s.loginAsDemo)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [team, setTeam] = useState('HEXABYTE')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/api/auth/signup', {
        name,
        email,
        password,
        team,
      })
      authLogin(res.data.token, res.data.user)
      showToast('Account created', 'success')
      navigate('/dashboard')
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Signup failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleDemo() {
    loginAsDemo()
    showToast('Signed in as Demo User', 'success')
    navigate('/dashboard')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Full Name"
        placeholder="Rajas Bathe"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        label="Email"
        type="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Input
        label="Team / Organization"
        placeholder="HEXABYTE"
        value={team}
        onChange={(e) => setTeam(e.target.value)}
      />
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating account…' : 'Sign Up'}
      </Button>
      <div className="relative py-1 text-center text-xs text-slate-400">
        <span className="relative z-10 bg-white px-3">Or</span>
        <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200" />
      </div>
      <Button
        type="button"
        variant="secondary"
        onClick={handleDemo}
        className="w-full"
      >
        Continue as Demo User
      </Button>
    </form>
  )
}