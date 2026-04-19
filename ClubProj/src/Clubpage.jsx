import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuth } from './useAuth'
import { useClubRole } from './Useclubrole'
import './ClubPage.css'

export default function ClubPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [club, setClub]                   = useState(null)
  const [events, setEvents]               = useState([])
  const [members, setMembers]             = useState(0)
  const [isMember, setIsMember]           = useState(false)
  const [loading, setLoading]             = useState(true)
  const [joining, setJoining]             = useState(false)
  const [error, setError]                 = useState(null)
  const [activeTab, setActiveTab]         = useState('feed')
  const [announcements, setAnnouncements] = useState([])
  const [annText, setAnnText]             = useState('')
  const [posting, setPosting]             = useState(false)
  const [calMonth, setCalMonth]           = useState(new Date())
  const [memberList, setMemberList]       = useState([])
  const [bans, setBans]                   = useState([])
  const [banModal, setBanModal]           = useState(null)
  const [banReason, setBanReason]         = useState('')
  const [banDuration, setBanDuration]     = useState('permanent')
  const [isBanned, setIsBanned]           = useState(false)

  const { role, isOfficer, isAdmin, canPost, refetch: refetchRole } =
    useClubRole(id, club?.created_by)

  useEffect(() => { fetchClub() }, [id, user])

  async function fetchClub() {
    setLoading(true)
    const { data: clubData, error: clubError } = await supabase
      .from('clubs').select('*').eq('id', id).single()
    if (clubError) { setError('Club not found.'); setLoading(false); return }
    setClub(clubData)

    const { data: eventsData } = await supabase
      .from('events').select('*').eq('club_id', id).order('date', { ascending: true })
    setEvents(eventsData || [])

    const { count } = await supabase
      .from('club_members').select('*', { count: 'exact', head: true }).eq('club_id', id)
    setMembers(count || 0)

    if (user) {
      const { data: memberData } = await supabase
        .from('club_members').select('id').eq('club_id', id).eq('user_id', user.id).single()
      setIsMember(!!memberData)

      const { data: banData } = await supabase
        .from('club_bans').select('id, expires_at').eq('club_id', id).eq('user_id', user.id).single()
      if (banData) {
        const expired = banData.expires_at && new Date(banData.expires_at) < new Date()
        if (!expired) setIsBanned(true)
      }
    }

    await Promise.all([fetchAnnouncements(), fetchMembers()])
    setLoading(false)
  }

  async function fetchAnnouncements() {
    const { data } = await supabase
      .from('announcements')
      .select('id, content, created_at, user_id, profiles(full_name, avatar_url)')
      .eq('club_id', id)
      .order('created_at', { ascending: false })
      .limit(20)
    setAnnouncements(data || [])
  }

  async function fetchMembers() {
    const { data } = await supabase
      .from('club_members')
      .select('id, user_id, joined_at, profiles(full_name, email, avatar_url), club_roles(role)')
      .eq('club_id', id)
      .order('joined_at', { ascending: true })
    setMemberList(data || [])
  }

  async function fetchBans() {
    const { data } = await supabase
      .from('club_bans')
      .select('id, user_id, reason, expires_at, created_at, profiles(full_name, email)')
      .eq('club_id', id)
      .order('created_at', { ascending: false })
    setBans(data || [])
  }

  async function handleJoin() {
    if (!user) { navigate('/login'); return }
    if (isBanned) return
    setJoining(true)
    if (isMember) {
      await supabase.from('club_members').delete().eq('club_id', id).eq('user_id', user.id)
      await supabase.from('club_roles').delete().eq('club_id', id).eq('user_id', user.id)
      setMembers(m => m - 1); setIsMember(false)
    } else {
      await supabase.from('club_members').insert({ club_id: id, user_id: user.id })
      await supabase.from('club_roles').upsert({ club_id: id, user_id: user.id, role: 'member' }, { onConflict: 'club_id,user_id' })
      setMembers(m => m + 1); setIsMember(true)
    }
    await refetchRole()
    setJoining(false)
  }

  async function handlePostAnnouncement() {
    if (!annText.trim()) return
    setPosting(true)
    await supabase.from('announcements').insert({ club_id: id, user_id: user.id, content: annText.trim() })
    setAnnText('')
    await fetchAnnouncements()
    setPosting(false)
  }

  async function handleDeleteAnnouncement(annId) {
    await supabase.from('announcements').delete().eq('id', annId)
    setAnnouncements(prev => prev.filter(a => a.id !== annId))
  }

  async function handleChangeRole(userId, newRole) {
    await supabase.from('club_roles')
      .upsert({ club_id: id, user_id: userId, role: newRole }, { onConflict: 'club_id,user_id' })
    await fetchMembers()
  }

  async function handleRemoveMember(userId) {
    await supabase.from('club_members').delete().eq('club_id', id).eq('user_id', userId)
    await supabase.from('club_roles').delete().eq('club_id', id).eq('user_id', userId)
    setMembers(m => m - 1)
    await fetchMembers()
  }

  async function handleBan() {
    if (!banModal) return
    let expires_at = null
    if (banDuration === '7d')  expires_at = new Date(Date.now() + 7  * 86400000).toISOString()
    if (banDuration === '30d') expires_at = new Date(Date.now() + 30 * 86400000).toISOString()
    if (banDuration === '90d') expires_at = new Date(Date.now() + 90 * 86400000).toISOString()

    await supabase.from('club_bans').upsert({
      club_id: id, user_id: banModal.userId, banned_by: user.id,
      reason: banReason || null, expires_at,
    }, { onConflict: 'club_id,user_id' })

    await handleRemoveMember(banModal.userId)
    setBanModal(null); setBanReason(''); setBanDuration('permanent')
    await fetchBans()
  }

  async function handleUnban(userId) {
    await supabase.from('club_bans').delete().eq('club_id', id).eq('user_id', userId)
    await fetchBans()
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'TBD'
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function getRoleBadgeClass(r) {
    if (r === 'admin')   return 'role-badge role-badge--admin'
    if (r === 'officer') return 'role-badge role-badge--officer'
    return 'role-badge role-badge--member'
  }

  function renderCalendar() {
    const year  = calMonth.getFullYear()
    const month = calMonth.getMonth()
    const days  = new Date(year, month + 1, 0).getDate()
    const first = new Date(year, month, 1).getDay()
    const today = new Date()
    const cells = []
    for (let i = 0; i < first; i++) cells.push(null)
    for (let d = 1; d <= days; d++) cells.push(d)

    return (
      <div className="club-calendar">
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}>‹</button>
          <span className="cal-month-label">{calMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</span>
          <button className="cal-nav-btn" onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}>›</button>
        </div>
        <div className="cal-grid">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="cal-day-header">{d}</div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} className="cal-cell cal-cell--empty" />
            const dayEvents = events.filter(e => {
              if (!e.date) return false
              const d = new Date(e.date)
              return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
            })
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
            return (
              <div key={day} className={`cal-cell ${isToday ? 'cal-cell--today' : ''} ${dayEvents.length ? 'cal-cell--has-event' : ''}`}>
                <span className="cal-day-num">{day}</span>
                {dayEvents.map(e => (
                  <Link key={e.id} to={`/clubs/${id}/events/${e.id}`} className="cal-event-chip" title={e.title}>{e.title}</Link>
                ))}
              </div>
            )
          })}
        </div>
        <div className="cal-upcoming">
          <h3 className="cal-upcoming-title">All Events</h3>
          {events.length === 0 ? <p className="club-empty">No events yet.</p> : events.map(event => (
            <Link to={`/clubs/${id}/events/${event.id}`} className="event-card" key={event.id} style={{ textDecoration: 'none' }}>
              <div className="event-date-block">
                <span className="event-month">{event.date ? new Date(event.date).toLocaleString('en-US', { month: 'short' }) : '—'}</span>
                <span className="event-day">{event.date ? new Date(event.date).getDate() : '—'}</span>
              </div>
              <div className="event-info">
                <h3 className="event-title">{event.title}</h3>
                {event.description && <p className="event-desc">{event.description}</p>}
                <div className="event-meta">
                  {event.location && <span>📍 {event.location}</span>}
                  <span>{formatDate(event.date)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  if (loading) return <div className="dash-loading">Loading...</div>
  if (error)   return <div className="dash-loading">{error}</div>

  const tabs = [
    { key: 'feed',     label: 'Feed' },
    { key: 'calendar', label: 'Calendar', badge: events.length || null },
    { key: 'members',  label: 'Members',  badge: members || null },
    ...(isOfficer ? [{ key: 'manage', label: 'Manage' }] : []),
  ]

  return (
    <div className="club-page">
      <div className="bg-layer" />

      {/* Ban Modal */}
      {banModal && (
        <div className="modal-overlay" onClick={() => setBanModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Ban {banModal.name}</h2>
            <p className="modal-subtitle">This will remove them and prevent rejoining for the selected period.</p>
            <label className="modal-label">Reason (optional)</label>
            <input className="modal-input" placeholder="e.g. Violating club rules" value={banReason} onChange={e => setBanReason(e.target.value)} />
            <label className="modal-label">Duration</label>
            <div className="modal-duration-grid">
              {[{ value: '7d', label: '7 Days' }, { value: '30d', label: '30 Days' }, { value: '90d', label: '90 Days' }, { value: 'permanent', label: 'Permanent' }].map(opt => (
                <button key={opt.value} className={`modal-dur-btn ${banDuration === opt.value ? 'modal-dur-btn--active' : ''}`} onClick={() => setBanDuration(opt.value)}>{opt.label}</button>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setBanModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleBan}>Ban Member</button>
            </div>
          </div>
        </div>
      )}

      <nav className="navbar">
        <Link to="/" className="nav-logo">ClubHub</Link>
        <div className="nav-actions">
          <Link to="/clubs" className="btn btn-outline">← All Clubs</Link>
          {user && <Link to="/dashboard" className="btn btn-outline">Dashboard</Link>}
        </div>
      </nav>

      <main className="club-main">
        <div className="club-hero">
          <div className="club-hero-img">
            {club.image_url ? <img src={club.image_url} alt={club.name} /> : <div className="club-hero-placeholder">{club.name[0]}</div>}
          </div>
          <div className="club-hero-info">
            <span className="ca-eyebrow">{club.category || 'General'}</span>
            <h1 className="club-name">{club.name}</h1>
            <p className="club-desc">{club.description}</p>
            <div className="club-meta">
              <span className="club-meta-item">{members} members</span>
              <span className="club-meta-dot" />
              <span className="club-meta-item">{events.length} events</span>
              {role && <><span className="club-meta-dot" /><span className={getRoleBadgeClass(role)}>{role}</span></>}
            </div>
            <div className="club-actions">
              {isBanned ? (
                <span className="club-banned-notice">You are banned from this club.</span>
              ) : (
                <button className={`btn btn-lg ${isMember ? 'btn-outline' : 'btn-solid'}`} onClick={handleJoin} disabled={joining}>
                  {joining ? '...' : isMember ? 'Leave Club' : 'Join Club'}
                </button>
              )}
              {isAdmin && <Link to={`/clubs/${id}/edit`} className="btn btn-outline btn-lg">Edit Club</Link>}
            </div>
          </div>
        </div>

        <div className="divider" />

        <div className="club-tabs">
          {tabs.map(t => (
            <button key={t.key} className={`club-tab ${activeTab === t.key ? 'club-tab--active' : ''}`}
              onClick={() => { setActiveTab(t.key); if (t.key === 'manage') fetchBans() }}>
              {t.label}
              {t.badge ? <span className="club-tab-badge">{t.badge}</span> : null}
            </button>
          ))}
        </div>

        {/* Feed */}
        {activeTab === 'feed' && (
          <div className="club-feed">
            {canPost && (
              <div className="ann-composer">
                <textarea className="ann-input" placeholder="Post an announcement..." value={annText} onChange={e => setAnnText(e.target.value)} rows={3} />
                <div className="ann-composer-actions">
                  {isAdmin && <Link to={`/clubs/${id}/events/new`} className="btn btn-outline">+ Add Event</Link>}
                  <button className="btn btn-solid" onClick={handlePostAnnouncement} disabled={posting || !annText.trim()}>
                    {posting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            )}
            {announcements.length === 0 ? <p className="club-empty">No announcements yet.</p> : (
              <div className="ann-list">
                {announcements.map(a => {
                  const name = a.profiles?.full_name || 'Club Officer'
                  const avatar = a.profiles?.avatar_url
                  return (
                    <div className="ann-post" key={a.id}>
                      <div className="ann-post-header">
                        <div className="ann-avatar">
                          {avatar ? <img src={avatar} alt={name} /> : <span>{getInitials(name)}</span>}
                        </div>
                        <div className="ann-post-meta">
                          <span className="ann-post-author">{name}</span>
                          <span className="ann-post-time">{timeAgo(a.created_at)}</span>
                        </div>
                        {canPost && <button className="ann-delete-btn" onClick={() => handleDeleteAnnouncement(a.id)}>✕</button>}
                      </div>
                      <p className="ann-post-content">{a.content}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Calendar */}
        {activeTab === 'calendar' && (
          <div className="club-calendar-tab">
            {isAdmin && <div className="cal-add-event"><Link to={`/clubs/${id}/events/new`} className="btn btn-solid">+ Add Event</Link></div>}
            {renderCalendar()}
          </div>
        )}

        {/* Members */}
        {activeTab === 'members' && (
          <div className="club-members-tab">
            <div className="members-list">
              {memberList.length === 0 ? <p className="club-empty">No members yet.</p> : memberList.map(m => {
                const profile   = m.profiles
                const name      = profile?.full_name || profile?.email || 'Unknown'
                const avatar    = profile?.avatar_url
                const memRole   = m.club_roles?.[0]?.role || 'member'
                const isSelf    = user?.id === m.user_id
                const isCreator = club.created_by === m.user_id
                return (
                  <div className="member-row" key={m.id}>
                    <div className="member-left">
                      <div className="ann-avatar">
                        {avatar ? <img src={avatar} alt={name} /> : <span>{getInitials(name)}</span>}
                      </div>
                      <div className="member-info">
                        <span className="member-name">{name}{isSelf ? ' (you)' : ''}</span>
                        <span className="member-email">{profile?.email}</span>
                      </div>
                    </div>
                    <div className="member-right">
                      <span className={getRoleBadgeClass(isCreator ? 'admin' : memRole)}>{isCreator ? 'admin' : memRole}</span>
                      {isAdmin && !isSelf && !isCreator && (
                        <select className="role-select" value={memRole} onChange={e => handleChangeRole(m.user_id, e.target.value)}>
                          <option value="member">Member</option>
                          <option value="officer">Officer</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                      {isOfficer && !isSelf && !isCreator && (
                        <div className="member-actions">
                          <button className="btn-sm btn-ghost-sm" onClick={() => handleRemoveMember(m.user_id)}>Remove</button>
                          <button className="btn-sm btn-danger-sm" onClick={() => setBanModal({ userId: m.user_id, name })}>Ban</button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Manage (officer/admin only) */}
        {activeTab === 'manage' && isOfficer && (
          <div className="club-manage-tab">
            <div className="manage-section">
              <h2 className="manage-section-title">Active Bans</h2>
              {bans.length === 0 ? <p className="club-empty">No active bans.</p> : (
                <div className="bans-list">
                  {bans.map(ban => {
                    const name    = ban.profiles?.full_name || ban.profiles?.email || 'Unknown'
                    const expired = ban.expires_at && new Date(ban.expires_at) < new Date()
                    return (
                      <div className="ban-row" key={ban.id}>
                        <div className="ban-info">
                          <span className="ban-name">{name}</span>
                          {ban.reason && <span className="ban-reason">"{ban.reason}"</span>}
                          <span className="ban-expires">
                            {expired ? 'Expired' : ban.expires_at ? `Expires ${new Date(ban.expires_at).toLocaleDateString()}` : 'Permanent'}
                          </span>
                        </div>
                        <button className="btn-sm btn-ghost-sm" onClick={() => handleUnban(ban.user_id)}>Unban</button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="manage-section">
              <h2 className="manage-section-title">Events & Attendance</h2>
              {events.length === 0 ? <p className="club-empty">No events yet.</p> : (
                <div className="manage-events-list">
                  {events.map(e => (
                    <Link key={e.id} to={`/clubs/${id}/events/${e.id}`} className="manage-event-row">
                      <span className="manage-event-title">{e.title}</span>
                      <span className="manage-event-date">{formatDate(e.date)}</span>
                      <span className="manage-event-action">Manage Attendance →</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}