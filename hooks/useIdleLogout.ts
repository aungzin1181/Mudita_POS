'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient }  from '@/lib/supabase/client'
import { useRouter }     from 'next/navigation'

const IDLE_TIMEOUT = 30 * 60 * 1000   // 30 minutes in ms
const WARN_BEFORE  = 2  * 60 * 1000   // warn 2 mins before logout

export function useIdleLogout() {
  const router      = useRouter()
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warnRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase    = createClient()

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/login?reason=idle')
  }, [supabase, router])

  const resetTimer = useCallback(() => {
    clearTimeout(timerRef.current)
    clearTimeout(warnRef.current)

    // Show warning 2 mins before logout
    warnRef.current = setTimeout(() => {
      // Dispatch custom event — UI can show a toast warning
      window.dispatchEvent(new CustomEvent('idle-warning'))
    }, IDLE_TIMEOUT - WARN_BEFORE)

    timerRef.current = setTimeout(logout, IDLE_TIMEOUT)
  }, [logout])

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()   // Start on mount

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      clearTimeout(timerRef.current)
      clearTimeout(warnRef.current)
    }
  }, [resetTimer])
}
