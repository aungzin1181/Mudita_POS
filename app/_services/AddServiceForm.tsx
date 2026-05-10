'use client'

import { useState } from 'react'
import { createService } from '@/app/actions/service'
import { Plus, Loader2 } from 'lucide-react'

export default function AddServiceForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      await createService({
        name: formData.get('name') as string,
        type: formData.get('type') as 'consultation' | 'procedure',
        default_price: parseFloat(formData.get('default_price') as string),
      })
      form.reset()
    } catch (err: any) {
      setError(err.message || 'Failed to add service')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-mono" style={{ fontSize: '14px' }}>Add New Service</h3>
      </div>
      <div className="card-body">
        {error && <div className="alert alert-red mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Service Name</label>
            <input
              name="name"
              type="text"
              className="form-input"
              placeholder="e.g. Specialist Consultation"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select name="type" className="form-input" required>
              <option value="consultation">Consultation</option>
              <option value="procedure">Procedure</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Default Price (MMK)</label>
            <input
              name="default_price"
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              placeholder="0.00"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full justify-center"
            disabled={loading}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Add Service
          </button>
        </form>
      </div>
    </div>
  )
}
