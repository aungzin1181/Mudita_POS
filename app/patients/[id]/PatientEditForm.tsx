'use client'

import { useState, useEffect } from 'react'
import { Patient } from '@/types/pos'
import { updatePatient } from '@/app/actions/patient'
import { Pencil, Save, X, Loader2 } from 'lucide-react'

export default function PatientEditForm({ patient }: { patient: Patient }) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [age, setAge] = useState<string>(patient.age?.toString() || '')
  const [dob, setDob] = useState<string>(patient.date_of_birth || '')

  // Calculate age when DOB changes
  useEffect(() => {
    if (!dob) return
    const birthDate = new Date(dob)
    const today = new Date()
    if (isNaN(birthDate.getTime())) return

    let calculatedAge = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--
    }
    setAge(calculatedAge >= 0 ? calculatedAge.toString() : '0')
  }, [dob])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const data = new FormData(form)

    try {
      await updatePatient(patient.id, {
        full_name: data.get('full_name') as string,
        gender: data.get('gender') as 'male' | 'female' | 'other',
        age: parseInt(data.get('age') as string) || undefined,
        date_of_birth: (data.get('date_of_birth') as string) || undefined,
        phone_no: (data.get('phone_no') as string) || undefined,
        address: (data.get('address') as string) || undefined,
        blood_type: (data.get('blood_type') as string) || undefined,
        blood_pressure: (data.get('blood_pressure') as string) || undefined,
        weight: parseFloat(data.get('weight') as string) || undefined,
        spo2: parseInt(data.get('spo2') as string) || undefined,
        medical_history: (data.get('medical_history') as string) || undefined,
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
            <Pencil size={16} /> Edit Patient Info
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-mono" style={{ fontSize: '14px' }}>Edit Patient</h3>
        <button className="btn btn-sm" onClick={() => setEditing(false)}>
          <X size={14} /> Cancel
        </button>
      </div>
      <div className="card-body">
        {error && <div className="alert alert-red" style={{ marginBottom: '16px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input name="full_name" type="text" className="form-input" defaultValue={patient.full_name} required />
          </div>
          
          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select name="gender" className="form-input" defaultValue={patient.gender}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input 
                name="date_of_birth" 
                type="date" 
                className="form-input" 
                value={dob} 
                onChange={(e) => setDob(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Age (Auto)</label>
              <input 
                name="age" 
                type="number" 
                className="form-input" 
                value={age} 
                onChange={(e) => setAge(e.target.value)} 
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input name="phone_no" type="tel" className="form-input" defaultValue={patient.phone_no || ''} />
            </div>
            <div className="form-group">
              <label className="form-label">Blood Type</label>
              <select name="blood_type" className="form-input" defaultValue={patient.blood_type || ''}>
                <option value="">— Select —</option>
                <option>A+</option><option>A-</option>
                <option>B+</option><option>B-</option>
                <option>O+</option><option>O-</option>
                <option>AB+</option><option>AB-</option>
              </select>
            </div>
          </div>

          <div className="form-grid-3">
             <div className="form-group">
                <label className="form-label">BP</label>
                <input name="blood_pressure" type="text" className="form-input" defaultValue={patient.blood_pressure || ''} />
             </div>
             <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input name="weight" type="number" step="0.1" className="form-input" defaultValue={patient.weight || ''} />
             </div>
             <div className="form-group">
                <label className="form-label">SPO2 (%)</label>
                <input name="spo2" type="number" className="form-input" defaultValue={patient.spo2 || ''} />
             </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <input name="address" type="text" className="form-input" defaultValue={patient.address || ''} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Medical History</label>
            <textarea name="medical_history" className="form-input" defaultValue={patient.medical_history || ''} style={{ minHeight: '100px' }} />
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
