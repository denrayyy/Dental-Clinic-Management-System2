import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchSignInMethodsForEmail, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase/config'
import clinicLogo from '../assets/logo.png'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    const normalizedEmail = email.trim()
    if (!normalizedEmail) {
      setError('Please enter your email address.')
      return
    }

    setIsSubmitting(true)

    try {
      const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail)
      if (methods.length > 0 && !methods.includes('password')) {
        setError('No email/password account found for this email address.')
        return
      }

      await sendPasswordResetEmail(auth, normalizedEmail)
      setSuccessMessage('Reset link sent. Please check your email inbox.')
    } catch (resetError) {
      if (resetError?.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (resetError?.code === 'auth/user-not-found') {
        setError('No account found for this email address.')
      } else if (resetError?.code === 'auth/operation-not-allowed') {
        setError('Email/password sign-in is disabled in Firebase Auth settings.')
      } else if (resetError?.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.')
      } else if (resetError?.code === 'auth/network-request-failed') {
        setError('Network error while sending reset email. Check connection and try again.')
      } else {
        setError('Unable to send reset email right now. Please try again.')
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

        <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900">Forgot Password</h1>
        <p className="mt-2 text-center text-sm text-slate-600">Enter your email to receive a reset link.</p>

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

          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          ) : null}

          {successMessage ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {successMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPasswordPage
