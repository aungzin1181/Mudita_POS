'use server'

import { createClient }      from '@/lib/supabase/server'
import { supabaseAdmin }     from '@/lib/supabase/admin'
import { redirect }          from 'next/navigation'
import { headers }           from 'next/headers'
import { sendOTPEmail }      from '@/lib/email'
import * as bcrypt           from 'bcryptjs'

// ── Step 1: Email + Password ──
export async function loginWithPassword(formData: FormData) {
  const email    = formData.get('email') as string
  const password = formData.get('password') as string
  const headersList = await headers()
  const ip       = headersList.get('x-forwarded-for') ?? 'unknown'
  const supabase = await createClient()

  // Check account lock
  const authUserResp = await supabaseAdmin.auth.admin.getUserByEmail(email)
  const authUserId = authUserResp.data?.user?.id

  if (authUserId) {
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('is_locked, locked_until, failed_attempts, is_active')
      .eq('id', authUserId)
      .single()

    if (profile?.is_locked) {
      const unlockTime = new Date(profile.locked_until!)
      if (new Date() < unlockTime) {
        return { error: `Account locked. Try again after ${unlockTime.toLocaleTimeString()}` }
      }
      // Auto-unlock if time passed
      await supabaseAdmin.from('user_profiles')
        .update({ is_locked: false, failed_attempts: 0 })
        .eq('id', authUserId)
    }
  }

  // Attempt login
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  // Log attempt
  await supabaseAdmin.from('login_attempts')
    .insert({ email, ip_address: ip, success: !error, stage: 'password' })

  if (error) {
    if (authUserId) {
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('failed_attempts')
        .eq('id', authUserId)
        .single()
      
      const newCount = (profile?.failed_attempts ?? 0) + 1
      const lockUpdate = newCount >= 5
        ? { failed_attempts: newCount, is_locked: true,
            locked_until: new Date(Date.now() + 15 * 60000).toISOString() }
        : { failed_attempts: newCount }
      
      await supabaseAdmin.from('user_profiles')
        .update(lockUpdate).eq('id', authUserId)
        
      return { error: 'Invalid email or password', remaining: 5 - newCount }
    }
    return { error: 'Invalid email or password' }
  }

  // Reset fail counter on success and update last login time
  await supabaseAdmin.from('user_profiles')
    .update({ failed_attempts: 0, is_locked: false, last_login_at: new Date().toISOString() })
    .eq('id', data.user!.id)

  redirect('/dashboard')
}



export async function sendPasswordReset(formData: FormData) {
  const email    = formData.get('email') as string
  const supabase = await createClient()

  // Verify email exists in user_profiles (no info leak)
  const { data: authUser } =
    await supabaseAdmin.auth.admin.getUserByEmail(email)

  if (authUser?.user) {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
    })
  }

  // Always return success (prevent email enumeration)
  return { success: true, message: 'If this email exists, a reset link has been sent.' }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
