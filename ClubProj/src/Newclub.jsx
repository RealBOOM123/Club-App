import { useState } from 'react'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuth } from './useAuth'
import './CreateAcc.css'
import './Newclub.css'

const CATEGORIES = ['Sports', 'Arts', 'Technology', 'Music', 'Academic', 'Social', 'Other']

export default function Newclub() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [name, setName]             = useState('')
  const [description, setDesc]      = useState('')
  const [category, setCategory]     = useState('')
  const [imageFile, setImageFile]   = useState(null)
  const [imagePreview, setPreview]  = useState(null)
  const [error, setError]           = useState(null)
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
  if (!authLoading && !user) {
    navigate('/login')
  }
  }, [user, authLoading, navigate])

  if (authLoading) return null
  if (!user) return null

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    let image_url = null

    // Upload image if provided
    if (imageFile) {
      const ext      = imageFile.name.split('.').pop()
      const filePath = `${user.id}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('club-images')
        .upload(filePath, imageFile)

      if (uploadError) {
        setError('Image upload failed: ' + uploadError.message)
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('club-images')
        .getPublicUrl(filePath)

      image_url = urlData.publicUrl
    }

    // Insert club
    const { data, error: insertError } = await supabase
      .from('clubs')
      .insert({
        name,
        description,
        category,
        image_url,
        created_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
    } else {
      navigate(`/clubs/${data.id}`)
    }

    setLoading(false)
  }

  return (
    <div className="create-account-page">
      <div className="bg-layer" />

      <nav className="navbar">
        <Link to="/" className="nav-logo">ClubHub</Link>
        <Link to="/clubs" className="btn btn-outline">← All Clubs</Link>
      </nav>

      <main className="ca-main">
        <div className="ca-card" style={{ maxWidth: '540px' }}>

          <div className="ca-header">
            <span className="ca-eyebrow">New Club</span>
            <h1 className="ca-title">Create a Club</h1>
            <p className="ca-subtitle">Start your community on ClubHub.</p>
          </div>

          <form className="ca-form" onSubmit={handleSubmit}>

            {/* Image upload */}
            <div className="ca-field">
              <label className="ca-label">Club Image</label>
              <label className="nc-image-upload">
                {imagePreview
                  ? <img src={imagePreview} alt="Preview" className="nc-image-preview" />
                  : <div className="nc-image-placeholder">
                      <span className="nc-upload-icon">+</span>
                      <span>Click to upload image</span>
                    </div>
                }
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <div className="ca-field">
              <label className="ca-label">Club Name</label>
              <input
                className="ca-input"
                type="text"
                placeholder="e.g. Photography Club"
                required
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="ca-field">
              <label className="ca-label">Description</label>
              <textarea
                className="ca-input nc-textarea"
                placeholder="What's your club about?"
                rows={3}
                value={description}
                onChange={e => setDesc(e.target.value)}
              />
            </div>

            <div className="ca-field">
              <label className="ca-label">Category</label>
              <div className="nc-category-grid">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`nc-cat-btn ${category === cat ? 'nc-cat-btn--active' : ''}`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="ca-error">{error}</p>}

            <button className="ca-submit" type="submit" disabled={loading || !name || !category}>
              {loading ? 'Creating...' : 'Create Club'}
            </button>

          </form>
        </div>
      </main>
    </div>
  )
}