'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react'
import { createDoctor } from '@/app/actions/doctor'

export default function NewDoctorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)

    try {
      const doc = await createDoctor({
        full_name: data.get('full_name') as string,
        license_no: (data.get('license_no') as string) || undefined,
        specialization: (data.get('specialization') as string) || undefined,
        consultation_fee: parseFloat(data.get('consultation_fee') as string) || 0,
        phone_no: (data.get('phone_no') as string) || undefined,
        address: (data.get('address') as string) || undefined,
      })
      router.push(`/doctors/${doc.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create doctor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <Link href="/doctors" className="btn" style={{ border: 'none', background: 'none', paddingLeft: 0, marginBottom: '16px' }}>
        <ArrowLeft size={16} /> Back to Doctors
      </Link>

      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <div className="page-eyebrow">Staff</div>
          <h1 className="page-title">Add <em>New Doctor</em></h1>
        </div>
      </div>

      {error && <div className="alert alert-red" style={{ marginBottom: '20px' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ maxWidth: '640px' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="text-mono" style={{ fontSize: '14px' }}>Doctor Information</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input name="full_name" type="text" className="form-input" placeholder="Dr. Aung Aung" required />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">License No</label>
                <input name="license_no" type="text" className="form-input" placeholder="MDR-123456" />
              </div>
              <div className="form-group">
                <label className="form-label">Specialization</label>
                <input name="specialization" type="text" className="form-input" placeholder="General Practitioner" />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Consultation Fee</label>
                <input name="consultation_fee" type="number" step="0.01" min="0" className="form-input" placeholder="0.00" defaultValue="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input name="phone_no" type="tel" className="form-input" placeholder="09 xxx xxx xxx" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea name="address" className="form-input" placeholder="Clinic or home address…" />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
              Add Doctor
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
