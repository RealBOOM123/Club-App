import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuth } from './useAuth'
import './FormPage.css'

const CATEGORIES = [
  'Academic', 'Arts', 'Community', 'Gaming', 'Health & Fitness',
  'Music', 'Outdoors', 'Professional', 'Social', 'Sports', 'Technology', 'Other',
]

export default function EditClubPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '', description: '', category: '', image_url: '',
  })
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError]       = useState(null)
  const [confirm, setConfirm]   = useState(false)

  useEffect(() => { fetchClub() }, [id])

  async function fetchClub() {
    const { data, error: err } = await supabase
      .from('clubs').select('*').eq('id', id).single()

    if (err || !data) { setError('Club not found.'); setLoading(false); return }
    if (data.created_by !== user?.id) { navigate(`/clubs/${id}`); return }

    setForm({
      name:        data.name        || '',
      description: data.description || '',
      category:    data.category    || '',
      image_url:   data.image_url   || '',
    })
    setLoading(false)
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Club name is required.'); return }
    setSaving(true); setError(null)

    const { error: updateErr } = await supabase
      .from('clubs')
      .update({
        name:        form.name.trim(),
        description: form.description.trim() || null,
        category:    form.category || null,
        image_url:   form.image_url.trim() || null,
      })
      .eq('id', id)

    if (updateErr) { setError(updateErr.message); setSaving(false); return }
    navigate(`/clubs/${id}`)
  }

  async function handleDelete() {
    if (!confirm) { setConfirm(true); return }
    setDeleting(true)

    // Delete related data first
    await supabase.from('event_rsvps').delete().in(
      'event_id',
      (await supabase.from('events').select('id').eq('club_id', id)).data?.map(e => e.id) || []
    )
    await supabase.from('events').delete().eq('club_id', id)
    await supabase.from('club_members').delete().eq('club_id', id)
    await supabase.from('clubs').delete().eq('id', id)

    navigate('/clubs')
  }

  if (loading) return <div className="fp-loading">Loading…</div>

  return (
    <div className="form-page">
      <div className="fp-bg-layer" />

      <nav className="fp-navbar">
        <Link to="/" className="fp-nav-logo">ClubHub</Link>
        <div className="fp-nav-actions">
          <Link to={`/clubs/${id}`} className="btn btn-outline">← Back to Club</Link>
        </div>
      </nav>

      <main className="fp-main">
        <div className="fp-card">
          <h1 className="fp-title">Edit Club</h1>
          <p className="fp-subtitle">Update your club's details and settings.</p>

          {error && <div className="fp-error">{error}</div>}

          <form onSubmit={handleSubmit} className="fp-form">

            <div className="fp-field">
              <label className="fp-label" htmlFor="name">Club Name *</label>
              <input
                id="name" name="name" type="text"
                className="fp-input"
                placeholder="Your club's name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="fp-field">
              <label className="fp-label" htmlFor="description">Description</label>
              <textarea
                id="description" name="description"
                className="fp-input fp-textarea"
                placeholder="What is this club about?"
                value={form.description}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="fp-row">
              <div className="fp-field">
                <label className="fp-label" htmlFor="category">Category</label>
                <select
                  id="category" name="category"
                  className="fp-input fp-select"
                  value={form.category}
                  onChange={handleChange}
                >
                  <option value="">— Select a category —</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="fp-field">
                <label className="fp-label" htmlFor="image_url">Image URL</label>
                <input
                  id="image_url" name="image_url" type="url"
                  className="fp-input"
                  placeholder="https://…"
                  value={form.image_url}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Image preview */}
            {form.image_url && (
              <div className="fp-img-preview">
                <img src={form.image_url} alt="preview" onError={e => e.target.style.display='none'} />
              </div>
            )}

            <div className="fp-actions">
              <Link to={`/clubs/${id}`} className="btn btn-ghost">Cancel</Link>
              <button type="submit" className="btn btn-solid" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Danger zone */}
          <div className="fp-danger-zone">
            <h3 className="fp-danger-title">Danger Zone</h3>
            <p className="fp-danger-desc">
              Deleting this club will permanently remove all events, RSVPs, and members.
            </p>
            <button
              className={`btn ${confirm ? 'btn-danger-confirm' : 'btn-danger'}`}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : confirm ? '⚠ Confirm Delete Club' : 'Delete Club'}
            </button>
            {confirm && (
              <button className="btn btn-ghost fp-cancel-del" onClick={() => setConfirm(false)}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}