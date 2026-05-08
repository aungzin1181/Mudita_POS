'use client'

import { useState, useEffect, useCallback } from 'react'
import { createTransaction } from '@/app/actions/transaction'
import { useRouter, useSearchParams } from 'next/navigation'
import { UserPlus, ArrowLeft, Loader2, Search, CheckCircle, Users } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Patient } from '@/types/pos'

export default function NewTransactionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const prefillId = searchParams.get('patient_id') || ''
  const prefillName = searchParams.get('patient_name') || ''

  const [query, setQuery] = useState(prefillName)
  const [results, setResults] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    prefillId ? ({ id: prefillId, full_name: prefillName } as Patient) : null
  )
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  const searchPatients = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('patients')
      .select('id, patient_no, full_name, gender, date_of_birth, phone_no')
      .or(`full_name.ilike.%${q}%,patient_no.ilike.%${q}%,phone_no.ilike.%${q}%`)
      .limit(8)
    setResults((data as Patient[]) ?? [])
    setSearching(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!selectedPatient) searchPatients(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, selectedPatient, searchPatients])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return
    setLoading(true)
    try {
      const tx = await createTransaction(selectedPatient.id)
      router.push(`/pos/transaction/${tx.id}`)
    } catch (err) {
      console.error(err)
      alert('Failed to create transaction. Check console.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <Link href="/pos" className="btn" style={{ border: 'none', background: 'none', paddingLeft: 0, marginBottom: '16px' }}>
        <ArrowLeft size={16} /> Back to POS
      </Link>

      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <div className="page-eyebrow">POS · New Transaction</div>
          <h1 className="page-title">Select <em>Patient</em></h1>
        </div>
      </div>

      <div style={{ maxWidth: '560px' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="text-mono" style={{ fontSize: '14px' }}>Find Patient</h3>
            <Link href="/patients/new" className="btn btn-sm">
              <UserPlus size={13} /> New Patient
            </Link>
          </div>
          <div className="card-body">
            {/* Search box */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <div className="search-box">
                <span className="search-box-icon">
                  {searching
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Search size={16} />}
                </span>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="Search by name, patient number, or phone…"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setSelectedPatient(null)
                    setResults([])
                  }}
                  autoFocus
                />
              </div>

              {/* Dropdown results */}
              {results.length > 0 && !selectedPatient && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  marginTop: '4px', overflow: 'hidden',
                }}>
                  {results.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatient(p)
                        setQuery(p.full_name)
                        setResults([])
                      }}
                      style={{
                        width: '100%', padding: '12px 16px', background: 'none',
                        border: 'none', borderBottom: '1px solid var(--surface-alt)',
                        textAlign: 'left', cursor: 'pointer',
                        display: 'flex', gap: '12px', alignItems: 'center',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-alt)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'var(--accent-soft)', color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--serif)', fontWeight: 700, flexShrink: 0, fontSize: '16px',
                      }}>
                        {p.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.full_name}</div>
                        <div className="text-mono text-muted" style={{ fontSize: '11px' }}>
                          {p.patient_no}
                          {p.phone_no && ` · ${p.phone_no}`}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No results message */}
              {query.length > 2 && results.length === 0 && !searching && !selectedPatient && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '20px', textAlign: 'center',
                  marginTop: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                }}>
                  <div className="text-muted" style={{ fontSize: '13px', marginBottom: '10px' }}>
                    No patients found for &quot;{query}&quot;
                  </div>
                  <Link href="/patients/new" className="btn btn-sm btn-primary">
                    <UserPlus size={13} /> Register New Patient
                  </Link>
                </div>
              )}
            </div>

            {/* Selected patient card */}
            {selectedPatient && (
              <div style={{
                background: 'var(--green-soft)', border: '1px solid var(--green)',
                borderRadius: '10px', padding: '16px', marginBottom: '20px',
                display: 'flex', gap: '12px', alignItems: 'center',
              }}>
                <CheckCircle size={20} style={{ color: 'var(--green)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--green)', fontSize: '12px' }}>Patient Selected</div>
                  <div style={{ fontWeight: 700, fontSize: '16px' }}>{selectedPatient.full_name}</div>
                  {selectedPatient.patient_no && (
                    <div className="text-mono text-muted" style={{ fontSize: '12px' }}>{selectedPatient.patient_no}</div>
                  )}
                </div>
                <button type="button" className="btn btn-sm"
                  onClick={() => { setSelectedPatient(null); setQuery(''); setResults([]) }}>
                  Change
                </button>
              </div>
            )}

            <form onSubmit={handleCreate}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                disabled={!selectedPatient || loading}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                {selectedPatient ? 'Start Transaction' : 'Select a patient first'}
              </button>
            </form>

            <div className="text-muted" style={{ fontSize: '12px', textAlign: 'center', marginTop: '14px' }}>
              Or{' '}
              <Link href="/patients" style={{ color: 'var(--accent)', fontWeight: 500 }}>
                <Users size={12} style={{ display: 'inline', marginRight: '4px' }} />
                browse all patients
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
