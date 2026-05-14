'use client'

import { useState, useTransition, useMemo } from 'react'
import {
  createStaffUser,
  deactivateUser,
  reactivateUser,
  unlockUser,
  changeUserRole,
  adminResetPassword,
} from '@/app/actions/user'

/* ─── Types ─────────────────────────────────────────────────── */
type Profile = {
  id: string
  full_name: string
  role: string
  is_active: boolean
  is_locked: boolean
  failed_attempts: number
  last_login_at: string | null
  created_at: string
}

type LoginAttempt = {
  id: string
  email: string
  ip_address: string | null
  success: boolean
  stage: string | null
  attempted_at: string
}

type Props = {
  profiles: Profile[]
  loginAttempts: LoginAttempt[]
  currentUserId: string
}

/* ─── Role config ────────────────────────────────────────────── */
const ROLES = ['admin', 'doctor', 'nurse', 'cashier'] as const
type Role = typeof ROLES[number]

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  admin:   { bg: 'var(--purple-soft)', color: 'var(--purple)' },
  doctor:  { bg: 'var(--accent-soft)', color: 'var(--accent)' },
  nurse:   { bg: 'var(--green-soft)',  color: 'var(--green)' },
  cashier: { bg: 'var(--amber-soft)',  color: 'var(--amber)' },
}

/* ─── Small helpers ──────────────────────────────────────────── */
function RoleBadge({ role }: { role: string }) {
  const c = ROLE_COLORS[role] ?? { bg: 'var(--surface-alt)', color: 'var(--ink-muted)' }
  return (
    <span className="badge" style={{ background: c.bg, color: c.color }}>
      {role}
    </span>
  )
}

function StatusBadge({ isActive, isLocked }: { isActive: boolean; isLocked: boolean }) {
  if (isLocked)  return <span className="badge badge-inactive">🔒 Locked</span>
  if (!isActive) return <span className="badge badge-inactive">Inactive</span>
  return <span className="badge badge-active">Active</span>
}

function Alert({ type, msg }: { type: 'success' | 'error'; msg: string }) {
  return (
    <div
      className={`alert ${type === 'success' ? 'alert-green' : 'alert-red'}`}
      style={{ marginBottom: 16 }}
    >
      <span>{type === 'success' ? '✓' : '✕'}</span>
      <span>{msg}</span>
    </div>
  )
}

/* ─── Create-User Modal ──────────────────────────────────────── */
function CreateUserModal({ onClose }: { onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createStaffUser(formData)
      setResult(res)
      if (res.success) setTimeout(onClose, 1200)
    })
  }

  return (
    <div style={MODAL_OVERLAY}>
      <div style={MODAL_BOX}>
        <div style={MODAL_HEADER}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>Add Staff Account</h2>
          <button onClick={onClose} style={CLOSE_BTN}>✕</button>
        </div>

        {result?.error   && <Alert type="error"   msg={result.error} />}
        {result?.success && <Alert type="success" msg="Staff account created successfully!" />}

        <form onSubmit={handleSubmit}>
          <div className="form-grid-2" style={{ gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input name="full_name" required className="form-input" placeholder="Dr. John Doe" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input name="email" type="email" required className="form-input" placeholder="john@clinic.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select name="role" required className="form-input">
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Temporary Password</label>
              <input name="temp_password" type="password" required className="form-input" minLength={8} placeholder="Min 8 characters" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn">Cancel</button>
            <button type="submit" disabled={pending} className="btn btn-primary">
              {pending ? 'Creating…' : '+ Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Reset-Password Modal ───────────────────────────────────── */
function ResetPasswordModal({ user, onClose }: { user: Profile; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)
  const [pw, setPw] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await adminResetPassword(user.id, pw)
      setResult(res)
      if (res.success) setTimeout(onClose, 1200)
    })
  }

  return (
    <div style={MODAL_OVERLAY}>
      <div style={{ ...MODAL_BOX, maxWidth: 440 }}>
        <div style={MODAL_HEADER}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 20 }}>Reset Password</h2>
          <button onClick={onClose} style={CLOSE_BTN}>✕</button>
        </div>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginBottom: 16 }}>
          Setting a new password for <strong>{user.full_name}</strong> will sign them out immediately.
        </p>

        {result?.error   && <Alert type="error"   msg={result.error} />}
        {result?.success && <Alert type="success" msg="Password reset. User has been signed out." />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-input"
              minLength={8}
              placeholder="Min 8 characters"
              value={pw}
              onChange={e => setPw(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn">Cancel</button>
            <button type="submit" disabled={pending || pw.length < 8} className="btn btn-primary">
              {pending ? 'Resetting…' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Role-Change Modal ──────────────────────────────────────── */
function ChangeRoleModal({ user, onClose }: { user: Profile; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)
  const [role, setRole] = useState<string>(user.role)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await changeUserRole(user.id, role)
      setResult(res)
      if (res.success) setTimeout(onClose, 1000)
    })
  }

  return (
    <div style={MODAL_OVERLAY}>
      <div style={{ ...MODAL_BOX, maxWidth: 420 }}>
        <div style={MODAL_HEADER}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 20 }}>Change Role</h2>
          <button onClick={onClose} style={CLOSE_BTN}>✕</button>
        </div>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginBottom: 16 }}>
          Updating role for <strong>{user.full_name}</strong>
        </p>

        {result?.error   && <Alert type="error"   msg={result.error} />}
        {result?.success && <Alert type="success" msg="Role updated successfully." />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">New Role</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
              {ROLES.map(r => {
                const c = ROLE_COLORS[r]
                const selected = role === r
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 8,
                      border: selected ? `2px solid ${c.color}` : '2px solid var(--border)',
                      background: selected ? c.bg : 'var(--surface)',
                      color: selected ? c.color : 'var(--ink-muted)',
                      fontWeight: selected ? 600 : 400,
                      cursor: 'pointer',
                      fontSize: 14,
                      transition: 'all 0.15s',
                    }}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" onClick={onClose} className="btn">Cancel</button>
            <button type="submit" disabled={pending || role === user.role} className="btn btn-primary">
              {pending ? 'Saving…' : 'Save Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Users Tab ──────────────────────────────────────────────── */
function UsersTab({
  profiles,
  currentUserId,
}: {
  profiles: Profile[]
  currentUserId: string
}) {
  const [search, setSearch]           = useState('')
  const [filterRole, setFilterRole]   = useState<string>('all')
  const [showCreate, setShowCreate]   = useState(false)
  const [resetTarget, setResetTarget] = useState<Profile | null>(null)
  const [roleTarget, setRoleTarget]   = useState<Profile | null>(null)
  const [pending, startTransition]    = useTransition()

  const filtered = useMemo(() => {
    return profiles.filter(p => {
      const matchSearch = p.full_name.toLowerCase().includes(search.toLowerCase())
      const matchRole   = filterRole === 'all' || p.role === filterRole
      return matchSearch && matchRole
    })
  }, [profiles, search, filterRole])

  const stats = useMemo(() => ({
    total:    profiles.length,
    active:   profiles.filter(p => p.is_active).length,
    locked:   profiles.filter(p => p.is_locked).length,
    admins:   profiles.filter(p => p.role === 'admin').length,
  }), [profiles])

  const handleDeactivate = (userId: string) => {
    startTransition(async () => { await deactivateUser(userId) })
  }
  const handleReactivate = (userId: string) => {
    startTransition(async () => { await reactivateUser(userId) })
  }
  const handleUnlock = (userId: string) => {
    startTransition(async () => { await unlockUser(userId) })
  }

  return (
    <>
      {/* Stat cards */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Accounts', value: stats.total,  cls: 'stat-card-accent' },
          { label: 'Active',         value: stats.active,  cls: 'stat-card-green' },
          { label: 'Locked',         value: stats.locked,  cls: 'stat-card-amber' },
          { label: 'Admins',         value: stats.admins,  cls: 'stat-card-red'   },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <div className="search-box" style={{ flex: 1 }}>
          <span className="search-box-icon">🔍</span>
          <input
            className="form-input"
            style={{ paddingLeft: 38 }}
            placeholder="Search by name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input"
          style={{ width: 150 }}
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Add Staff
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Failed Attempts</th>
                <th>Last Login</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">👤</div>
                      <div className="empty-state-title">No accounts found</div>
                      <div className="empty-state-sub">
                        {search ? 'Try a different search term.' : 'Add the first staff member above.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(p => {
                const isSelf = p.id === currentUserId
                return (
                  <tr key={p.id} style={{ opacity: isSelf ? 1 : undefined }}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.full_name}</div>
                      {isSelf && <div style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>YOU</div>}
                    </td>
                    <td><RoleBadge role={p.role} /></td>
                    <td><StatusBadge isActive={p.is_active} isLocked={p.is_locked} /></td>
                    <td>
                      <span style={{
                        color: p.failed_attempts >= 3 ? 'var(--red)' : 'inherit',
                        fontFamily: 'var(--mono)',
                        fontWeight: p.failed_attempts >= 3 ? 600 : 400,
                      }}>
                        {p.failed_attempts}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                      {p.last_login_at ? new Date(p.last_login_at).toLocaleString() : '—'}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {!isSelf && (
                          <>
                            <button
                              className="btn btn-sm"
                              onClick={() => setRoleTarget(p)}
                              style={{ fontSize: 12 }}
                            >
                              Change Role
                            </button>
                            <button
                              className="btn btn-sm"
                              onClick={() => setResetTarget(p)}
                              style={{ fontSize: 12 }}
                            >
                              Reset PW
                            </button>
                            {p.is_locked && (
                              <button
                                className="btn btn-sm"
                                style={{ background: 'var(--amber-soft)', color: 'var(--amber)', borderColor: 'var(--amber)', fontSize: 12 }}
                                onClick={() => handleUnlock(p.id)}
                                disabled={pending}
                              >
                                Unlock
                              </button>
                            )}
                            {p.is_active ? (
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDeactivate(p.id)}
                                disabled={pending}
                                style={{ fontSize: 12 }}
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                className="btn btn-sm"
                                style={{ background: 'var(--green-soft)', color: 'var(--green)', borderColor: 'var(--green)', fontSize: 12 }}
                                onClick={() => handleReactivate(p.id)}
                                disabled={pending}
                              >
                                Activate
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showCreate  && <CreateUserModal    onClose={() => setShowCreate(false)} />}
      {resetTarget && <ResetPasswordModal user={resetTarget} onClose={() => setResetTarget(null)} />}
      {roleTarget  && <ChangeRoleModal    user={roleTarget}  onClose={() => setRoleTarget(null)} />}
    </>
  )
}

/* ─── Login Attempts Tab ─────────────────────────────────────── */
function LoginAttemptsTab({ attempts }: { attempts: LoginAttempt[] }) {
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all')

  const filtered = attempts.filter(a => {
    if (filter === 'success') return a.success
    if (filter === 'failed')  return !a.success
    return true
  })

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['all', 'success', 'failed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="btn btn-sm"
            style={{
              background: filter === f ? 'var(--accent)' : 'var(--surface)',
              color: filter === f ? '#fff' : 'var(--ink)',
              borderColor: filter === f ? 'var(--accent)' : 'var(--border)',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-muted)', alignSelf: 'center' }}>
          Last 50 attempts
        </span>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Email</th>
                <th>IP Address</th>
                <th>Stage</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <div className="empty-state-title">No login attempts</div>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(a => (
                <tr key={a.id}>
                  <td style={{ fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--ink-muted)' }}>
                    {new Date(a.attempted_at).toLocaleString()}
                  </td>
                  <td style={{ fontSize: 13 }}>{a.email}</td>
                  <td style={{ fontSize: 13, fontFamily: 'var(--mono)' }}>{a.ip_address ?? '—'}</td>
                  <td>
                    {a.stage && (
                      <span className="badge" style={{ background: 'var(--surface-alt)', color: 'var(--ink-muted)' }}>
                        {a.stage}
                      </span>
                    )}
                  </td>
                  <td>
                    {a.success
                      ? <span className="badge badge-active">✓ Success</span>
                      : <span className="badge badge-inactive">✕ Failed</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

/* ─── Modal styles ───────────────────────────────────────────── */
const MODAL_OVERLAY: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(15,25,35,0.55)',
  backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', zIndex: 999, padding: 20,
}
const MODAL_BOX: React.CSSProperties = {
  background: 'var(--surface)', borderRadius: 16,
  padding: 32, width: '100%', maxWidth: 600,
  boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
}
const MODAL_HEADER: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between',
  alignItems: 'center', marginBottom: 24,
}
const CLOSE_BTN: React.CSSProperties = {
  background: 'none', border: 'none', fontSize: 18,
  color: 'var(--ink-muted)', cursor: 'pointer', lineHeight: 1,
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function UserManagementClient({ profiles, loginAttempts, currentUserId }: Props) {
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users')

  return (
    <div className="container">
      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Administration</div>
          <h1 className="page-title">User Management</h1>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid var(--border)', marginBottom: 28 }}>
        {([
          { id: 'users', label: '👥 Staff Accounts' },
          { id: 'logs',  label: '🔐 Login Audit Log' },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--mono)',
              fontSize: 13,
              fontWeight: activeTab === t.id ? 600 : 400,
              color: activeTab === t.id ? 'var(--accent)' : 'var(--ink-muted)',
              borderBottom: activeTab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -2,
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <UsersTab profiles={profiles} currentUserId={currentUserId} />
      )}
      {activeTab === 'logs' && (
        <LoginAttemptsTab attempts={loginAttempts} />
      )}
    </div>
  )
}
