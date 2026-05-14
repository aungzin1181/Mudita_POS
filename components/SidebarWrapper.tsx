'use client'

import Sidebar from './Sidebar'
import { usePathname } from 'next/navigation'

export default function SidebarWrapper() {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login'

  if (isAuthPage) return null

  return <Sidebar />
}
