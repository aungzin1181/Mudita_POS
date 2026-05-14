import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserManagementClient from './UserManagementClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function UsersSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.app_metadata?.user_role !== 'admin') {
    redirect('/403')
  }

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return <UserManagementClient profiles={profiles || []} />
}
