'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { writeAuditLog, getClientIp } from '@/lib/audit'

type ActionResult = { success: boolean; error?: string }

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.app_metadata?.user_role !== 'admin') {
    throw new Error('Permission denied. Admin role required.')
  }
  return user
}

/**
 * Fetch a general clinic setting by key.
 * Gracefully falls back to a default value if the table is not migrated yet or doesn't exist.
 */
export async function getSetting(key: string, defaultValue: string = 'true'): Promise<string> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('clinic_settings')
      .select('value')
      .eq('key', key)
      .single()

    if (error || !data) {
      return defaultValue
    }
    return data.value
  } catch (err) {
    // Graceful fallback for seamless schema evolution
    return defaultValue
  }
}

/**
 * Update a clinic setting and log the action.
 */
export async function updateSetting(key: string, value: string, description?: string): Promise<ActionResult> {
  try {
    const caller = await requireAdmin()
    const ip = await getClientIp()
    const supabase = await createClient()

    // Get previous value for audit logging
    const previousValue = await getSetting(key, 'true')

    const { error } = await supabase
      .from('clinic_settings')
      .upsert({
        key,
        value,
        description: description || 'Updated system setting',
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })

    if (error) throw error

    // Write audit log
    await writeAuditLog({
      performed_by: caller.id,
      module: 'pos',
      action: 'setting_changed',
      entity_type: 'setting',
      entity_id: key,
      entity_label: `Setting: ${key}`,
      previous_data: { value: previousValue },
      new_data: { value },
      ip_address: ip,
    })

    revalidatePath('/settings/users')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
