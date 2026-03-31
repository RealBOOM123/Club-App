import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuth } from './useAuth'
import './FormPage.css'

export default function NewEventPage() {
  const { id: clubId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
  })
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState(null)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    setSaving(true); setError(null)

    const { data, error: insertErr } = await supabase
      .from('events')
      .insert({
        club_id:     clubId,
        title:       form.title.trim(),
        description: form.description.trim() || null,
        date:        form.date || null,
        location:    form.location.trim() || null,
        created_by:  user.id,
      })
      .select()
      .single()

    if (insertErr) {
      setError(insertErr.message)
      setSaving(false)
      return
    }

    navigate(`/clubs/${clubId}/events/${data.id}`)
  }

  return (
    <div className="form-page">
      <div className="fp-bg-layer" />

      <nav className="fp-navbar">
        <Link to="/" className="fp-nav-logo">ClubHub</Link>
        <div className="fp-nav-actions">
          <Link to={`/clubs/${clubId}`} className="btn btn-outline">← Back to Club</Link>
        </div>
      </nav>

      <main className="fp-main">
        <div className="fp-card" style={{ animationDelay: '0s' }}>
          <h1 className="fp-title">Add Event</h1>
          <p className="fp-subtitle">Create a new event for your club members.</p>

          {error && <div className="fp-error">{error}</div>}

          <form onSubmit={handleSubmit} className="fp-form">

            <div className="fp-field">
              <label className="fp-label" htmlFor="title">Event Title *</label>
              <input
                id="title" name="title" type="text"
                className="fp-input"
                placeholder="e.g. Weekly Meetup"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="fp-field">
              <label className="fp-label" htmlFor="description">Description</label>
              <textarea
                id="description" name="description"
                className="fp-input fp-textarea"
                placeholder="What's happening at this event?"
                value={form.description}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="fp-row">
              <div className="fp-field">
                <label className="fp-label" htmlFor="date">Date & Time</label>
                <input
                  id="date" name="date" type="datetime-local"
                  className="fp-input"
                  value={form.date}
                  onChange={handleChange}
                />
              </div>

              <div className="fp-field">
                <label className="fp-label" htmlFor="location">Location</label>
                <input
                  id="location" name="location" type="text"
                  className="fp-input"
                  placeholder="e.g. Room 204, Online"
                  value={form.location}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="fp-actions">
              <Link to={`/clubs/${clubId}`} className="btn btn-ghost">Cancel</Link>
              <button type="submit" className="btn btn-solid" disabled={saving}>
                {saving ? 'Creating…' : 'Create Event'}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  )
}   