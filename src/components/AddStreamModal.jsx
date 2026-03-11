import { useState } from 'react'
import apiFetch from '../api.js'

export default function AddStreamModal({ onClose, onCreated }) {
  const [handle, setHandle] = useState('')
  const [lookupResult, setLookupResult] = useState(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState('')

  const [form, setForm] = useState({
    name: '',
    link: '',
    color: '#6272a4',
    region: '',
    subregion: '',
    bias_label: '',
    bias_color: '',
    video_id: '',
    channel_id: '',
    icon_url: '',
  })

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  async function lookupHandle() {
    if (!handle.trim()) return
    setLookupLoading(true)
    setLookupError('')
    setLookupResult(null)
    try {
      const res = await apiFetch('/api/admin/streams/lookup?handle=' + encodeURIComponent(handle.trim()))
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Lookup failed')
      }
      const data = await res.json()
      setLookupResult(data)
      setForm((f) => ({
        ...f,
        name: data.name || f.name,
        channel_id: data.channel_id || f.channel_id,
        icon_url: data.icon_url || f.icon_url,
        link: data.link || f.link,
        video_id: data.video_id || f.video_id,
      }))
    } catch (err) {
      setLookupError(err.message)
    } finally {
      setLookupLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    try {
      const res = await apiFetch('/api/admin/streams/create', {
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Create failed')
      }
      onCreated()
      onClose()
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Stream</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="lookup-section">
            <label>YouTube Handle Lookup</label>
            <div className="lookup-row">
              <input
                type="text"
                placeholder="@ChannelHandle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
              />
              <button onClick={lookupHandle} disabled={lookupLoading || !handle.trim()}>
                {lookupLoading ? 'Looking up...' : 'Lookup'}
              </button>
            </div>
            {lookupError && <div className="field-error">{lookupError}</div>}
            {lookupResult && (
              <div className="lookup-result">
                {lookupResult.icon_url && <img src={lookupResult.icon_url} alt="" className="lookup-icon" />}
                <span>{lookupResult.name || 'Found'}</span>
              </div>
            )}
          </div>

          <hr className="modal-divider" />

          {saveError && <div className="login-error">{saveError}</div>}

          <form onSubmit={handleSubmit} className="add-stream-form">
            <div className="form-grid">
              <div className="form-field">
                <label>Name *</label>
                <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
              </div>
              <div className="form-field">
                <label>Link</label>
                <input type="text" value={form.link} onChange={(e) => updateField('link', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Color</label>
                <div className="color-input-row">
                  <input type="color" value={form.color} onChange={(e) => updateField('color', e.target.value)} />
                  <input type="text" value={form.color} onChange={(e) => updateField('color', e.target.value)} />
                </div>
              </div>
              <div className="form-field">
                <label>Region</label>
                <input type="text" value={form.region} onChange={(e) => updateField('region', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Subregion</label>
                <input type="text" value={form.subregion} onChange={(e) => updateField('subregion', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Bias Label</label>
                <input type="text" value={form.bias_label} onChange={(e) => updateField('bias_label', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Bias Color</label>
                <div className="color-input-row">
                  <input type="color" value={form.bias_color || '#6272a4'} onChange={(e) => updateField('bias_color', e.target.value)} />
                  <input type="text" value={form.bias_color} onChange={(e) => updateField('bias_color', e.target.value)} />
                </div>
              </div>
              <div className="form-field">
                <label>Video ID</label>
                <input type="text" value={form.video_id} onChange={(e) => updateField('video_id', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Channel ID</label>
                <input type="text" value={form.channel_id} onChange={(e) => updateField('channel_id', e.target.value)} />
              </div>
              <div className="form-field full-width">
                <label>Icon URL</label>
                <input type="text" value={form.icon_url} onChange={(e) => updateField('icon_url', e.target.value)} />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" disabled={saving || !form.name.trim()}>
                {saving ? 'Creating...' : 'Create Stream'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
