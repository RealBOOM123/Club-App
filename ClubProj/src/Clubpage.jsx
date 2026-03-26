import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuth } from './useAuth'
import './ClubPage.css'

export default function ClubPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [club, setClub]         = useState(null)
  const [events, setEvents]     = useState([])
  const [members, setMembers]   = useState(0)
  const [isMember, setIsMember] = useState(false)
  const [loading, setLoading]   = useState(true)
  const [joining, setJoining]   = useState(false)
  const [error, setError]       = useState(null)

  useEffect(() => {
    fetchClub()
  }, [id, user])

  async function fetchClub() {
    setLoading(true)

    // Fetch club
    const { data: clubData, error: clubError } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', id)
      .single()

    if (clubError) { setError('Club not found.'); setLoading(false); return }
    setClub(clubData)

    // Fetch events
    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .eq('club_id', id)
      .order('date', { ascending: true })

    setEvents(eventsData || [])

    // Fetch member count
    const { count } = await supabase
      .from('club_members')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', id)

    setMembers(count || 0)

    // Check if current user is a member
    if (user) {
      const { data: memberData } = await supabase
        .from('club_members')
        .select('id')
        .eq('club_id', id)
        .eq('user_id', user.id)
        .single()

      setIsMember(!!memberData)
    }

    setLoading(false)
  }

  async function handleJoin() {
    if (!user) { navigate('/login'); return }
    setJoining(true)

    if (isMember) {
      await supabase.from('club_members')
        .delete()
        .eq('club_id', id)
        .eq('user_id', user.id)
      setMembers(m => m - 1)
      setIsMember(false)
    } else {
      await supabase.from('club_members')
        .insert({ club_id: id, user_id: user.id })
      setMembers(m => m + 1)
      setIsMember(true)
    }

    setJoining(false)
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'TBD'
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  if (loading) return <div className="dash-loading">Loading...</div>
  if (error)   return <div className="dash-loading">{error}</div>

  const isOwner = user?.id === club.created_by

  return (
    <div className="club-page">
      <div className="bg-layer" />

      {/* Navbar */}
      <nav className="navbar">
        <Link to="/" className="nav-logo">ClubHub</Link>
        <div className="nav-actions">
          <Link to="/clubs" className="btn btn-outline">← All Clubs</Link>
          {user && <Link to="/dashboard" className="btn btn-outline">Dashboard</Link>}
        </div>
      </nav>

      <main className="club-main">

        {/* Hero */}
        <div className="club-hero">
          <div className="club-hero-img">
            {club.image_url
              ? <img src={club.image_url} alt={club.name} />
              : <div className="club-hero-placeholder">{club.name[0]}</div>
            }
          </div>

          <div className="club-hero-info">
            <span className="ca-eyebrow">{club.category || 'General'}</span>
            <h1 className="club-name">{club.name}</h1>
            <p className="club-desc">{club.description}</p>

            <div className="club-meta">
              <span className="club-meta-item">{members} members</span>
              <span className="club-meta-dot" />
              <span className="club-meta-item">{events.length} events</span>
            </div>

            <div className="club-actions">
              <button
                className={`btn btn-lg ${isMember ? 'btn-outline' : 'btn-solid'}`}
                onClick={handleJoin}
                disabled={joining}
              >
                {joining ? '...' : isMember ? 'Leave Club' : 'Join Club'}
              </button>
              {isOwner && (
                <Link to={`/clubs/${id}/edit`} className="btn btn-outline btn-lg">
                  Edit Club
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="divider" />

        {/* Events */}
        <section className="club-events">
          <div className="club-section-header">
            <h2 className="club-section-title">Upcoming Events</h2>
            {isOwner && (
              <Link to={`/clubs/${id}/events/new`} className="btn btn-solid">
                + Add Event
              </Link>
            )}
          </div>

          {events.length === 0 ? (
            <p className="club-empty">No events yet.</p>
          ) : (
            <div className="events-list">
              {events.map(event => (
                <div className="event-card" key={event.id}>
                  <div className="event-date-block">
                    <span className="event-month">
                      {event.date ? new Date(event.date).toLocaleString('en-US', { month: 'short' }) : '—'}
                    </span>
                    <span className="event-day">
                      {event.date ? new Date(event.date).getDate() : '—'}
                    </span>
                  </div>
                  <div className="event-info">
                    <h3 className="event-title">{event.title}</h3>
                    {event.description && <p className="event-desc">{event.description}</p>}
                    <div className="event-meta">
                      {event.location && <span>📍 {event.location}</span>}
                      <span>{formatDate(event.date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}