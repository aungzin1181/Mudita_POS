import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import UserManagementClient from './UserManagementClient'
import { getSetting } from '@/app/actions/settings'

export const dynamic  = 'force-dynamic'
export const revalidate = 0

export default async function UsersSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.app_metadata?.user_role !== 'admin') {
    redirect('/403')
  }

  const [
    { data: profiles },
    { data: attempts },
    autoConsultationFeeStr
  ] = await Promise.all([
    supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('login_attempts')
      .select('*')
      .order('attempted_at', { ascending: false })
      .limit(50),
    getSetting('auto_consultation_fee', 'true')
  ])

  const autoConsultationFee = autoConsultationFeeStr === 'true'

  return (
    <UserManagementClient
      profiles={profiles || []}
      loginAttempts={attempts || []}
      currentUserId={user.id}
      initialAutoConsultationFee={autoConsultationFee}
    />
  )
}
