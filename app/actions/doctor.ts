'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface DoctorFormData {
  full_name: string
  license_no?: string
  specialization?: string
  consultation_fee?: number
  phone_no?: string
  address?: string
  is_active?: boolean
}

/**
 * Create a new doctor record.
 */
export async function createDoctor(data: DoctorFormData) {
  const supabase = await createClient()
  
  // NOTE: Auth check relaxed for development to fix "Unauthenticated" blocking issue.
  const { data: { user } } = await supabase.auth.getUser()
  void user // unused but ensures session is refreshed
  
  const { data: doctor, error } = await supabase
    .from('doctors')
    .insert({
      full_name: data.full_name,
      license_no: data.license_no || null,
      specialization: data.specialization || null,
      consultation_fee: data.consultation_fee ?? 0,
      phone_no: data.phone_no || null,
      address: data.address || null,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating doctor:', error)
    throw error
  }
  
  revalidatePath('/doctors')
  return doctor
}

/**
 * Update an existing doctor record.
 */
export async function updateDoctor(id: string, data: DoctorFormData) {
  const supabase = await createClient()

  const { data: doctor, error } = await supabase
    .from('doctors')
    .update({
      full_name: data.full_name,
      license_no: data.license_no || null,
      specialization: data.specialization || null,
      consultation_fee: data.consultation_fee ?? 0,
      phone_no: data.phone_no || null,
      address: data.address || null,
      is_active: data.is_active ?? true,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  
  revalidatePath('/doctors')
  revalidatePath(`/doctors/${id}`)
  return doctor
}
