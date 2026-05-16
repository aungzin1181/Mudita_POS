import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Shield, User, Package, UserCheck, Calendar, LogIn, Stethoscope } from 'lucide-react'

const MODULE_META: Record<string, { label: string; color: string; icon: string }> = {
  inventory:   { label: 'Inventory',   color: '#7c3aed', icon: '📦' },
  patient:     { label: 'Patient',     color: '#0891b2', icon: '🏥' },
  doctor:      { label: 'Doctor',      color: '#059669', icon: '🩺' },
  appointment: { label: 'Appointment', color: '#d97706', icon: '📅' },
  user_mgmt:   { label: 'User Mgmt',   color: '#dc2626', icon: '👤' },
  auth:        { label: 'Auth',        color: '#475569', icon: '🔐' },
}

const ACTION_LABELS: Record<string, string> = {
  product_created:     'Product Created',
  product_updated:     'Product Updated',
  stock_adjusted:      'Stock Adjusted',
  patient_created:     'Patient Created',
  patient_updated:     'Patient Updated',
  patient_deleted:     'Patient Deleted',
  vitals_recorded:     'Vitals Recorded',
  doctor_created:      'Doctor Created',
  doctor_updated:      'Doctor Updated',
  fee_changed:         'Fee Changed',
  appointment_created: 'Appointment Created',
  status_changed:      'Status Changed',
  staff_created:       'Staff Created',
  user_deactivated:    'User Deactivated',
  user_reactivated:    'User Reactivated',
  user_unlocked:       'Account Unlocked',
  role_changed:        'Role Changed',
  password_reset:      'Password Reset',
  logout:              'Logout',
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string; page?: string }>
}) {
  const supabase = await createClient()
  const { module: moduleFilter, page } = await searchParams
  const currentPage = parseInt(page ?? '1', 10)
  const pageSize = 50
  const offset = (currentPage - 1) * pageSize

  let query = supabaseAdmin
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (moduleFilter) {
    query = query.eq('module', moduleFilter)
  }

  const { data: logs, count } = await query

  // Fetch user names for performed_by IDs
  const userIds = [...new Set((logs ?? []).map(l => l.performed_by).filter(Boolean))]
  const userNames: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('id, full_name')
      .in('id', userIds)
    for (const p of profiles ?? []) {
      userNames[p.id] = p.full_name
    }
  }

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Settings · Security</div>
          <h1 className="page-title">Audit <em>Log</em></h1>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: '24px' }}>
        {Object.entries(MODULE_META).map(([mod, meta]) => (
          <a
            key={mod}
            href={`/settings/audit-log${moduleFilter === mod ? '' : `?module=${mod}`}`}
            className={`stat-card ${moduleFilter === mod ? 'stat-card-accent' : ''}`}
            style={{ textDecoration: 'none', cursor: 'pointer', borderColor: moduleFilter === mod ? meta.color : undefined }}
          >
            <div className="stat-label">{meta.icon} {meta.label}</div>
          </a>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-mono" style={{ fontSize: '14px' }}>
            {moduleFilter ? `${MODULE_META[moduleFilter]?.icon} ${MODULE_META[moduleFilter]?.label} Events` : 'All Events'}
          </h3>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span className="text-muted text-mono" style={{ fontSize: '12px' }}>{count ?? 0} total entries</span>
            {moduleFilter && (
              <a href="/settings/audit-log" className="btn btn-sm">Clear filter</a>
            )}
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {logs && logs.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Module</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Performed By</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const meta = MODULE_META[log.module] ?? { label: log.module, color: '#64748b', icon: '•' }
                  return (
                    <tr key={log.id}>
                      <td className="text-mono" style={{ fontSize: '12px', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleDateString()}{' '}
                        <span style={{ color: 'var(--muted)' }}>
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: `${meta.color}18`,
                            color: meta.color,
                            border: `1px solid ${meta.color}30`,
                            fontFamily: 'var(--mono)',
                            fontSize: '10px',
                          }}
                        >
                          {meta.icon} {meta.label}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500, fontSize: '13px' }}>
                        {ACTION_LABELS[log.action] ?? log.action}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: '13px' }}>{log.entity_label ?? log.entity_type}</div>
                        {log.entity_id && (
                          <div className="text-mono text-muted" style={{ fontSize: '10px' }}>
                            {log.entity_id.slice(0, 8)}…
                          </div>
                        )}
                      </td>
                      <td>
                        {log.performed_by
                          ? (
                            <span style={{ fontWeight: 500, fontSize: '13px' }}>
                              {userNames[log.performed_by] ?? 'Unknown'}
                            </span>
                          )
                          : <span className="text-muted" style={{ fontSize: '12px' }}>System</span>
                        }
                      </td>
                      <td className="text-mono" style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        {log.ip_address ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--ink-muted)' }}>
              <Shield size={40} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
              <div style={{ fontWeight: 600, marginBottom: '6px' }}>No audit events found</div>
              <div style={{ fontSize: '13px' }}>Events will appear here as actions are performed.</div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card-body" style={{ borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted text-mono" style={{ fontSize: '12px' }}>
              Page {currentPage} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {currentPage > 1 && (
                <a
                  href={`/settings/audit-log?${moduleFilter ? `module=${moduleFilter}&` : ''}page=${currentPage - 1}`}
                  className="btn btn-sm"
                >
                  ← Previous
                </a>
              )}
              {currentPage < totalPages && (
                <a
                  href={`/settings/audit-log?${moduleFilter ? `module=${moduleFilter}&` : ''}page=${currentPage + 1}`}
                  className="btn btn-sm"
                >
                  Next →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
