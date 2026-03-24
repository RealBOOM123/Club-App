// Add these imports at the top of Home.jsx
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './Useauth'
import { supabase } from './lib/supabase'

// Replace your existing navbar section with this:
function HomeNavbar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const name = user?.user_metadata?.full_name || user?.email

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <nav className="navbar">
      <a className="nav-logo" href="#">ClubHub</a>

      <ul className="nav-links">
        <li><a href="#statistics">Statistics</a></li>
        <li><a href="#numbers">Numbers</a></li>
        <li><a href="#yap">Yap</a></li>
      </ul>

      <div className="nav-actions">
        {user ? (
          // Logged in: show name + logout
          <>
            <span className="nav-username"
              style={{ fontSize: '0.88rem', color: 'rgba(253,246,227,0.7)', fontWeight: 500 }}>
              {name}
            </span>
            <button className="btn btn-outline" onClick={handleLogout}>Log Out</button>
          </>
        ) : (
          // Logged out: show login + signup
          <>
            <Link to="/login" className="btn btn-outline">Log In</Link>
            <Link to="/create-account" className="btn btn-solid">Create Account</Link>
          </>
        )}
      </div>
    </nav>
  )
}