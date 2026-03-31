import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuth } from './useAuth'
import './Clubs.css'

const CATEGORIES = ['All', 'Sports', 'Arts', 'Technology', 'Music', 'Academic', 'Social', 'Other']

export default function Clubs() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const tickerRef = useRef(null)

  const [clubs, setClubs]               = useState([])
  const [events, setEvents]             = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [category, setCategory]         = useState('All')
  const [error, setError]               = useState(null)
  const [activeTab, setActiveTab]       = useState('announcements') // 'announcements' | 'events'

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchClubs(), fetchEvents(), fetchAnnouncements()])
    setLoading(false)
  }

  async function fetchClubs() {
    const { data, error } = await supabase
      .from('clubs')
      .select(`*, club_members(count)`)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setClubs(data || [])
  }

  async function fetchEvents() {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('club_events')
      .select(`*, clubs(name, image_url)`)
      .gte('event_date', now)
      .order('event_date', { ascending: true })
      .limit(20)
    if (!error) setEvents(data || [])
  }

  async function fetchAnnouncements() {
    const { data, error } = await supabase
      .from('announcements')
      .select(`*, clubs(name, image_url)`)
      .order('created_at', { ascending: false })
      .limit(30)
    if (!error) setAnnouncements(data || [])
  }

  const filtered = clubs.filter(c => {
    const matchSearch   = c.name.toLowerCase().includes(search.toLowerCase()) ||
                          c.description?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = category === 'All' || c.category === category
    return matchSearch && matchCategory
  })

  // Ticker: next 5 upcoming events
  const tickerItems = events.slice(0, 8)

  function formatEventDate(dateStr) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days  = Math.floor(hours / 24)
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (mins > 0) return `${mins}m ago`
    return 'just now'
  }

  return (
    <div className="clubs-page">
      <div className="bg-layer" />

      {/* Navbar */}
      <nav className="navbar">
        <Link to="/" className="nav-logo">ClubHub</Link>
        <div className="nav-actions">
          {user
            ? <Link to="/clubs/new" className="btn btn-solid">+ New Club</Link>
            : <Link to="/login" className="btn btn-outline">Log In</Link>
          }
        </div>
      </nav>

      {/* ── Ticker Banner ── */}
      {tickerItems.length > 0 && (
        <div className="ticker-bar">
          <span className="ticker-label">UPCOMING</span>
          <div className="ticker-track-wrap">
            <div className="ticker-track" ref={tickerRef}>
              {[...tickerItems, ...tickerItems].map((ev, i) => (
                <span key={i} className="ticker-item">
                  <span className="ticker-dot" />
                  <strong>{ev.clubs?.name}</strong>
                  &nbsp;·&nbsp;{ev.title}
                  &nbsp;
                  <span className="ticker-date">{formatEventDate(ev.event_date)}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="clubs-main">
        {/* ── Hero Header ── */}
        <div className="clubs-header">
          <span className="ca-eyebrow">Explore</span>
          <h1 className="clubs-title">All Clubs</h1>
          <p className="clubs-subtitle">Find your community.</p>
        </div>

        {/* ── Two-column layout: Stream | Grid ── */}
        <div className="clubs-layout">

          {/* ── Left: Activity Stream ── */}
          <aside className="stream-panel">
            <div className="stream-tabs">
              <button
                className={`stream-tab ${activeTab === 'announcements' ? 'stream-tab--active' : ''}`}
                onClick={() => setActiveTab('announcements')}
              >
                Announcements
              </button>
              <button
                className={`stream-tab ${activeTab === 'events' ? 'stream-tab--active' : ''}`}
                onClick={() => setActiveTab('events')}
              >
                Events
              </button>
            </div>

            <div className="stream-body">
              {activeTab === 'announcements' && (
                announcements.length === 0
                  ? <div className="stream-empty">No announcements yet.</div>
                  : announcements.map((ann, i) => (
                    <div className="stream-card" key={ann.id} style={{ animationDelay: `${i * 0.04}s` }}>
                      <div className="stream-card-avatar">
                        {ann.clubs?.image_url
                          ? <img src={ann.clubs.image_url} alt="" />
                          : <span>{ann.clubs?.name?.[0] ?? '?'}</span>
                        }
                      </div>
                      <div className="stream-card-content">
                        <div className="stream-card-meta">
                          <span className="stream-card-club">{ann.clubs?.name ?? 'Unknown Club'}</span>
                          <span className="stream-card-time">{timeAgo(ann.created_at)}</span>
                        </div>
                        <p className="stream-card-title">{ann.title}</p>
                        {ann.body && <p className="stream-card-body">{ann.body}</p>}
                      </div>
                    </div>
                  ))
              )}

              {activeTab === 'events' && (
                events.length === 0
                  ? <div className="stream-empty">No upcoming events.</div>
                  : events.map((ev, i) => (
                    <div className="stream-card stream-card--event" key={ev.id} style={{ animationDelay: `${i * 0.04}s` }}>
                      <div className="event-date-block">
                        <span className="event-month">
                          {new Date(ev.event_date).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="event-day">
                          {new Date(ev.event_date).getDate()}
                        </span>
                      </div>
                      <div className="stream-card-content">
                        <div className="stream-card-meta">
                          <span className="stream-card-club">{ev.clubs?.name ?? 'Unknown Club'}</span>
                          <span className="stream-card-time">
                            {new Date(ev.event_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="stream-card-title">{ev.title}</p>
                        {ev.location && (
                          <p className="stream-card-location">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                              <circle cx="12" cy="9" r="2.5"/>
                            </svg>
                            {ev.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </aside>

          {/* ── Right: Clubs Grid ── */}
          <div className="clubs-right">
            {/* Search + filter */}
            <div className="clubs-controls">
              <input
                className="clubs-search"
                type="text"
                placeholder="Search clubs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className="clubs-categories">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    className={`cat-pill ${category === cat ? 'cat-pill--active' : ''}`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="ca-error">{error}</p>}

            {loading ? (
              <div className="clubs-loading">Loading clubs…</div>
            ) : filtered.length === 0 ? (
              <div className="clubs-empty">
                <p>No clubs found.</p>
                {user && <Link to="/clubs/new" className="btn btn-solid">Create the first one</Link>}
              </div>
            ) : (
              <div className="clubs-grid">
                {filtered.map(club => (
                  <Link to={`/clubs/${club.id}`} key={club.id} className="club-card">
                    <div className="club-card-img">
                      {club.image_url
                        ? <img src={club.image_url} alt={club.name} />
                        : <div className="club-card-img-placeholder">{club.name[0]}</div>
                      }
                    </div>
                    <div className="club-card-body">
                      <div className="club-card-top">
                        <span className="club-card-category">{club.category || 'General'}</span>
                        <span className="club-card-members">
                          {club.club_members?.[0]?.count ?? 0} members
                        </span>
                      </div>
                      <h2 className="club-card-name">{club.name}</h2>
                      <p className="club-card-desc">
                        {club.description?.slice(0, 100)}{club.description?.length > 100 ? '…' : ''}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}