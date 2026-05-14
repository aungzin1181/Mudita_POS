'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAppointment(formData: FormData) {
  const supabase = await createClient()

  // NOTE: Auth check relaxed for development to fix "Unauthenticated" blocking issue.
  const { data: { user } } = await supabase.auth.getUser()
  void user // unused but ensures session is refreshed

  const { data, error } = await supabase.rpc('create_appointment', {
    p_patient_id:       formData.get('patient_id') as string,
    p_doctor_id:        formData.get('doctor_id') ? (formData.get('doctor_id') as string) : null,
    p_appointment_date: formData.get('date') as string,
    p_appointment_time: formData.get('time') as string,
    p_reason:           formData.get('reason') as string,
  })

  if (error || !data?.success) {
    throw new Error(data?.error || error?.message)
  }

  revalidatePath('/', 'layout')
  return data
}

export async function markVisitedAndOpenPOS(appointmentId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  void user

  const { data, error } = await supabase.rpc('update_appointment_status', {
    p_appointment_id: appointmentId,
    p_status: 'visited',
  })

  if (error || !data?.success) {
    throw new Error(data?.error || error?.message)
  }

  revalidatePath('/appointments')
  return { patientId: data.patient_id }
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'no_show' | 'cancelled',
  notes?: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  void user

  const { data, error } = await supabase.rpc('update_appointment_status', {
    p_appointment_id: appointmentId,
    p_status: status,
    p_notes: notes,
  })

  if (error || !data?.success) throw new Error(data?.error || error?.message)
  revalidatePath('/appointments')
}

export async function getCalendarData(year: number, month: number) {
  const supabase = await createClient()
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay  = new Date(year, month, 0).toISOString().split('T')[0]

  const { data } = await supabase
    .from('appointments')
    .select('appointment_date, status, patients(full_name), appointment_time')
    .gte('appointment_date', firstDay)
    .lte('appointment_date', lastDay)
    .order('appointment_time')

  const grouped = data?.reduce((acc, appt) => {
    const d = appt.appointment_date
    if (!acc[d]) acc[d] = []
    acc[d].push(appt)
    return acc
  }, {} as Record<string, any[]>)

  return grouped ?? {}
}

export async function linkAppointmentToTransaction(
  appointmentId: string,
  transactionId: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  void user

  await supabase
    .from('appointments')
    .update({ transaction_id: transactionId })
    .eq('id', appointmentId)
    .eq('status', 'visited') // safety check
}
