import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuth } from './useAuth'
import './EventPage.css'

export default function EventPage() {
  const { clubId, eventId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [event, setEvent]           = useState(null)
  const [club, setClub]             = useState(null)
  const [attendees, setAttendees]   = useState([])
  const [isGoing, setIsGoing]       = useState(false)
  const [loading, setLoading]       = useState(true)
  const [rsvping, setRsvping]       = useState(false)
  const [error, setError]           = useState(null)
  const [activeTab, setActiveTab]   = useState('details') // 'details' | 'attendance'
  const [isOwner, setIsOwner]       = useState(false)

  useEffect(() => { fetchAll() }, [eventId, user])

  async function fetchAll() {
    setLoading(true)

    const { data: eventData, error: eventErr } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventErr) { setError('Event not found.'); setLoading(false); return }
    setEvent(eventData)

    const { data: clubData } = await supabase
      .from('clubs')
      .select('id, name, created_by')
      .eq('id', eventData.club_id)
      .single()

    setClub(clubData)
    if (user && clubData) setIsOwner(user.id === clubData.created_by)

    await fetchAttendees(eventData.id)

    if (user) {
      const { data: rsvpData } = await supabase
        .from('event_rsvps')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single()
      setIsGoing(!!rsvpData)
    }

    setLoading(false)
  }

  async function fetchAttendees(eid) {
    const { data } = await supabase
      .from('event_rsvps')
      .select('id, user_id, created_at, status, profiles(full_name, avatar_url, email)')
      .eq('event_id', eid || eventId)
      .order('created_at', { ascending: true })
    setAttendees(data || [])
  }

  async function handleRsvp() {
    if (!user) { navigate('/login'); return }
    setRsvping(true)

    if (isGoing) {
      await supabase.from('event_rsvps')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id)
      setIsGoing(false)
    } else {
      await supabase.from('event_rsvps')
        .insert({ event_id: eventId, user_id: user.id, status: 'going' })
      setIsGoing(true)
    }

    await fetchAttendees()
    setRsvping(false)
  }

  async function updateAttendeeStatus(rsvpId, status) {
    await supabase.from('event_rsvps').update({ status }).eq('id', rsvpId)
    await fetchAttendees()
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'TBD'
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    })
  }

  function formatTime(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const goingCount   = attendees.filter(a => a.status !== 'absent').length
  const absentCount  = attendees.filter(a => a.status === 'absent').length

  if (loading) return <div className="ep-loading"><span>Loading…</span></div>
  if (error)   return <div className="ep-loading"><span>{error}</span></div>

  return (
    <div className="event-page">
      <div className="ep-bg-layer" />

      {/* Navbar */}
      <nav className="ep-navbar">
        <Link to="/" className="ep-nav-logo">ClubHub</Link>
        <div className="ep-nav-actions">
          <Link to={`/clubs/${event.club_id}`} className="btn btn-outline">← Back to Club</Link>
          {user && <Link to="/dashboard" className="btn btn-outline">Dashboard</Link>}
        </div>
      </nav>

      <main className="ep-main">

        {/* Hero Banner */}
        <div className="ep-hero">
          <div className="ep-hero-date-badge">
            <span className="ep-badge-month">
              {event.date ? new Date(event.date).toLocaleString('en-US', { month: 'short' }) : '—'}
            </span>
            <span className="ep-badge-day">
              {event.date ? new Date(event.date).getDate() : '—'}
            </span>
          </div>

          <div className="ep-hero-content">
            {club && (
              <Link to={`/clubs/${club.id}`} className="ep-club-breadcrumb">
                {club.name}
              </Link>
            )}
            <h1 className="ep-event-title">{event.title}</h1>
            <div className="ep-event-chips">
              {event.date && (
                <span className="ep-chip">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {formatDate(event.date)}
                </span>
              )}
              {event.date && (
                <span className="ep-chip">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {formatTime(event.date)}
                </span>
              )}
              {event.location && (
                <span className="ep-chip">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {event.location}
                </span>
              )}
              <span className="ep-chip ep-chip-count">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                {goingCount} going
              </span>
            </div>
          </div>

          <div className="ep-hero-cta">
            <button
              className={`btn btn-lg ${isGoing ? 'btn-outline' : 'btn-solid'}`}
              onClick={handleRsvp}
              disabled={rsvping}
            >
              {rsvping ? '…' : isGoing ? '✓ Going' : 'RSVP'}
            </button>
            {isOwner && (
              <Link to={`/clubs/${event.club_id}/events/${eventId}/edit`} className="btn btn-ghost btn-lg">
                Edit Event
              </Link>
            )}
          </div>
        </div>

        <div className="ep-divider" />

        {/* Tabs */}
        <div className="ep-tabs">
          <button
            className={`ep-tab ${activeTab === 'details' ? 'ep-tab--active' : ''}`}
            onClick={() => setActiveTab('details')}
          >Details</button>
          <button
            className={`ep-tab ${activeTab === 'attendance' ? 'ep-tab--active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            Attendance
            <span className="ep-tab-badge">{attendees.length}</span>
          </button>
        </div>

        {/* Tab: Details */}
        {activeTab === 'details' && (
          <div className="ep-details">
            {event.description ? (
              <>
                <h2 className="ep-section-title">About this Event</h2>
                <p className="ep-description">{event.description}</p>
              </>
            ) : (
              <p className="ep-empty">No description provided.</p>
            )}

            {/* Quick stats row */}
            <div className="ep-stats-row">
              <div className="ep-stat-card">
                <span className="ep-stat-number">{attendees.length}</span>
                <span className="ep-stat-label">RSVPs</span>
              </div>
              <div className="ep-stat-card">
                <span className="ep-stat-number">{goingCount}</span>
                <span className="ep-stat-label">Going</span>
              </div>
              {isOwner && (
                <div className="ep-stat-card">
                  <span className="ep-stat-number">{absentCount}</span>
                  <span className="ep-stat-label">Absent</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Attendance */}
        {activeTab === 'attendance' && (
          <div className="ep-attendance">
            <div className="ep-att-header">
              <h2 className="ep-section-title">Attendance</h2>
              {isOwner && (
                <span className="ep-att-owner-note">
                  You can mark attendance below
                </span>
              )}
            </div>

            {attendees.length === 0 ? (
              <p className="ep-empty">No RSVPs yet. Be the first!</p>
            ) : (
              <div className="ep-att-list">
                {attendees.map((a, i) => {
                  const profile = a.profiles
                  const name  = profile?.full_name || profile?.email || 'Unknown'
                  const email = profile?.email || ''
                  const avatar = profile?.avatar_url

                  return (
                    <div className="ep-att-row" key={a.id} style={{ animationDelay: `${i * 0.04}s` }}>
                      <div className="ep-att-left">
                        <div className="ep-avatar">
                          {avatar
                            ? <img src={avatar} alt={name} />
                            : <span>{getInitials(name)}</span>
                          }
                        </div>
                        <div className="ep-att-info">
                          <span className="ep-att-name">{name}</span>
                          {email && <span className="ep-att-email">{email}</span>}
                        </div>
                      </div>

                      <div className="ep-att-right">
                        {isOwner ? (
                          <div className="ep-att-toggle">
                            <button
                              className={`ep-tog-btn ${a.status !== 'absent' ? 'ep-tog--present' : ''}`}
                              onClick={() => updateAttendeeStatus(a.id, 'going')}
                              title="Mark present"
                            >Present</button>
                            <button
                              className={`ep-tog-btn ${a.status === 'absent' ? 'ep-tog--absent' : ''}`}
                              onClick={() => updateAttendeeStatus(a.id, 'absent')}
                              title="Mark absent"
                            >Absent</button>
                          </div>
                        ) : (
                          <span className={`ep-status-pill ${a.status === 'absent' ? 'ep-pill--absent' : 'ep-pill--going'}`}>
                            {a.status === 'absent' ? 'Absent' : 'Going'}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Export for owner */}
            {isOwner && attendees.length > 0 && (
              <button className="btn btn-outline ep-export-btn" onClick={() => exportCSV(attendees, event)}>
                ↓ Export CSV
              </button>
            )}
          </div>
        )}

      </main>
    </div>
  )
}

function exportCSV(attendees, event) {
  const rows = [
    ['Name', 'Email', 'Status', 'RSVP Date'],
    ...attendees.map(a => [
      a.profiles?.full_name || '',
      a.profiles?.email || '',
      a.status || 'going',
      new Date(a.created_at).toLocaleDateString(),
    ])
  ]
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `${event.title.replace(/\s+/g, '_')}_attendance.csv`
  a.click()
  URL.revokeObjectURL(url)
}