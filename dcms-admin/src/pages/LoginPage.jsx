import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useAuth } from '../hooks/useAuth'
import { addAuditLog } from '../services/logService'
import clinicLogo from '../assets/logo.png'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      await addAuditLog(credential.user.uid, 'login', 'auth', credential.user.email)
      navigate(from, { replace: true })
    } catch (loginError) {
      setError('Invalid credentials. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#d1fae5,transparent_50%),radial-gradient(circle_at_bottom_right,#bae6fd,transparent_45%),#f8fafc] px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/85 p-6 shadow-xl backdrop-blur">
        <div className="mb-3 flex justify-center">
          <img
            src={clinicLogo}
            alt="Clinic logo"
            className="h-20 w-auto max-w-[160px] object-contain drop-shadow-[0_10px_20px_rgba(13,148,136,0.28)]"
          />
        </div>
        <h1 className="text-center text-3xl font-bold tracking-tight text-slate-900">Admin Login</h1>

        <form className="mt-5 space-y-3.5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-cyan-300 transition focus:border-cyan-500 focus:ring"
              placeholder="admin@clinic.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-cyan-300 transition focus:border-cyan-500 focus:ring"
              placeholder="********"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
