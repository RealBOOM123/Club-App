import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuth } from './useAuth'
import './Dashboard.css'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [toast, setToast] = useState(true)  // show welcome toast on arrival

  // hide toast after 3 seconds
  useEffect(() => {
    const t = setTimeout(() => setToast(false), 3000)
    return () => clearTimeout(t)
  }, [])

  // redirect if not logged in
  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (loading) return <div className="dash-loading">Loading...</div>

  const name = user?.user_metadata?.full_name || user?.email || 'there'
  const firstName = name.split(' ')[0]

  return (
    <div className="dashboard-page">
      <div className="bg-layer" />

      {/* Toast */}
      {toast && (
        <div className="dash-toast">
          Welcome back, {firstName}!
        </div>
      )}

      {/* Navbar */}
      <nav className="navbar">
        <Link to="/" className="nav-logo">ClubHub</Link>

        <div className="nav-actions">
          <span className="nav-username">{name}</span>
          <button className="btn btn-outline" onClick={handleLogout}>Log Out</button>
        </div>
      </nav>

      {/* Main content */}
      <main className="dash-main">
        <div className="dash-hero">
          <span className="ca-eyebrow">Dashboard</span>
          <h1 className="dash-title">Hey, {firstName}.</h1>
          <p className="dash-subtitle">Here's what's happening with your clubs.</p>
        </div>

        {/* Placeholder stat cards */}
        <div className="dash-cards">
          {[
            { label: 'My Clubs',      value: '3'   },
            { label: 'Upcoming Events', value: '5' },
            { label: 'Members',       value: '124' },
          ].map(({ label, value }) => (
            <div className="dash-card" key={label}>
              <div className="dash-card-value">{value}</div>
              <div className="dash-card-label">{label}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}