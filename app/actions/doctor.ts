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

export async function createDoctor(data: DoctorFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

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

  if (error) throw error
  revalidatePath('/doctors')
  return doctor
}

export async function updateDoctor(id: string, data: DoctorFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

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
