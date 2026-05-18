'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { writeAuditLog, getClientIp } from '@/lib/audit'

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
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null
  const ip = await getClientIp()

  const { data: doctor, error } = await supabase
    .from('doctors')
    .insert({
      full_name:        data.full_name,
      license_no:       data.license_no || null,
      specialization:   data.specialization || null,
      consultation_fee: data.consultation_fee ?? 0,
      phone_no:         data.phone_no || null,
      address:          data.address || null,
      is_active:        true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating doctor:', error)
    throw error
  }

  await writeAuditLog({
    performed_by: userId,
    module: 'doctor',
    action: 'doctor_created',
    entity_type: 'doctor',
    entity_id: doctor.id,
    entity_label: data.full_name,
    new_data: { ...data } as unknown as Record<string, unknown>,
    ip_address: ip,
  })

  revalidatePath('/doctors')
  return doctor
}

/**
 * Update an existing doctor record.
 */
export async function updateDoctor(id: string, data: DoctorFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null
  const ip = await getClientIp()

  // Capture previous state — fee changes are particularly important
  const { data: before } = await supabase
    .from('doctors')
    .select('*')
    .eq('id', id)
    .single()

  const { data: doctor, error } = await supabase
    .from('doctors')
    .update({
      full_name:        data.full_name,
      license_no:       data.license_no || null,
      specialization:   data.specialization || null,
      consultation_fee: data.consultation_fee ?? 0,
      phone_no:         data.phone_no || null,
      address:          data.address || null,
      is_active:        data.is_active ?? true,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Flag fee changes explicitly for easy filtering
  const action = before?.consultation_fee !== data.consultation_fee
    ? 'fee_changed'
    : 'doctor_updated'

  await writeAuditLog({
    performed_by: userId,
    module: 'doctor',
    action,
    entity_type: 'doctor',
    entity_id: id,
    entity_label: data.full_name,
    previous_data: before as unknown as Record<string, unknown>,
    new_data: { ...data } as unknown as Record<string, unknown>,
    ip_address: ip,
  })

  revalidatePath('/doctors')
  revalidatePath(`/doctors/${id}`)
  return doctor
}
