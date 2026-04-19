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
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setToast(false), 3000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!loading && !user) navigate('/login')
    if (!loading && user) fetchAll()
  }, [user, loading])

  async function fetchAll() {
    setDataLoading(true)

    const [joinedRes, createdRes] = await Promise.all([
      supabase
        .from('club_members')
        .select(`club:clubs (id, name, image_url, category, club_members(count))`)
        .eq('user_id', user.id),
      supabase
        .from('clubs')
        .select(`id, name, image_url, category, club_members(count)`)
        .eq('created_by', user.id)
    ])

    const joined  = joinedRes.data?.map(r => r.club).filter(Boolean) || []
    const created = createdRes.data || []

    if (joinedRes.data)  setJoinedClubs(joined)
    if (createdRes.data) setCreatedClubs(created)

    // Get all club IDs the user is part of
    const allClubIds = [
      ...joined.map(c => c.id),
      ...created.map(c => c.id)
    ].filter((v, i, a) => a.indexOf(v) === i) // dedupe

    if (allClubIds.length > 0) {
      const now = new Date().toISOString()

      const [eventsRes, announcementsRes] = await Promise.all([
        supabase
          .from('events')
          .select('id, title, date, location, club_id, clubs(name)')
          .in('club_id', allClubIds)
          .gte('date', now)
          .order('date', { ascending: true })
          .limit(5),
        supabase
          .from('announcements')
          .select('id, content, created_at, club_id, clubs(name), profiles(full_name)')
          .in('club_id', allClubIds)
          .order('created_at', { ascending: false })
          .limit(10)
      ])

      setUpcomingEvents(eventsRes.data || [])
      setAnnouncements(announcementsRes.data || [])
    }

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

  function formatDate(dateStr) {
    if (!dateStr) return 'TBD'
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    })
  }

  function formatTime(dateStr) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

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
            { label: 'Upcoming', value: dataLoading ? '—' : upcomingEvents.length },
          ].map(({ label, value }) => (
            <div className="dash-card" key={label}>
              <div className="dash-card-value">{value}</div>
              <div className="dash-card-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Two-column layout for events + announcements */}
        <div className="dash-feed">

          {/* Upcoming Events */}
          <div className="dash-section">
            <h2 className="dash-section-title">Upcoming Events</h2>
            {dataLoading ? (
              <div className="dash-section-loading">Loading...</div>
            ) : upcomingEvents.length === 0 ? (
              <div className="dash-section-empty">
                <p>No upcoming events in your clubs.</p>
                <Link to="/clubs" className="btn btn-outline">Browse clubs</Link>
              </div>
            ) : (
              <div className="dash-events-list">
                {upcomingEvents.map(event => (
                  <Link
                    to={`/clubs/${event.club_id}/events/${event.id}`}
                    key={event.id}
                    className="dash-event-row"
                  >
                    <div className="dash-event-date-block">
                      <span className="dash-event-month">
                        {event.date ? new Date(event.date).toLocaleString('en-US', { month: 'short' }) : '—'}
                      </span>
                      <span className="dash-event-day">
                        {event.date ? new Date(event.date).getDate() : '—'}
                      </span>
                    </div>
                    <div className="dash-event-info">
                      <span className="dash-event-title">{event.title}</span>
                      <span className="dash-event-club">{event.clubs?.name}</span>
                      <span className="dash-event-meta">
                        {formatDate(event.date)}{event.date ? ` · ${formatTime(event.date)}` : ''}
                        {event.location ? ` · ${event.location}` : ''}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Announcements Feed */}
          <div className="dash-section">
            <h2 className="dash-section-title">Announcements</h2>
            {dataLoading ? (
              <div className="dash-section-loading">Loading...</div>
            ) : announcements.length === 0 ? (
              <div className="dash-section-empty">
                <p>No announcements yet.</p>
              </div>
            ) : (
              <div className="dash-announcements-list">
                {announcements.map(a => (
                  <Link
                    to={`/clubs/${a.club_id}`}
                    key={a.id}
                    className="dash-announcement-row"
                  >
                    <div className="dash-ann-header">
                      <span className="dash-ann-club">{a.clubs?.name}</span>
                      <span className="dash-ann-time">{timeAgo(a.created_at)}</span>
                    </div>
                    <p className="dash-ann-content">{a.content}</p>
                    {a.profiles?.full_name && (
                      <span className="dash-ann-author">— {a.profiles.full_name}</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

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