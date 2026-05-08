'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ServiceFormData {
  name: string
  type: 'consultation' | 'procedure'
  default_price: number
  is_active?: boolean
}

/**
 * Create a new service record.
 */
export async function createService(data: ServiceFormData) {
  const supabase = await createClient()

  const { data: service, error } = await supabase
    .from('services')
    .insert({
      name: data.name,
      type: data.type,
      default_price: data.default_price,
      is_active: true,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/services')
  return service
}

/**
 * Update an existing service record.
 */
export async function updateService(id: string, data: Partial<ServiceFormData>) {
  const supabase = await createClient()

  const { data: service, error } = await supabase
    .from('services')
    .update({
      ...data,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/services')
  return service
}
