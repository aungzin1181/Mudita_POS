'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react'
import { createPatient } from '@/app/actions/patient'

export default function NewPatientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const [age, setAge] = useState<string>('')
  const [dob, setDob] = useState<string>('')

  // Calculate age when DOB changes
  useEffect(() => {
    if (!dob) {
      setAge('')
      return
    }
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
    setError(null)

    const form = e.currentTarget
    const data = new FormData(form)

    try {
      const patient = await createPatient({
        full_name: data.get('full_name') as string,
        gender: data.get('gender') as 'male' | 'female' | 'other',
        age: parseInt(data.get('age') as string) || undefined,
        date_of_birth: (data.get('date_of_birth') as string) || undefined,
        phone_no: (data.get('phone_no') as string) || undefined,
        address: (data.get('address') as string) || undefined,
        blood_type: (data.get('blood_type') as string) || undefined,
        medical_history: (data.get('medical_history') as string) || undefined,
      })
      router.push(`/patients/${patient.id}`)
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <Link href="/patients" className="btn" style={{ border: 'none', background: 'none', paddingLeft: 0, marginBottom: '16px' }}>
        <ArrowLeft size={16} /> Back to Patients
      </Link>

      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <div className="page-eyebrow">Medical Records</div>
          <h1 className="page-title">Register <em>New Patient</em></h1>
        </div>
      </div>

      {error && (
        <div className="alert alert-red" style={{ marginBottom: '20px', padding: '16px' }}>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>Registration Failed</div>
          <div style={{ fontSize: '13px' }}>
            {typeof error === 'string' ? error : (error.message || JSON.stringify(error))}
          </div>
          {error.details && (
            <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
              Details: {error.details}
            </div>
          )}
          {error.hint && (
            <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.8 }}>
              Hint: {error.hint}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ maxWidth: 680 }}>
          {/* MAIN INFO */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h3 className="text-mono" style={{ fontSize: '14px' }}>Personal Information</h3>
            </div>
            <div className="card-body">
              {/* Row 1: Full Name + Gender */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input name="full_name" type="text" className="form-input" placeholder="e.g. Ko Aung" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender *</label>
                  <select name="gender" className="form-input" required>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Blood Type + Date of Birth + Age */}
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Blood Type</label>
                  <select name="blood_type" className="form-input">
                    <option value="">— Select —</option>
                    <option>A+</option><option>A-</option>
                    <option>B+</option><option>B-</option>
                    <option>O+</option><option>O-</option>
                    <option>AB+</option><option>AB-</option>
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
                    placeholder="Years"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input name="phone_no" type="tel" className="form-input" placeholder="09 xxx xxx xxx" />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea name="address" className="form-input" placeholder="Full address…" />
              </div>
              <div className="form-group">
                <label className="form-label">Medical History</label>
                <textarea name="medical_history" className="form-input" placeholder="Known allergies, chronic conditions, previous surgeries…" style={{ minHeight: '100px' }} />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <UserPlus size={18} />
                )}
                Register Patient
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
