import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { verifyPasswordResetCode } from 'firebase/auth'
import { auth } from '../firebase/config'
import clinicLogo from '../assets/logo.png'

const getResetCodeFromInput = (value) => {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  if (trimmed.includes('oobCode=')) {
    try {
      const parsedUrl = new URL(trimmed)
      return parsedUrl.searchParams.get('oobCode') || ''
    } catch {
      const fallbackMatch = trimmed.match(/[?&]oobCode=([^&]+)/)
      return fallbackMatch ? decodeURIComponent(fallbackMatch[1]) : ''
    }
  }

  return trimmed
}

const ResetCodePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const resetEmail = location.state?.email || ''

  const [resetCodeInput, setResetCodeInput] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!resetEmail) {
    return <Navigate to="/forgot-password" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const normalizedCode = getResetCodeFromInput(resetCodeInput)
    if (!normalizedCode) {
      setError('Please enter the reset code from your email.')
      return
    }

    setIsSubmitting(true)

    try {
      await verifyPasswordResetCode(auth, normalizedCode)
      navigate('/change-password', {
        state: {
          email: resetEmail,
          oobCode: normalizedCode,
        },
      })
    } catch (verifyError) {
      if (verifyError?.code === 'auth/expired-action-code') {
        setError('Reset code has expired. Request a new reset email.')
      } else if (verifyError?.code === 'auth/invalid-action-code') {
        setError('Reset code is invalid. Double-check it or request a new one.')
      } else {
        setError('Unable to verify reset code. Please try again.')
      }
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

        <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900">Enter Reset Code</h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          We sent a reset link to <span className="font-semibold text-slate-800">{resetEmail}</span>.
        </p>

        <form className="mt-5 space-y-3.5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Reset Code or Link</label>
            <input
              type="text"
              required
              value={resetCodeInput}
              onChange={(event) => setResetCodeInput(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-cyan-300 transition focus:border-cyan-500 focus:ring"
              placeholder="Paste code or full reset link"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? 'Verifying...' : 'Continue'}
          </button>

          <div className="text-center">
            <Link
              to="/forgot-password"
              state={{ email: resetEmail }}
              className="text-sm font-medium text-cyan-700 underline-offset-2 hover:text-cyan-900 hover:underline"
            >
              Back
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ResetCodePage
