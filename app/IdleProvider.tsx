'use client'

import { useIdleLogout } from '@/hooks/useIdleLogout'
import { IdleWarningToast } from '@/components/pos/IdleWarningToast'
import { usePathname } from 'next/navigation'

export function IdleProvider() {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login'

  if (isAuthPage) return null

  return (
    <>
      <IdleHookWrapper />
      <IdleWarningToast />
    </>
  )
}

function IdleHookWrapper() {
  useIdleLogout()
  return null
}
