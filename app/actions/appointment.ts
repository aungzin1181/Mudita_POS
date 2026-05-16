'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { writeAuditLog } from '@/lib/audit'

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

    await writeAuditLog({
      performed_by: user?.id ?? null,
      module: 'appointment',
      action: 'appointment_created',
      entity_type: 'appointment',
      entity_id: data.appointment_id,
      new_data: {
        patient_id: formData.get('patient_id'),
        doctor_id:  formData.get('doctor_id'),
        date:       formData.get('date'),
        time:       formData.get('time'),
        reason:     formData.get('reason'),
      } as Record<string, unknown>,
    })

    revalidatePath('/', 'layout')
    return { success: true, appointment_id: data.appointment_id }
  } catch (e: any) {
    return { success: false, error: friendlyAppointmentError(e.message ?? 'Something went wrong') }
  }
}

export async function markVisitedAndOpenPOS(appointmentId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Get the appointment first
  const { data: appt } = await supabase
    .from('appointments')
    .select('patient_id, transaction_id, status')
    .eq('id', appointmentId)
    .single()

  if (!appt) throw new Error('Appointment not found')

  let finalTxId = appt.transaction_id

  // Mark as visited using the RPC
  if (appt.status !== 'visited') {
    const { data, error } = await supabase.rpc('update_appointment_status', {
      p_appointment_id: appointmentId,
      p_status: 'visited',
    })

    if (error || !data?.success) {
      throw new Error(data?.error || error?.message)
    }
  }

  // If there is no transaction linked, create one
  if (!finalTxId) {
    const invoiceNo = `INV-${Date.now().toString().slice(-8)}`
    
    // Create new transaction
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert({
        patient_id: appt.patient_id,
        created_by: user?.id ?? null,
        updated_by: user?.id ?? null,
        invoice_no: invoiceNo,
        status: 'draft',
        subtotal: 0,
        total_amount: 0,
      })
      .select('id')
      .single()

    if (txError) throw txError
    finalTxId = tx.id

    // Link the transaction to the appointment
    await supabase
      .from('appointments')
      .update({ transaction_id: finalTxId })
      .eq('id', appointmentId)
  }

  revalidatePath('/appointments')
  return { transactionId: finalTxId }
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'no_show' | 'cancelled',
  notes?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  void user

  const { data: appt } = await supabase
    .from('appointments')
    .select('status, patients(full_name)')
    .eq('id', appointmentId)
    .single()

  const { data, error } = await supabase.rpc('update_appointment_status', {
    p_appointment_id: appointmentId,
    p_status: status,
    p_notes: notes,
  })

  if (error || !data?.success) throw new Error(data?.error || error?.message)

  await writeAuditLog({
    performed_by: user?.id ?? null,
    module: 'appointment',
    action: 'status_changed',
    entity_type: 'appointment',
    entity_id: appointmentId,
    previous_data: { status: (appt as any)?.status },
    new_data: { status, notes: notes ?? null },
  })

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
