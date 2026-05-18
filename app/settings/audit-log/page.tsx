import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Shield, User, Package, UserCheck, Calendar, LogIn, Stethoscope } from 'lucide-react'
import AuditLogTable from './AuditLogTable'

const MODULE_META: Record<string, { label: string; color: string; icon: string }> = {
  inventory:   { label: 'Inventory',   color: '#7c3aed', icon: '📦' },
  patient:     { label: 'Patient',     color: '#0891b2', icon: '🏥' },
  doctor:      { label: 'Doctor',      color: '#059669', icon: '🩺' },
  appointment: { label: 'Appointment', color: '#d97706', icon: '📅' },
  user_mgmt:   { label: 'User Mgmt',   color: '#dc2626', icon: '👤' },
  auth:        { label: 'Auth',        color: '#475569', icon: '🔐' },
  pos:         { label: 'POS',         color: '#10b981', icon: '🛒' },
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
  login:               'Login',
  logout:              'Logout',
  transaction_created: 'Transaction Created',
  item_added:          'Item Added',
  item_removed:        'Item Removed',
  qty_changed:         'Quantity Changed',
  discount_applied:    'Discount Applied',
  transaction_paid:    'Transaction Paid',
  transaction_voided:  'Transaction Voided',
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

  // Collect patient IDs and doctor IDs from JSON data
  const patientIds = new Set<string>()
  const doctorIds = new Set<string>()

  for (const log of logs ?? []) {
    const pd = log.previous_data || {}
    const nd = log.new_data || {}
    if (pd.patient_id) patientIds.add(pd.patient_id)
    if (nd.patient_id) patientIds.add(nd.patient_id)
    if (pd.doctor_id) doctorIds.add(pd.doctor_id)
    if (nd.doctor_id) doctorIds.add(nd.doctor_id)
  }

  const entityNames: Record<string, string> = {}

  if (patientIds.size > 0) {
    const { data: patients } = await supabaseAdmin
      .from('patients')
      .select('id, full_name')
      .in('id', Array.from(patientIds))
    for (const p of patients ?? []) {
      entityNames[p.id] = p.full_name
    }
  }

  if (doctorIds.size > 0) {
    const { data: doctors } = await supabaseAdmin
      .from('doctors')
      .select('id, full_name')
      .in('id', Array.from(doctorIds))
    for (const d of doctors ?? []) {
      entityNames[d.id] = `Dr. ${d.full_name}`
    }
  }

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
        <AuditLogTable 
          logs={logs || []} 
          userNames={userNames} 
          entityNames={entityNames}
          MODULE_META={MODULE_META} 
          ACTION_LABELS={ACTION_LABELS} 
        />

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
