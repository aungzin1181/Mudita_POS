'use client'

import { useState } from 'react'
import { Transaction, Doctor, Patient } from '@/types/pos'
import { setTransactionDoctor } from '@/app/actions/transaction'
import { User, Stethoscope, Calendar, Hash, Loader2 } from 'lucide-react'

interface TransactionHeaderProps {
  transaction: Transaction
  patient: Patient | null
  doctors: Doctor[]
}

export default function TransactionHeader({ transaction, patient, doctors }: TransactionHeaderProps) {
  const [loading, setLoading] = useState(false)

  const handleDoctorChange = async (doctorId: string) => {
    if (!doctorId) return
    setLoading(true)
    try {
      await setTransactionDoctor(transaction.id, doctorId)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isEditable = ['draft', 'open'].includes(transaction.status)

  return (
    <div className="card" style={{ borderLeft: `4px solid var(--${transaction.status === 'paid' ? 'green' : transaction.status === 'voided' ? 'red' : 'accent'})` }}>
      <div className="card-body" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', alignItems: 'center' }}>
          
          {/* Invoice & Date */}
          <div>
            <div className="flex items-center gap-2 text-muted mb-1">
              <Hash size={14} />
              <span className="text-mono" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Invoice</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: '18px' }}>{transaction.invoice_no}</div>
            <div className="flex items-center gap-1 text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>
              <Calendar size={12} />
              {new Date(transaction.created_at).toLocaleDateString()}
            </div>
          </div>

          {/* Patient Info */}
          <div>
            <div className="flex items-center gap-2 text-muted mb-1">
              <User size={14} />
              <span className="text-mono" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Patient</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: '16px' }}>{patient?.full_name || 'N/A'}</div>
            <div className="text-mono text-muted" style={{ fontSize: '11px' }}>{patient?.patient_no}</div>
          </div>

          {/* Doctor Selection */}
          <div>
            <div className="flex items-center gap-2 text-muted mb-1">
              <Stethoscope size={14} />
              <span className="text-mono" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Attending Doctor</span>
            </div>
            {isEditable ? (
              <div style={{ position: 'relative' }}>
                <select 
                  className="form-input" 
                  style={{ padding: '4px 10px', fontSize: '13px' }}
                  value={transaction.doctor_id || ''}
                  onChange={(e) => handleDoctorChange(e.target.value)}
                  disabled={loading}
                >
                  <option value="">— Select Doctor —</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.full_name}</option>
                  ))}
                </select>
                {loading && <div style={{ position: 'absolute', right: '30px', top: '8px' }}><Loader2 size={14} className="animate-spin text-accent" /></div>}
              </div>
            ) : (
              <div style={{ fontWeight: 600 }}>
                {doctors.find(d => d.id === transaction.doctor_id)?.full_name || 'Not assigned'}
              </div>
            )}
          </div>

          {/* Status */}
          <div style={{ textAlign: 'right' }}>
            <div className="text-mono text-muted mb-1" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Status</div>
            <span className={`badge badge-${transaction.status}`} style={{ fontSize: '14px', padding: '6px 16px', borderRadius: '20px' }}>
              {transaction.status.toUpperCase()}
            </span>
          </div>

        </div>
      </div>
    </div>
  )
}
