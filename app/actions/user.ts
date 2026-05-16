'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient }  from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { writeAuditLog } from '@/lib/audit'

type ActionResult = { success: boolean; error?: string }

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.app_metadata?.user_role !== 'admin') {
    throw new Error('Permission denied')
  }
  return user
}

async function getClientIp(): Promise<string | null> {
  try {
    const h = await headers()
    return h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? null
  } catch {
    return null
  }
}

export async function createStaffUser(formData: FormData): Promise<ActionResult> {
  try {
    const caller    = await requireAdmin()
    const ip        = await getClientIp()
    const email     = formData.get('email')         as string
    const fullName  = formData.get('full_name')      as string
    const role      = formData.get('role')            as string
    const tempPass  = formData.get('temp_password')   as string

    const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPass,
      email_confirm: true,
      app_metadata: { user_role: role },
    })
    if (error) return { success: false, error: error.message }

    const { error: profileErr } = await supabaseAdmin.from('user_profiles').insert({
      id:         newUser.user.id,
      full_name:  fullName,
      role,
      created_by: caller.id,
    })
    if (profileErr) return { success: false, error: profileErr.message }

    await writeAuditLog({
      performed_by: caller.id,
      module: 'user_mgmt',
      action: 'staff_created',
      entity_type: 'user',
      entity_id: newUser.user.id,
      entity_label: `${fullName} <${email}>`,
      new_data: { email, full_name: fullName, role },
      ip_address: ip,
    })

    revalidatePath('/settings/users')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function deactivateUser(userId: string): Promise<ActionResult> {
  try {
    const caller = await requireAdmin()
    const ip     = await getClientIp()

    const { data: target } = await supabaseAdmin
      .from('user_profiles').select('full_name, role').eq('id', userId).single()

    await supabaseAdmin.from('user_profiles').update({ is_active: false }).eq('id', userId)
    await supabaseAdmin.auth.admin.signOut(userId, 'global')

    await writeAuditLog({
      performed_by: caller.id,
      module: 'user_mgmt',
      action: 'user_deactivated',
      entity_type: 'user',
      entity_id: userId,
      entity_label: target?.full_name ?? userId,
      previous_data: { is_active: true, role: target?.role },
      new_data: { is_active: false },
      ip_address: ip,
    })

    revalidatePath('/settings/users')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function reactivateUser(userId: string): Promise<ActionResult> {
  try {
    const caller = await requireAdmin()
    const ip     = await getClientIp()

    const { data: target } = await supabaseAdmin
      .from('user_profiles').select('full_name, role').eq('id', userId).single()

    await supabaseAdmin.from('user_profiles')
      .update({ is_active: true, is_locked: false, failed_attempts: 0 })
      .eq('id', userId)

    await writeAuditLog({
      performed_by: caller.id,
      module: 'user_mgmt',
      action: 'user_reactivated',
      entity_type: 'user',
      entity_id: userId,
      entity_label: target?.full_name ?? userId,
      new_data: { is_active: true },
      ip_address: ip,
    })

    revalidatePath('/settings/users')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function unlockUser(userId: string): Promise<ActionResult> {
  try {
    const caller = await requireAdmin()
    const ip     = await getClientIp()

    const { data: target } = await supabaseAdmin
      .from('user_profiles').select('full_name').eq('id', userId).single()

    await supabaseAdmin.from('user_profiles')
      .update({ is_locked: false, failed_attempts: 0, locked_until: null })
      .eq('id', userId)

    await writeAuditLog({
      performed_by: caller.id,
      module: 'user_mgmt',
      action: 'user_unlocked',
      entity_type: 'user',
      entity_id: userId,
      entity_label: target?.full_name ?? userId,
      new_data: { is_locked: false, failed_attempts: 0 },
      ip_address: ip,
    })

    revalidatePath('/settings/users')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function changeUserRole(userId: string, newRole: string): Promise<ActionResult> {
  try {
    const caller = await requireAdmin()
    const ip     = await getClientIp()

    const { data: target } = await supabaseAdmin
      .from('user_profiles').select('full_name, role').eq('id', userId).single()

    await supabaseAdmin.from('user_profiles').update({ role: newRole }).eq('id', userId)
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { user_role: newRole },
    })

    await writeAuditLog({
      performed_by: caller.id,
      module: 'user_mgmt',
      action: 'role_changed',
      entity_type: 'user',
      entity_id: userId,
      entity_label: target?.full_name ?? userId,
      previous_data: { role: target?.role },
      new_data: { role: newRole },
      ip_address: ip,
    })

    revalidatePath('/settings/users')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function adminResetPassword(userId: string, newPassword: string): Promise<ActionResult> {
  try {
    const caller = await requireAdmin()
    const ip     = await getClientIp()

    const { data: target } = await supabaseAdmin
      .from('user_profiles').select('full_name').eq('id', userId).single()

    await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword })
    await supabaseAdmin.auth.admin.signOut(userId, 'global')

    await writeAuditLog({
      performed_by: caller.id,
      module: 'user_mgmt',
      action: 'password_reset',
      entity_type: 'user',
      entity_id: userId,
      entity_label: target?.full_name ?? userId,
      // Deliberately no password data in log
      new_data: { forced_sign_out: true },
      ip_address: ip,
    })

    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
