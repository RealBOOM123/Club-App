import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuth } from './useAuth'
import './Clubs.css'

const CATEGORIES = ['All', 'Sports', 'Arts', 'Technology', 'Music', 'Academic', 'Social', 'Other']

export default function Clubs() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [clubs, setClubs]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState('All')
  const [error, setError]         = useState(null)

  useEffect(() => {
    fetchClubs()
  }, [])

  async function fetchClubs() {
    setLoading(true)
    const { data, error } = await supabase
      .from('clubs')
      .select(`
        *,
        club_members(count)
      `)
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setClubs(data || [])
    setLoading(false)
  }

  const filtered = clubs.filter(c => {
    const matchSearch   = c.name.toLowerCase().includes(search.toLowerCase()) ||
                          c.description?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = category === 'All' || c.category === category
    return matchSearch && matchCategory
  })

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

      <main className="clubs-main">
        {/* Header */}
        <div className="clubs-header">
          <span className="ca-eyebrow">Explore</span>
          <h1 className="clubs-title">All Clubs</h1>
          <p className="clubs-subtitle">Find your community.</p>
        </div>

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

        {/* Error */}
        {error && <p className="ca-error">{error}</p>}

        {/* Grid */}
        {loading ? (
          <div className="clubs-loading">Loading clubs...</div>
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
      </main>
    </div>
  )
}