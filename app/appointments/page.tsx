import { createClient } from '@/lib/supabase/server'
import AppointmentView from './AppointmentView'
import { Appointment } from '@/types/pos'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AppointmentsPage() {
  const supabase = await createClient()
  
  // Get today's date in local timezone approximation
  const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD format

  const { data: todayAppts } = await supabase
    .from('appointments')
    .select(`
      id, appointment_date, appointment_time, status, reason, notes, patient_id, doctor_id,
      patients ( patient_no, full_name, phone_no ),
      doctors  ( full_name, specialization )
    `)
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: true })
    .limit(50)

  const { data: allDoctors } = await supabase
    .from('doctors')
    .select('id, full_name, specialization')
    .eq('is_active', true)
    
  console.log("TODAY:", today, "APPTS:", todayAppts)
    
  return <AppointmentView initialAppointments={(todayAppts as any) || []} date={today} doctors={allDoctors || []} />
}
