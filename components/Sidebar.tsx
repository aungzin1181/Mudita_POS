'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import LogoutButton from './LogoutButton'
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  Stethoscope,
  Calendar,
  UserCog,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',       label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/appointments',    label: 'Appointments', icon: Calendar },
  { href: '/pos',             label: 'POS',          icon: ShoppingCart },
  { href: '/patients',        label: 'Patients',     icon: Users },
  { href: '/doctors',         label: 'Doctors',      icon: Stethoscope },
  { href: '/inventory',       label: 'Inventory',    icon: Package },
  { href: '/reports',         label: 'Reports',      icon: BarChart3 },
]

const adminItems = [
  { href: '/settings/users',  label: 'User Admin',   icon: UserCog },
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
        <div style={{
          width: 40, height: 40, borderRadius: 8,
          background: '#ffffff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
        }}>
          <Image
            src="/logo.png"
            alt="မုဒိတာဆေးခန်း"
            width={38}
            height={38}
            style={{ objectFit: 'contain' }}
          />
        </div>
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

        <div className="sidebar-section-label" style={{ marginTop: 16 }}>Settings</div>
        {adminItems.map(({ href, label, icon: Icon }) => (
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
        <LogoutButton />
        <div className="sidebar-footer-text" style={{ marginTop: 12 }}>Medical Clinic POS v1.0</div>
      </div>
    </aside>
  )
}
