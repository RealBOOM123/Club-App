import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './CreateAcc.css'
import { supabase } from './lib/supabase'

export default function CreateAccount() {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)  // ← controls banner

  async function handleSignUp(e) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })

    if (signUpError) {
      setError(signUpError.message)
    } else {
      setSuccess(true)  // ← show the banner
    }

    setLoading(false)
  }

  return (
    <div className="create-account-page">
      <div className="bg-layer" />

      {/* ── Success Banner ── */}
      {success && (
        <div className="ca-success-banner">
          <div className="ca-success-icon">✓</div>
          <div className="ca-success-text">
            <strong>Account created!</strong>
            <span>We sent a confirmation email to <em>{email}</em>. Click the link inside to activate your account.</span>
          </div>
          <button className="ca-success-close" onClick={() => navigate('/login')}>
            Go to Log In →
          </button>
        </div>
      )}

      {/* Navbar */}
      <nav className="navbar">
        <Link to="/" className="nav-logo">ClubHub</Link>
      </nav>

      {/* Card */}
      <main className="ca-main">
        <div className={`ca-card ${success ? 'ca-card--dimmed' : ''}`}>

          <div className="ca-header">
            <span className="ca-eyebrow">Get started</span>
            <h1 className="ca-title">Join ClubHub</h1>
            <p className="ca-subtitle">Create your free account in seconds.</p>
          </div>

          <form className="ca-form" onSubmit={handleSignUp}>

            <div className="ca-field">
              <label className="ca-label">Full Name</label>
              <input
                className="ca-input"
                type="text"
                placeholder="Jane Smith"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>

            <div className="ca-field">
              <label className="ca-label">Email</label>
              <input
                className="ca-input"
                type="email"
                placeholder="jane@example.com"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="ca-divider"><span>password</span></div>

            <div className="ca-field">
              <label className="ca-label">Password</label>
              <input
                className="ca-input"
                type="password"
                placeholder="Min. 6 characters"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div className="ca-field">
              <label className="ca-label">Confirm Password</label>
              <input
                className="ca-input"
                type="password"
                placeholder="Repeat your password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
            </div>

            {error && <p className="ca-error">{error}</p>}

            <button className="ca-submit" type="submit" disabled={loading || success}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

          </form>

          <p className="ca-footer-text">
            Already have an account? <Link to="/login">Log in</Link>
          </p>

        </div>
      </main>
    </div>
  )
}