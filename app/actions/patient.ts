'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { writeAuditLog } from '@/lib/audit'

export interface PatientFormData {
  full_name: string
  gender: 'male' | 'female' | 'other'
  age?: number
  date_of_birth?: string
  phone_no?: string
  address?: string
  blood_type?: string
  blood_pressure?: string
  weight?: number
  spo2?: number
  medical_history?: string
}

export interface VitalsFormData {
  patient_id: string
  blood_pressure?: string
  weight?: number
  spo2?: number
  temperature?: number
  pulse_rate?: number
  notes?: string
  diagnosis?: string
  treatments?: string
}

/**
 * Create a new patient record.
 */
export async function createPatient(data: PatientFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  const { data: patient, error } = await supabase
    .from('patients')
    .insert({
      full_name: data.full_name,
      gender: data.gender,
      age: data.age || null,
      date_of_birth: data.date_of_birth || null,
      phone_no: data.phone_no || null,
      address: data.address || null,
      blood_type: data.blood_type || null,
      blood_pressure: data.blood_pressure || null,
      weight: data.weight || null,
      spo2: data.spo2 || null,
      medical_history: data.medical_history || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating patient:', error)
    throw error
  }

  await writeAuditLog({
    performed_by: userId,
    module: 'patient',
    action: 'patient_created',
    entity_type: 'patient',
    entity_id: patient.id,
    entity_label: data.full_name,
    new_data: { ...data } as unknown as Record<string, unknown>,
  })

  revalidatePath('/patients')
  return patient
}

/**
 * Update an existing patient record.
 */
export async function updatePatient(id: string, data: PatientFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  // Capture previous state
  const { data: before } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single()

  const { data: patient, error } = await supabase
    .from('patients')
    .update({
      full_name: data.full_name,
      gender: data.gender,
      age: data.age || null,
      date_of_birth: data.date_of_birth || null,
      phone_no: data.phone_no || null,
      address: data.address || null,
      blood_type: data.blood_type || null,
      blood_pressure: data.blood_pressure || null,
      weight: data.weight || null,
      spo2: data.spo2 || null,
      medical_history: data.medical_history || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  await writeAuditLog({
    performed_by: userId,
    module: 'patient',
    action: 'patient_updated',
    entity_type: 'patient',
    entity_id: id,
    entity_label: data.full_name,
    previous_data: before as unknown as Record<string, unknown>,
    new_data: { ...data } as unknown as Record<string, unknown>,
  })

  revalidatePath('/patients')
  revalidatePath(`/patients/${id}`)
  return patient
}

/**
 * Record a new vitals entry for a patient.
 */
export async function recordVitals(data: VitalsFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  // 1. Insert into historical tracking table (now with recorded_by)
  const { data: record, error: insertError } = await supabase
    .from('patient_vitals')
    .insert({
      patient_id:     data.patient_id,
      blood_pressure: data.blood_pressure || null,
      weight:         data.weight || null,
      spo2:           data.spo2 || null,
      temperature:    data.temperature || null,
      pulse_rate:     data.pulse_rate || null,
      notes:          data.notes || null,
      diagnosis:      data.diagnosis || null,
      treatments:     data.treatments || null,
      recorded_by:    userId,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error inserting vitals:', insertError)
    throw insertError
  }

  // 2. Sync latest vitals back to patient record
  const { error: updateError } = await supabase
    .from('patients')
    .update({
      blood_pressure: data.blood_pressure || null,
      weight:         data.weight || null,
      spo2:           data.spo2 || null,
    })
    .eq('id', data.patient_id)

  if (updateError) {
    console.error('Error syncing vitals to patient:', updateError)
  }

  await writeAuditLog({
    performed_by: userId,
    module: 'patient',
    action: 'vitals_recorded',
    entity_type: 'patient',
    entity_id: data.patient_id,
    new_data: { ...data } as unknown as Record<string, unknown>,
  })

  revalidatePath(`/patients/${data.patient_id}`)
  return record
}

/**
 * Delete a patient record.
 */
export async function deletePatient(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  // Capture record before deletion
  const { data: before } = await supabase
    .from('patients')
    .select('full_name, patient_no, phone_no')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('patients').delete().eq('id', id)
  if (error) throw error

  await writeAuditLog({
    performed_by: userId,
    module: 'patient',
    action: 'patient_deleted',
    entity_type: 'patient',
    entity_id: id,
    entity_label: before?.full_name ?? id,
    previous_data: before as unknown as Record<string, unknown>,
  })

  revalidatePath('/patients')
  return { success: true }
}
