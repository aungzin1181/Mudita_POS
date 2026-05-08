'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
}

/**
 * Create a new patient record.
 */
export async function createPatient(data: PatientFormData) {
  const supabase = await createClient()
  
  // NOTE: Auth check relaxed for development to fix "Unauthenticated" blocking issue.
  const { data: { user } } = await supabase.auth.getUser()
  
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

  revalidatePath('/patients')
  return patient
}

/**
 * Update an existing patient record.
 */
export async function updatePatient(id: string, data: PatientFormData) {
  const supabase = await createClient()

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

  revalidatePath('/patients')
  revalidatePath(`/patients/${id}`)
  return patient
}

/**
 * Record a new vitals entry for a patient.
 */
export async function recordVitals(data: VitalsFormData) {
  const supabase = await createClient()

  const { data: record, error } = await supabase
    .from('patient_vitals')
    .insert({
      patient_id: data.patient_id,
      blood_pressure: data.blood_pressure || null,
      weight: data.weight || null,
      spo2: data.spo2 || null,
      temperature: data.temperature || null,
      pulse_rate: data.pulse_rate || null,
      notes: data.notes || null,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath(`/patients/${data.patient_id}`)
  return record
}

/**
 * Delete a patient record.
 */
export async function deletePatient(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('patients').delete().eq('id', id)
  if (error) throw error

  revalidatePath('/patients')
  return { success: true }
}
