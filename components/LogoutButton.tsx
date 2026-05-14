'use client'

import { useTransition } from 'react'
import { logout } from '@/app/actions/auth'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const [pending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      await logout()
    })
  }

  return (
    <button
      onClick={handleLogout}
      disabled={pending}
      className="sidebar-nav-item"
      style={{
        width: '100%',
        border: 'none',
        background: 'none',
        cursor: pending ? 'not-allowed' : 'pointer',
        color: pending ? 'rgba(255,255,255,0.3)' : '#f87171',
        fontWeight: 600,
        textAlign: 'left',
        opacity: pending ? 0.6 : 1,
        transition: 'all 0.2s',
      }}
    >
      <LogOut size={16} />
      <span>{pending ? 'Signing out…' : 'Logout'}</span>
    </button>
  )
}
