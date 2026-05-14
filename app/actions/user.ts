'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient }  from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type ActionResult = { success: boolean; error?: string }

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.app_metadata?.user_role !== 'admin') {
    throw new Error('Permission denied')
  }
  return user
}

export async function createStaffUser(formData: FormData): Promise<ActionResult> {
  try {
    const caller = await requireAdmin()

    const email    = formData.get('email')    as string
    const fullName = formData.get('full_name') as string
    const role     = formData.get('role')      as string
    const tempPass = formData.get('temp_password') as string

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

    revalidatePath('/settings/users')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function deactivateUser(userId: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    await supabaseAdmin.from('user_profiles').update({ is_active: false }).eq('id', userId)
    await supabaseAdmin.auth.admin.signOut(userId, 'global')
    revalidatePath('/settings/users')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function reactivateUser(userId: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    await supabaseAdmin.from('user_profiles')
      .update({ is_active: true, is_locked: false, failed_attempts: 0 })
      .eq('id', userId)
    revalidatePath('/settings/users')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function unlockUser(userId: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    await supabaseAdmin.from('user_profiles')
      .update({ is_locked: false, failed_attempts: 0, locked_until: null })
      .eq('id', userId)
    revalidatePath('/settings/users')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function changeUserRole(userId: string, newRole: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    await supabaseAdmin.from('user_profiles').update({ role: newRole }).eq('id', userId)
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { user_role: newRole },
    })
    revalidatePath('/settings/users')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function adminResetPassword(userId: string, newPassword: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword })
    await supabaseAdmin.auth.admin.signOut(userId, 'global')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
