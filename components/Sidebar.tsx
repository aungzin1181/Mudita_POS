'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  Stethoscope,
  Settings,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pos', label: 'POS', icon: ShoppingCart },
  { href: '/patients', label: 'Patients', icon: Users },
  { href: '/doctors', label: 'Doctors', icon: Stethoscope },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/pos') return pathname === '/pos' || pathname.startsWith('/pos/')
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🏥</div>
        <div>
          <div className="sidebar-logo-title">မုဒိတာဆေးခန်း</div>
          <div className="sidebar-logo-sub">POS System</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`sidebar-nav-item${isActive(href) ? ' active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-text">Medical Clinic POS v1.0</div>
      </div>
    </aside>
  )
}
