import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './CreateAcc.css'   // reuses the same styles — no extra CSS needed
import { supabase } from './lib/supabase'
 
export default function Login() {
  const navigate = useNavigate()
 
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)
 
  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
 
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
 
    if (signInError) {
      setError(signInError.message)
    } else {
      navigate('/dashboard')
    }
 
    setLoading(false)
  }
 
  return (
    <div className="create-account-page">
      <div className="bg-layer" />
 
      {/* Navbar */}
      <nav className="navbar">
        <Link to="/" className="nav-logo">ClubHub</Link>
      </nav>
 
      {/* Card */}
      <main className="ca-main">
        <div className="ca-card">
 
          <div className="ca-header">
            <span className="ca-eyebrow">Welcome back</span>
            <h1 className="ca-title">Log In</h1>
            <p className="ca-subtitle">Good to see you again.</p>
          </div>
 
          <form className="ca-form" onSubmit={handleLogin}>
 
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
 
            <div className="ca-field">
              <label className="ca-label">Password</label>
              <input
                className="ca-input"
                type="password"
                placeholder="Your password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
 
            {error && <p className="ca-error">{error}</p>}
 
            <button className="ca-submit" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Log In'}
            </button>
 
          </form>
 
          <p className="ca-footer-text">
            Don't have an account? <Link to="/create-account">Sign up</Link>
          </p>
 
        </div>
      </main>
    </div>
  )
}