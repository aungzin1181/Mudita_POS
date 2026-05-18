'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Appointment } from '@/types/pos'
import { markVisitedAndOpenPOS, updateAppointmentStatus, getCalendarData, createAppointment, updateAppointment } from '@/app/actions/appointment'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Calendar as CalendarIcon, Check, X, CreditCard, ChevronLeft, ChevronRight, User, ShoppingCart, Receipt } from 'lucide-react'
import Link from 'next/link'

interface Doctor {
  id: string;
  full_name: string;
  specialization: string | null;
}

export default function AppointmentView({ initialAppointments, date, doctors, currentTab = 'today' }: { initialAppointments: Appointment[], date: string, doctors: Doctor[], currentTab?: string }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [loadingApptId, setLoadingApptId] = useState<string | null>(null)
  
  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date(date))
  const [calendarData, setCalendarData] = useState<Record<string, any[]>>({})
  const [showForm, setShowForm] = useState(false)
  const [editAppt, setEditAppt] = useState<Appointment | null>(null)

  // Fetch calendar data when month changes
  useEffect(() => {
    async function loadCalendar() {
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth() + 1
      const data = await getCalendarData(year, month)
      setCalendarData(data)
    }
    loadCalendar()
  }, [currentMonth])

  // Realtime subscription for today's queue
  useEffect(() => {
    const channel = supabase
      .channel('appointments-today')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `appointment_date=eq.${date}`
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [date, router, supabase])
  
  // When initial data changes (via refresh), update local state
  useEffect(() => {
    setAppointments(initialAppointments)
  }, [initialAppointments])

  const handleStatusChange = async (id: string, status: 'visited' | 'no_show' | 'cancelled') => {
    setLoadingApptId(id)
    try {
      if (status === 'visited') {
        const { transactionId } = await markVisitedAndOpenPOS(id)
        router.push(`/pos/transaction/${transactionId}`)
      } else {
        await updateAppointmentStatus(id, status)
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status')
    } finally {
      setLoadingApptId(null)
    }
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }
  const handleToday = () => {
    setCurrentMonth(new Date(date))
  }

  // Calendar rendering helpers
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()
  
  const calendarCells = []
  // Empty cells for days before start of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="cal-cell other-month"></div>)
  }
  
  // Days of month
  for (let i = 1; i <= daysInMonth; i++) {
    const dayDateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    const isToday = dayDateStr === date
    const dayAppts = calendarData[dayDateStr] || []
    
    calendarCells.push(
      <div key={`day-${i}`} className="cal-cell">
        <div className={`cal-date ${isToday ? 'today' : ''}`}>{i}</div>
        {dayAppts.map(appt => (
          <div key={appt.id} className={`cal-appt ${
            appt.status === 'visited' ? 'appt-done' : 
            appt.status === 'no_show' ? 'appt-noshow' : 
            appt.status === 'cancelled' ? 'appt-noshow' : 'appt-pending'
          }`}>
            {appt.status === 'visited' ? '✓ ' : appt.status === 'no_show' ? '✗ ' : ''}
            {appt.patients?.full_name} ({appt.appointment_time.substring(0, 5)})
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="container">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <div className="page-eyebrow">Appointment & Tracking</div>
          <h1 className="page-title">Appointments</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> New Appointment
        </button>
      </div>
      
      {(showForm || editAppt) && (
        <AppointmentForm 
          doctors={doctors} 
          editData={editAppt}
          onClose={() => {
            setShowForm(false)
            setEditAppt(null)
          }} 
          onSuccess={() => {
            setShowForm(false)
            setEditAppt(null)
            router.refresh()
            // Reload calendar data for current month
            getCalendarData(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
              .then(data => setCalendarData(data))
          }} 
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '28px 0 12px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
          {currentTab === 'today' ? "Today's Queue" : currentTab === 'week' ? "This Week's Queue" : "This Month's Queue"}
          {currentTab === 'today' && <span style={{ fontWeight: 400, color: 'var(--muted)', marginLeft: '8px' }}>— {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>}
        </h2>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/appointments?tab=today" className={`btn btn-sm ${currentTab === 'today' ? 'btn-primary' : 'btn-ghost'}`}>Today</Link>
          <Link href="/appointments?tab=week" className={`btn btn-sm ${currentTab === 'week' ? 'btn-primary' : 'btn-ghost'}`}>This Week</Link>
          <Link href="/appointments?tab=month" className={`btn btn-sm ${currentTab === 'month' ? 'btn-primary' : 'btn-ghost'}`}>This Month</Link>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-header">
          <span style={{ fontWeight: 600 }}>Queue</span>
          <span className="badge badge-blue">{appointments.length} appointments</span>
        </div>
        
        {appointments.length > 0 ? (
          <div>
            {appointments.map(appt => (
              <div key={appt.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--mono)', minWidth: '72px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '2px' }}>
                    {new Date(appt.appointment_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent)' }}>
                    {appt.appointment_time.substring(0, 5)}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {appt.patients?.full_name} 
                    <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{appt.patients?.patient_no}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {appt.doctors ? `Dr. ${appt.doctors.full_name}` : 'No Doctor Assigned'} 
                    {appt.reason && ` · Reason: ${appt.reason}`}
                  </div>
                </div>
                
                {appt.status === 'pending' ? (
                  <>
                    <span className="badge badge-amber" style={{ width: '70px', textAlign: 'center', display: 'inline-block' }}>Pending</span>
                    <div style={{ display: 'flex', gap: '6px', marginLeft: '16px' }}>
                      <button 
                        className="btn btn-sm btn-ghost"
                        style={{ borderColor: 'var(--border2)' }}
                        onClick={() => setEditAppt(appt)}
                        disabled={loadingApptId === appt.id}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-sm btn-ghost" 
                        style={{ color: 'var(--green)', borderColor: 'var(--border2)' }}
                        onClick={() => handleStatusChange(appt.id, 'visited')}
                        disabled={loadingApptId === appt.id}
                      >
                        {loadingApptId === appt.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Visited
                      </button>
                      <button 
                        className="btn btn-sm btn-ghost"
                        style={{ color: 'var(--red)', borderColor: 'var(--border2)' }}
                        onClick={() => { if(confirm('Mark as No-show?')) handleStatusChange(appt.id, 'no_show') }}
                        disabled={loadingApptId === appt.id}
                      >
                        <X size={12} /> No-show
                      </button>
                    </div>
                  </>
                ) : appt.status === 'visited' ? (
                  <>
                    <span className="badge badge-green" style={{ width: '70px', textAlign: 'center', display: 'inline-block' }}>Visited</span>
                    <div style={{ marginLeft: '16px' }}>
                      <button 
                        onClick={() => handleStatusChange(appt.id, 'visited')}
                        className={`btn btn-sm ${appt.transactions?.status === 'paid' ? 'btn-green' : 'btn-primary'}`}
                        disabled={loadingApptId === appt.id}
                      >
                        {loadingApptId === appt.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : appt.transactions?.status === 'paid' ? (
                          <Receipt size={12} />
                        ) : appt.transactions?.status === 'open' || appt.transactions?.status === 'draft' ? (
                          <ShoppingCart size={12} />
                        ) : (
                          <CreditCard size={12} />
                        )} 
                        {appt.transactions?.status === 'paid' ? 'View Invoice' : 
                         appt.transactions?.status === 'open' || appt.transactions?.status === 'draft' ? 'Checkout' : 
                         'Open POS'}
                      </button>
                    </div>
                  </>
                ) : (
                  <span className="badge badge-red">{appt.status === 'no_show' ? 'No-show' : 'Cancelled'}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
           <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
              No appointments found for {currentTab === 'today' ? 'today' : currentTab === 'week' ? 'this week' : 'this month'}.
           </div>
        )}
      </div>

      {/* CALENDAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '32px 0 12px' }}>
         <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Monthly Calendar</h2>
      </div>
      
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ background: 'var(--accent)', color: 'white', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handlePrevMonth} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ChevronLeft size={14} /> Prev
            </button>
            <button onClick={handleToday} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
              Today
            </button>
            <button onClick={handleNextMonth} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
               Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{ textAlign: 'center', padding: '8px 4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
              {day}
            </div>
          ))}
          {calendarCells}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .cal-cell { border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 6px; min-height: 90px; position: relative; vertical-align: top; }
        .cal-cell:nth-child(7n) { border-right: none; }
        .cal-date { font-size: 11px; font-weight: 600; color: var(--muted); margin-bottom: 4px; display: inline-block; padding: 2px; }
        .cal-date.today { background: var(--accent); color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; }
        .cal-appt { font-size: 10px; padding: 2px 5px; border-radius: 4px; margin-bottom: 2px; font-weight: 500; cursor: default; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .appt-pending { background: #fef3c7; color: #92400e; }
        .appt-done { background: #dcfce7; color: #166534; }
        .appt-noshow { background: #fee2e2; color: #991b1b; }
        .cal-cell.other-month { background: #f8fafc; }
      `}} />
    </div>
  )
}

function AppointmentForm({ doctors, onClose, onSuccess, editData }: { doctors: Doctor[], onClose: () => void, onSuccess: () => void, editData?: Appointment | null }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [patientId, setPatientId] = useState(editData?.patient_id || '') 

  // We need a simple patient search for the appointment form
  const [patientSearch, setPatientSearch] = useState(editData?.patients?.full_name || '')
  const [patients, setPatients] = useState<any[]>([])
  
  const searchPatients = async (q: string) => {
    if (q.length < 2) return
    const supabase = createClient()
    const { data } = await supabase.from('patients').select('id, full_name, patient_no').ilike('full_name', `%${q}%`).limit(5)
    setPatients(data || [])
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!patientId) { setError('Please select a patient first.'); return }
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    formData.append('patient_id', patientId)

    let result;
    if (editData?.id) {
      result = await updateAppointment(editData.id, formData)
    } else {
      result = await createAppointment(formData)
    }
    
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Failed to save appointment.')
    } else {
      onSuccess()
    }
  }

  return (
    <div className="card" style={{ marginBottom: '24px', border: '2px solid var(--accent)' }}>
      <div className="card-header">
         <h3 style={{ fontSize: '14px', margin: 0 }}>{editData ? 'Edit Appointment' : 'Create New Appointment'}</h3>
         <button className="btn btn-sm btn-ghost" onClick={onClose}><X size={14} /></button>
      </div>
      <div className="card-body">
        {error && <div className="alert alert-red mb-4" style={{ padding: '8px', fontSize: '12px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          
          <div className="form-group mb-4">
             <label className="form-label">Patient</label>
             {!patientId ? (
               <div style={{ position: 'relative' }}>
                 <input 
                   type="text" 
                   className="form-input" 
                   placeholder="Search patient by name..." 
                   value={patientSearch}
                   onChange={e => {
                     setPatientSearch(e.target.value);
                     searchPatients(e.target.value);
                   }}
                 />
                 {patients.length > 0 && (
                   <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', zIndex: 10, marginTop: '4px' }}>
                      {patients.map(p => (
                        <div key={p.id} onClick={() => { setPatientId(p.id); setPatients([]); setPatientSearch(p.full_name) }} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--surface-alt)', fontSize: '13px' }}>
                          <span style={{ fontWeight: 600 }}>{p.full_name}</span> <span style={{ color: 'var(--muted)', fontSize: '11px', fontFamily: 'var(--mono)' }}>({p.patient_no})</span>
                        </div>
                      ))}
                   </div>
                 )}
               </div>
             ) : (
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--surface-alt)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                 <User size={14} className="text-muted" />
                 <span style={{ fontWeight: 600, fontSize: '13px' }}>{patientSearch}</span>
                 {/* Only allow changing patient if creating new appointment, as updating patient might be tricky if it's already an existing appointment. But if we allow it: */}
                 {!editData && (
                   <button type="button" onClick={() => { setPatientId(''); setPatientSearch(''); setPatients([]) }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '12px' }}>Change</button>
                 )}
               </div>
             )}
          </div>

          <div className="form-grid-3">
             <div className="form-group">
               <label className="form-label">Date</label>
               <input name="date" type="date" className="form-input" required defaultValue={editData?.appointment_date || new Date().toLocaleDateString('en-CA')} />
             </div>
             <div className="form-group">
               <label className="form-label">Time</label>
               <input name="time" type="time" className="form-input" required defaultValue={editData?.appointment_time?.substring(0, 5) || "09:00"} />
             </div>
             <div className="form-group">
               <label className="form-label">Doctor</label>
               <select name="doctor_id" className="form-input" defaultValue={editData?.doctor_id || ""}>
                 <option value="">-- No specific doctor --</option>
                 {doctors.map(d => (
                   <option key={d.id} value={d.id}>Dr. {d.full_name} {d.specialization ? `(${d.specialization})` : ''}</option>
                 ))}
               </select>
             </div>
          </div>
          
          <div className="form-group mt-3">
            <label className="form-label">Reason for Visit</label>
            <input name="reason" type="text" className="form-input" placeholder="e.g. Follow-up, Fever, Checkup" required defaultValue={editData?.reason || ''} />
          </div>

          <div className="flex gap-2 mt-4">
             <button type="submit" className="btn btn-primary" disabled={loading || !patientId}>
               {loading ? <Loader2 size={14} className="animate-spin" /> : (editData ? <Check size={14} /> : <Plus size={14} />)} {editData ? 'Save Changes' : 'Create Appointment'}
             </button>
             <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
