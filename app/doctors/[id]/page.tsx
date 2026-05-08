import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import DoctorEditForm from './DoctorEditForm'

export default async function DoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: doctor } = await supabase.from('doctors').select('*').eq('id', id).single()
  if (!doctor) notFound()

  return (
    <div className="container">
      <Link href="/doctors" className="btn" style={{ border: 'none', background: 'none', paddingLeft: 0, marginBottom: '16px' }}>
        <ArrowLeft size={16} /> Back to Doctors
      </Link>

      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <div className="page-eyebrow" style={{ color: 'var(--accent)' }}>{doctor.doctor_no}</div>
          <h1 className="page-title">{doctor.full_name}</h1>
        </div>
        <span className={`badge badge-${doctor.is_active ? 'active' : 'inactive'}`} style={{ fontSize: '13px', padding: '6px 16px' }}>
          {doctor.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Info display */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="text-mono" style={{ fontSize: '14px' }}>Contact & Credentials</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                ['Specialization', doctor.specialization || '—'],
                ['License No', doctor.license_no || '—'],
                ['Phone', doctor.phone_no || '—'],
                ['Address', doctor.address || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-mono text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="text-mono" style={{ fontSize: '14px' }}>Fee Schedule</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '4px' }}>
            <div className="text-mono text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Consultation Fee</div>
            <div className="text-serif" style={{ fontSize: '40px', fontWeight: 800, color: 'var(--accent)' }}>
              ${Number(doctor.consultation_fee).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <DoctorEditForm doctor={doctor} />
    </div>
  )
}
