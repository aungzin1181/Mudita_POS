import { createClient } from '@/lib/supabase/server'
import AppointmentView from './AppointmentView'
import { Appointment } from '@/types/pos'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const supabase = await createClient()
  
  const { tab = 'today' } = await searchParams

  const todayDate = new Date()
  const todayStr = todayDate.toLocaleDateString('en-CA') // YYYY-MM-DD
  
  let endDateStr = todayStr

  if (tab === 'week') {
    const nextWeek = new Date(todayDate)
    nextWeek.setDate(nextWeek.getDate() + 7)
    endDateStr = nextWeek.toLocaleDateString('en-CA')
  } else if (tab === 'month') {
    const nextMonth = new Date(todayDate)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    endDateStr = nextMonth.toLocaleDateString('en-CA')
  }

  let query = supabase
    .from('appointments')
    .select(`
      id, appointment_date, appointment_time, status, reason, notes, patient_id, doctor_id, transaction_id,
      patients ( patient_no, full_name, phone_no ),
      doctors  ( full_name, specialization ),
      transactions ( status )
    `)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })
    .limit(100)

  if (tab === 'today') {
    query = query.eq('appointment_date', todayStr)
  } else if (tab === 'week' || tab === 'month') {
    query = query.gte('appointment_date', todayStr).lte('appointment_date', endDateStr)
  }

  const { data: appts } = await query

  const { data: allDoctors } = await supabase
    .from('doctors')
    .select('id, full_name, specialization')
    .eq('is_active', true)
    
  return <AppointmentView initialAppointments={(appts as any) || []} date={todayStr} doctors={allDoctors || []} currentTab={tab} />
}
