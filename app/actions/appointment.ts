'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type AppointmentResult = { success: boolean; error?: string; appointment_id?: string }

function friendlyAppointmentError(raw: string): string {
  const msg = raw.toLowerCase()
  if (msg.includes('patient already has appointment')) {
    return 'This patient already has an appointment on that day. Please choose a different date.'
  }
  if (msg.includes('doctor already has appointment')) {
    return 'That doctor is already booked at the same time. Please pick a different time slot.'
  }
  if (msg.includes('not found')) {
    return 'Appointment not found. It may have been deleted.'
  }
  if (msg.includes('visited')) {
    return 'This appointment has already been marked as visited.'
  }
  return raw
}

export async function createAppointment(formData: FormData): Promise<AppointmentResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    void user

    const { data, error } = await supabase.rpc('create_appointment', {
      p_patient_id:       formData.get('patient_id') as string,
      p_doctor_id:        formData.get('doctor_id') ? (formData.get('doctor_id') as string) : null,
      p_appointment_date: formData.get('date') as string,
      p_appointment_time: formData.get('time') as string,
      p_reason:           formData.get('reason') as string,
    })

    if (error) {
      return { success: false, error: friendlyAppointmentError(error.message) }
    }
    if (!data?.success) {
      return { success: false, error: friendlyAppointmentError(data?.error ?? 'Unknown error') }
    }

    revalidatePath('/', 'layout')
    return { success: true, appointment_id: data.appointment_id }
  } catch (e: any) {
    return { success: false, error: friendlyAppointmentError(e.message ?? 'Something went wrong') }
  }
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
