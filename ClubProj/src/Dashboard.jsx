import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuth } from './useAuth'
import './Dashboard.css'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [toast, setToast] = useState(true)
  const [joinedClubs, setJoinedClubs] = useState([])
  const [createdClubs, setCreatedClubs] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setToast(false), 3000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!loading && !user) navigate('/login')
    if (!loading && user) fetchClubs()
  }, [user, loading])

  async function fetchClubs() {
    setDataLoading(true)

    const [joinedRes, createdRes] = await Promise.all([
      // Clubs the user has joined (via club_members)
      supabase
        .from('club_members')
        .select(`
          club:clubs (
            id, name, image_url, category,
            club_members(count)
          )
        `)
        .eq('user_id', user.id),

      // Clubs the user created
      supabase
        .from('clubs')
        .select(`
          id, name, image_url, category,
          club_members(count)
        `)
        .eq('created_by', user.id)
    ])

    if (joinedRes.data)  setJoinedClubs(joinedRes.data.map(r => r.club).filter(Boolean))
    if (createdRes.data) setCreatedClubs(createdRes.data)

    setDataLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (loading) return <div className="dash-loading">Loading...</div>
  if (!user)   return null

  const name      = user?.user_metadata?.full_name || user?.email || 'there'
  const firstName = name.split(' ')[0]

  return (
    <div className="dashboard-page">
      <div className="bg-layer" />

      {toast && <div className="dash-toast">Welcome back, {firstName}!</div>}

      <nav className="navbar">
        <Link to="/" className="nav-logo">ClubHub</Link>
        <div className="nav-actions">
          <span className="nav-username">{name}</span>
          <button className="btn btn-outline" onClick={handleLogout}>Log Out</button>
        </div>
      </nav>

      <main className="dash-main">
        <div className="dash-hero">
          <span className="ca-eyebrow">Dashboard</span>
          <h1 className="dash-title">Hey, {firstName}.</h1>
          <p className="dash-subtitle">Here's what's happening with your clubs.</p>
        </div>

        {/* Stat row */}
        <div className="dash-cards">
          {[
            { label: 'Joined',  value: dataLoading ? '—' : joinedClubs.length  },
            { label: 'Created', value: dataLoading ? '—' : createdClubs.length },
          ].map(({ label, value }) => (
            <div className="dash-card" key={label}>
              <div className="dash-card-value">{value}</div>
              <div className="dash-card-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Joined clubs */}
        <Section
          title="Clubs I've Joined"
          clubs={joinedClubs}
          loading={dataLoading}
          emptyText="You haven't joined any clubs yet."
          emptyLink={{ to: '/clubs', label: 'Browse clubs' }}
        />

        {/* Created clubs */}
        <Section
          title="Clubs I've Created"
          clubs={createdClubs}
          loading={dataLoading}
          emptyText="You haven't created a club yet."
          emptyLink={{ to: '/clubs/new', label: '+ Create one' }}
        />
      </main>
    </div>
  )
}

function Section({ title, clubs, loading, emptyText, emptyLink }) {
  return (
    <div className="dash-section">
      <h2 className="dash-section-title">{title}</h2>

      {loading ? (
        <div className="dash-section-loading">Loading...</div>
      ) : clubs.length === 0 ? (
        <div className="dash-section-empty">
          <p>{emptyText}</p>
          <Link to={emptyLink.to} className="btn btn-outline">{emptyLink.label}</Link>
        </div>
      ) : (
        <div className="dash-club-grid">
          {clubs.map(club => (
            <Link to={`/clubs/${club.id}`} key={club.id} className="dash-club-card">
              <div className="dash-club-img">
                {club.image_url
                  ? <img src={club.image_url} alt={club.name} />
                  : <div className="dash-club-img-placeholder">{club.name[0]}</div>
                }
              </div>
              <div className="dash-club-info">
                <span className="dash-club-category">{club.category || 'General'}</span>
                <span className="dash-club-name">{club.name}</span>
                <span className="dash-club-members">
                  {club.club_members?.[0]?.count ?? 0} members
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}