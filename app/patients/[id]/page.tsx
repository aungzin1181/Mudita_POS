import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart, User, Phone, MapPin, Activity, FileText } from 'lucide-react'
import PatientEditForm from './PatientEditForm'
import VitalsHistory from '@/components/pos/VitalsHistory'
import { PatientVital } from '@/types/pos'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const [
    { data: patient }, 
    { data: transactions },
    { data: vitals },
    { data: appointments }
  ] = await Promise.all([
    supabase.from('patients').select('*').eq('id', id).single(),
    supabase
      .from('transactions')
      .select('*')
      .eq('patient_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('patient_vitals')
      .select('*')
      .eq('patient_id', id)
      .order('recorded_at', { ascending: false }),
    supabase
      .from('appointments')
      .select(`
        appointment_date, appointment_time, status, reason,
        doctors ( full_name ),
        transactions ( id, invoice_no, total_amount, payment_method )
      `)
      .eq('patient_id', id)
      .order('appointment_date', { ascending: false })
      .limit(10)
  ])

  if (!patient) notFound()

  // Use the latest vitals for the summary cards, fallback to patient record values
  const displayWeight = vitals?.[0]?.weight ?? patient.weight
  const displayBP = vitals?.[0]?.blood_pressure ?? patient.blood_pressure
  const displaySPO2 = vitals?.[0]?.spo2 ?? patient.spo2

  return (
    <div className="container">
      <Link href="/patients" className="btn" style={{ border: 'none', background: 'none', paddingLeft: 0, marginBottom: '16px' }}>
        <ArrowLeft size={16} /> Back to Patients
      </Link>

      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <div className="page-eyebrow" style={{ color: 'var(--accent)' }}>{patient.patient_no}</div>
          <h1 className="page-title">{patient.full_name}</h1>
        </div>
        <Link
          href={`/pos/new?patient_id=${patient.id}&patient_name=${encodeURIComponent(patient.full_name)}`}
          className="btn btn-primary"
        >
          <ShoppingCart size={18} /> New Transaction
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
        {/* LEFT: Info + Vitals History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Latest Vitals Summary Card */}
          <div className="grid gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
             <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                <div className="text-mono text-muted" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Weight</div>
                <div style={{ fontSize: '20px', fontWeight: 700 }}>{displayWeight ? `${displayWeight} kg` : '—'}</div>
             </div>
             <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                <div className="text-mono text-muted" style={{ fontSize: '10px', textTransform: 'uppercase' }}>BP</div>
                <div style={{ fontSize: '20px', fontWeight: 700 }}>{displayBP || '—'}</div>
             </div>
             <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                <div className="text-mono text-muted" style={{ fontSize: '10px', textTransform: 'uppercase' }}>SPO2</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: (displaySPO2 && displaySPO2 < 95) ? 'var(--red)' : 'inherit' }}>
                  {displaySPO2 ? `${displaySPO2}%` : '—'}
                </div>
             </div>
          </div>

          {/* Vitals History Component */}
          <VitalsHistory patientId={id} history={(vitals || []) as PatientVital[]} />

          {/* Info card */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-mono" style={{ fontSize: '14px' }}>Patient Information</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <div className="text-mono text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>
                    <User size={12} style={{ display: 'inline', marginRight: '4px' }} /> Gender / Age
                  </div>
                  <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>
                    {patient.gender} {patient.age ? `· ${patient.age} yrs` : ''}
                  </div>
                </div>
                <div>
                  <div className="text-mono text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Date of Birth
                  </div>
                  <div style={{ fontWeight: 500 }}>
                    {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-mono text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>
                    <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} /> Phone
                  </div>
                  <div style={{ fontWeight: 500 }}>{patient.phone_no || '—'}</div>
                </div>
                <div>
                  <div className="text-mono text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>
                    <Activity size={12} style={{ display: 'inline', marginRight: '4px' }} /> Blood Type
                  </div>
                  <div style={{ fontWeight: 500 }}>
                    {patient.blood_type ? <span className="badge badge-open">{patient.blood_type}</span> : '—'}
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="text-mono text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>
                    <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} /> Address
                  </div>
                  <div style={{ fontWeight: 500 }}>{patient.address || '—'}</div>
                </div>
                {patient.medical_history && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div className="text-mono text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>
                      <FileText size={12} style={{ display: 'inline', marginRight: '4px' }} /> Medical History
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>{patient.medical_history}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Edit form */}
          <PatientEditForm patient={patient} />
        </div>

        {/* RIGHT: Transaction history & Appointment history */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card">
            <div className="card-header">
              <h3 className="text-mono" style={{ fontSize: '14px' }}>Appointment History</h3>
              <span className="text-muted text-mono" style={{ fontSize: '12px' }}>{appointments?.length ?? 0}</span>
            </div>
            <div style={{ padding: 0 }}>
              {appointments && appointments.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Reason / Doctor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appt: any, i: number) => (
                      <tr key={i}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{new Date(appt.appointment_date).toLocaleDateString()}</div>
                          <div className="text-muted text-mono" style={{ fontSize: '11px' }}>{appt.appointment_time.substring(0, 5)}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '13px' }}>{appt.reason || '—'}</div>
                          <div className="text-muted" style={{ fontSize: '11px' }}>
                            {appt.doctors ? `Dr. ${appt.doctors.full_name}` : ''}
                            {appt.transactions && (
                              <Link href={`/pos/transaction/${appt.transactions.id}`} style={{ marginLeft: '6px', color: 'var(--accent)' }}>
                                ({appt.transactions.invoice_no})
                              </Link>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`badge`} style={{ 
                            background: appt.status === 'visited' ? 'var(--green-soft)' : appt.status === 'pending' ? 'var(--amber-soft)' : 'var(--red-soft)',
                            color: appt.status === 'visited' ? 'var(--green)' : appt.status === 'pending' ? 'var(--amber)' : 'var(--red)',
                            border: '1px solid currentColor'
                          }}>
                            {appt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-sub">No appointments yet</div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
          <div className="card-header">
            <h3 className="text-mono" style={{ fontSize: '14px' }}>Transaction History</h3>
            <span className="text-muted text-mono" style={{ fontSize: '12px' }}>{transactions?.length ?? 0}</span>
          </div>
          <div style={{ padding: 0 }}>
            {transactions && transactions.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <Link href={`/pos/transaction/${tx.id}`} className="text-mono" style={{ color: 'var(--accent)', fontWeight: 500 }}>
                          {tx.invoice_no}
                        </Link>
                        <div className="text-muted" style={{ fontSize: '11px' }}>
                          {new Date(tx.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td><span className={`badge badge-${tx.status}`}>{tx.status}</span></td>
                      <td className="text-mono">{Number(tx.total_amount).toLocaleString()} MMK</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-sub">No transactions yet</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}
