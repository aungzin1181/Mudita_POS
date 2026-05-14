'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient }  from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createStaffUser(formData: FormData) {
  // Verify caller is admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.app_metadata?.user_role !== 'admin') {
    throw new Error('Permission denied')
  }

  const email     = formData.get('email') as string
  const fullName  = formData.get('full_name') as string
  const role      = formData.get('role') as string
  const tempPass  = formData.get('temp_password') as string

  // Create auth user (Service Role bypasses signup restriction)
  const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPass,
    email_confirm: true,       // skip email confirmation
    app_metadata: { user_role: role }
  })

  if (error) throw new Error(error.message)

  // Create profile record
  await supabaseAdmin.from('user_profiles').insert({
    id:         newUser.user.id,
    full_name:  fullName,
    role:       role,
    created_by: user!.id
  })

  revalidatePath('/settings/users')
  return { success: true, userId: newUser.user.id }
}

// Deactivate user (soft delete)
export async function deactivateUser(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.app_metadata?.user_role !== 'admin') {
    throw new Error('Permission denied')
  }

  await supabaseAdmin.from('user_profiles')
    .update({ is_active: false })
    .eq('id', userId)

  // Invalidate all sessions
  await supabaseAdmin.auth.admin.signOut(userId, 'global')
  revalidatePath('/settings/users')
}

// Change role
export async function changeUserRole(userId: string, newRole: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.app_metadata?.user_role !== 'admin') {
    throw new Error('Permission denied')
  }

  await supabaseAdmin.from('user_profiles')
    .update({ role: newRole }).eq('id', userId)

  await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { user_role: newRole }
  })
  revalidatePath('/settings/users')
}

export async function adminResetPassword(userId: string, newPassword: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.app_metadata?.user_role !== 'admin') {
    throw new Error('Permission denied')
  }

  await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword
  })
  // Force re-login
  await supabaseAdmin.auth.admin.signOut(userId, 'global')
}
