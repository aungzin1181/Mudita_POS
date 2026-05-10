'use client'

import { useState } from 'react'
import { PatientVital } from '@/types/pos'
import { recordVitals } from '@/app/actions/patient'
import { Activity, Plus, History, Loader2, Thermometer, Heart, Weight, X } from 'lucide-react'

export default function VitalsHistory({ patientId, history }: { patientId: string, history: PatientVital[] }) {
  const [showAdd, setShowAdd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    
    try {
      await recordVitals({
        patient_id: patientId,
        blood_pressure: formData.get('blood_pressure') as string,
        weight: parseFloat(formData.get('weight') as string) || undefined,
        spo2: parseInt(formData.get('spo2') as string) || undefined,
        temperature: parseFloat(formData.get('temperature') as string) || undefined,
        pulse_rate: parseInt(formData.get('pulse_rate') as string) || undefined,
        notes: formData.get('notes') as string,
      })
      setShowAdd(false)
    } catch (err: any) {
      console.error('Vitals recording error:', err)
      setError(err.message || 'Failed to record vitals. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card">
        <div className="card-header">
          <h3 className="text-mono" style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} /> Clinical Vitals
          </h3>
          <button className="btn btn-sm btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={14} /> New Record
          </button>
        </div>
        
        {showAdd && (
          <div className="card-body" style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
            <div className="flex justify-between mb-4">
               <span className="text-mono" style={{ fontWeight: 600 }}>New Vitals Entry</span>
               <button className="btn btn-sm btn-ghost" onClick={() => setShowAdd(false)}><X size={14} /></button>
            </div>
            {error && <div className="alert alert-red mb-4" style={{ fontSize: '12px', padding: '8px 12px' }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">BP (mmHg)</label>
                  <input name="blood_pressure" type="text" className="form-input" placeholder="120/80" />
                </div>
                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
                  <input name="weight" type="number" step="0.1" className="form-input" placeholder="0.0" />
                </div>
                <div className="form-group">
                  <label className="form-label">SPO2 (%)</label>
                  <input name="spo2" type="number" className="form-input" placeholder="98" />
                </div>
                <div className="form-group">
                  <label className="form-label">Temp (°C)</label>
                  <input name="temperature" type="number" step="0.1" className="form-input" placeholder="36.5" />
                </div>
                <div className="form-group">
                  <label className="form-label">Pulse (bpm)</label>
                  <input name="pulse_rate" type="number" className="form-input" placeholder="72" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input name="notes" type="text" className="form-input" placeholder="Any clinical notes..." />
              </div>
              <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Record Vitals
              </button>
            </form>
          </div>
        )}

        <div className="card-body" style={{ padding: 0 }}>
          {history.length > 0 ? (
            <div className="vitals-timeline">
              {history.map((record) => (
                <div key={record.id} className="vitals-item">
                  <div className="vitals-date">
                    <div className="text-mono" style={{ fontWeight: 700 }}>
                      {new Date(record.recorded_at).toLocaleDateString()}
                    </div>
                    <div className="text-muted" style={{ fontSize: '10px' }}>
                      {new Date(record.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="vitals-data-grid">
                    <div className="vitals-stat">
                      <span className="vitals-label">BP</span>
                      <span className="vitals-val">{record.blood_pressure || '—'}</span>
                    </div>
                    <div className="vitals-stat">
                      <span className="vitals-label">WT</span>
                      <span className="vitals-val">{record.weight ? `${record.weight}kg` : '—'}</span>
                    </div>
                    <div className="vitals-stat">
                      <span className="vitals-label">SPO2</span>
                      <span className="vitals-val">{record.spo2 ? `${record.spo2}%` : '—'}</span>
                    </div>
                    <div className="vitals-stat">
                      <span className="vitals-label">TEMP</span>
                      <span className="vitals-val">{record.temperature ? `${record.temperature}°C` : '—'}</span>
                    </div>
                    <div className="vitals-stat">
                      <span className="vitals-label">HR</span>
                      <span className="vitals-val">{record.pulse_rate ? `${record.pulse_rate}bpm` : '—'}</span>
                    </div>
                  </div>
                  {record.notes && (
                    <div className="vitals-note">
                      {record.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>
               <History size={32} style={{ opacity: 0.2, marginBottom: '8px' }} />
               <p style={{ fontSize: '12px' }}>No vitals history recorded yet.</p>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .vitals-timeline { padding: 8px 0; }
        .vitals-item { padding: 16px 24px; border-bottom: 1px solid var(--border); transition: background 0.2s; }
        .vitals-item:hover { background: var(--surface-alt); }
        .vitals-item:last-child { border-bottom: none; }
        
        .vitals-date { margin-bottom: 12px; }
        
        .vitals-data-grid { 
          display: grid; 
          grid-template-columns: repeat(5, 1fr); 
          gap: 12px; 
        }
        
        .vitals-stat { display: flex; flex-direction: column; gap: 2px; }
        .vitals-label { font-size: 9px; text-transform: uppercase; color: var(--muted); font-family: var(--mono); }
        .vitals-val { font-weight: 700; font-size: 14px; }
        
        .vitals-note { 
          margin-top: 12px; 
          padding: 8px 12px; 
          background: var(--bg); 
          border-radius: 6px; 
          font-size: 12px; 
          border-left: 3px solid var(--border2);
        }
      `}} />
    </div>
  )
}
