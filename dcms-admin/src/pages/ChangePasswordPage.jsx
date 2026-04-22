import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { confirmPasswordReset } from 'firebase/auth'
import { auth } from '../firebase/config'
import clinicLogo from '../assets/logo.png'

const ChangePasswordPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const resetEmail = location.state?.email || ''
  const oobCode = location.state?.oobCode || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!resetEmail || !oobCode) {
    return <Navigate to="/forgot-password" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }

    if (newPassword !== confirmNewPassword) {
      setError('New password and confirm password do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      await confirmPasswordReset(auth, oobCode, newPassword)
      setSuccessMessage('Password changed successfully. You can now sign in.')
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1000)
    } catch (resetError) {
      if (resetError?.code === 'auth/expired-action-code') {
        setError('Reset code has expired. Request a new reset email.')
      } else if (resetError?.code === 'auth/invalid-action-code') {
        setError('Reset code is invalid. Please restart the reset flow.')
      } else if (resetError?.code === 'auth/weak-password') {
        setError('Choose a stronger password and try again.')
      } else {
        setError('Unable to change password right now. Please try again.')
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

        <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900">Change Password</h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Set a new password for <span className="font-semibold text-slate-800">{resetEmail}</span>.
        </p>

        <form className="mt-5 space-y-3.5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-cyan-300 transition focus:border-cyan-500 focus:ring"
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmNewPassword}
              onChange={(event) => setConfirmNewPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-cyan-300 transition focus:border-cyan-500 focus:ring"
              placeholder="Re-enter new password"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          ) : null}

          {successMessage ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? 'Saving...' : 'Change Password'}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-sm font-medium text-cyan-700 underline-offset-2 hover:text-cyan-900 hover:underline">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChangePasswordPage
