'use server'

import { createClient }  from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect }      from 'next/navigation'
import { headers }       from 'next/headers'
import { writeAuditLog } from '@/lib/audit'

// ── Login with Email + Password ──
export async function loginWithPassword(
  formData: FormData,
  deviceInfo?: { os: string; device_type: string; browser: string }
) {
  const email    = formData.get('email') as string
  const password = formData.get('password') as string
  const headersList = await headers()
  const ip       = headersList.get('x-forwarded-for') ?? 'unknown'
  const supabase = await createClient()

  // Attempt login first to get the user ID
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  // Log attempt
  await supabaseAdmin.from('login_attempts')
    .insert({
      email,
      ip_address:  ip,
      success:     !error,
      stage:       'password',
      os:          deviceInfo?.os          ?? 'Unknown',
      device_type: deviceInfo?.device_type ?? 'Unknown',
      browser:     deviceInfo?.browser     ?? 'Unknown',
    })

  if (error) {
    // We don't have a user ID on failure, so we can't update user_profiles.
    // The account lockout check happens on the next successful login.
    return { error: 'Invalid email or password' }
  }

  const userId = data.user.id

  // Check if account is locked or inactive
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('is_locked, locked_until, failed_attempts, is_active')
    .eq('id', userId)
    .single()

  if (profile) {
    if (!profile.is_active) {
      await supabase.auth.signOut()
      return { error: 'Your account has been deactivated. Contact an admin.' }
    }

    if (profile.is_locked) {
      const unlockTime = new Date(profile.locked_until!)
      if (new Date() < unlockTime) {
        await supabase.auth.signOut()
        return { error: `Account locked. Try again after ${unlockTime.toLocaleTimeString()}` }
      }
      // Auto-unlock if lock period has passed
      await supabaseAdmin.from('user_profiles')
        .update({ is_locked: false, failed_attempts: 0 })
        .eq('id', userId)
    }
  }

  // Reset fail counter on success and update last login time
  await supabaseAdmin.from('user_profiles')
    .update({ failed_attempts: 0, is_locked: false, last_login_at: new Date().toISOString() })
    .eq('id', userId)

  await writeAuditLog({
    performed_by: userId,
    module: 'auth',
    action: 'login',
    entity_type: 'user',
    entity_id: userId,
    entity_label: data.user.email ?? undefined,
    ip_address: ip,
  })

  redirect('/dashboard')
}

export async function sendPasswordReset(formData: FormData) {
  const email    = formData.get('email') as string
  const supabase = await createClient()

  // Supabase handles non-existent emails gracefully (no info leak)
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
  })

  // Always return success (prevent email enumeration)
  return { success: true, message: 'If this email exists, a reset link has been sent.' }
}

export async function logout() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  await writeAuditLog({
    performed_by: user?.id ?? null,
    module: 'auth',
    action: 'logout',
    entity_type: 'user',
    entity_id: user?.id ?? undefined,
    entity_label: user?.email ?? undefined,
  })

  await supabase.auth.signOut()
  redirect('/login')
}
