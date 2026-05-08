'use client'

import { useState } from 'react'
import { Doctor } from '@/types/pos'
import { updateDoctor } from '@/app/actions/doctor'
import { Pencil, Save, X, Loader2 } from 'lucide-react'

export default function DoctorEditForm({ doctor }: { doctor: Doctor }) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)
    try {
      await updateDoctor(doctor.id, {
        full_name: data.get('full_name') as string,
        license_no: (data.get('license_no') as string) || undefined,
        specialization: (data.get('specialization') as string) || undefined,
        consultation_fee: parseFloat(data.get('consultation_fee') as string) || 0,
        phone_no: (data.get('phone_no') as string) || undefined,
        address: (data.get('address') as string) || undefined,
        is_active: data.get('is_active') === 'true',
      })
      setEditing(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  if (!editing) {
    return (
      <div className="card">
        <div className="card-body" style={{ textAlign: 'center' }}>
          <button className="btn" onClick={() => setEditing(true)}>
            <Pencil size={16} /> Edit Doctor Info
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ maxWidth: '640px' }}>
      <div className="card-header">
        <h3 className="text-mono" style={{ fontSize: '14px' }}>Edit Doctor</h3>
        <button className="btn btn-sm" onClick={() => setEditing(false)}><X size={14} /> Cancel</button>
      </div>
      <div className="card-body">
        {error && <div className="alert alert-red" style={{ marginBottom: '16px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input name="full_name" type="text" className="form-input" defaultValue={doctor.full_name} required />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">License No</label>
              <input name="license_no" type="text" className="form-input" defaultValue={doctor.license_no || ''} />
            </div>
            <div className="form-group">
              <label className="form-label">Specialization</label>
              <input name="specialization" type="text" className="form-input" defaultValue={doctor.specialization || ''} />
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Consultation Fee</label>
              <input name="consultation_fee" type="number" step="0.01" className="form-input" defaultValue={doctor.consultation_fee} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input name="phone_no" type="tel" className="form-input" defaultValue={doctor.phone_no || ''} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea name="address" className="form-input" defaultValue={doctor.address || ''} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select name="is_active" className="form-input" defaultValue={doctor.is_active ? 'true' : 'false'}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </form>
      </div>
    </div>
  )
}
