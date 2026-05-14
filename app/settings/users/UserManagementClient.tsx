'use client'

import { useActionState, useTransition } from 'react'
import { createStaffUser, deactivateUser, changeUserRole } from '@/app/actions/user'

type Profile = {
  id: string
  full_name: string
  role: string
  is_active: boolean
  is_locked: boolean
  failed_attempts: number
  last_login_at: string | null
}

export default function UserManagementClient({ profiles }: { profiles: Profile[] }) {
  const [createState, createAction, createPending] = useActionState(
    async (_prev: any, formData: FormData) => {
      try {
        await createStaffUser(formData)
        return { success: true, error: null }
      } catch (e: any) {
        return { success: false, error: e.message }
      }
    },
    null
  )

  const [, startTransition] = useTransition()

  const handleDeactivate = (userId: string) => {
    startTransition(async () => { await deactivateUser(userId) })
  }

  const handleRoleChange = (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'cashier' : 'admin'
    startTransition(async () => { await changeUserRole(userId, newRole) })
  }

  return (
    <div className="card">
      <h1 className="page-title">User Management</h1>

      <div className="card-content" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Add New Staff</h2>

        {createState?.error && (
          <div style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 14px', borderRadius: '6px', marginBottom: '12px', fontSize: '13px' }}>
            {createState.error}
          </div>
        )}
        {createState?.success && (
          <div style={{ background: '#f0fdf4', color: '#166534', padding: '10px 14px', borderRadius: '6px', marginBottom: '12px', fontSize: '13px' }}>
            Staff user created successfully.
          </div>
        )}

        <form action={createAction} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input name="full_name" required className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input name="email" type="email" required className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select name="role" required className="form-input">
              <option value="cashier">Cashier</option>
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Temporary Password</label>
            <input name="temp_password" required className="form-input" />
          </div>
          <button
            type="submit"
            disabled={createPending}
            className="btn btn-primary"
            style={{ gridColumn: 'span 2' }}
          >
            {createPending ? 'Creating...' : 'Create Staff User'}
          </button>
        </form>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Failed Attempts</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => (
              <tr key={p.id}>
                <td>{p.full_name}</td>
                <td><span className="badge">{p.role}</span></td>
                <td>
                  <span className={`badge ${p.is_active ? 'badge-active' : 'badge-inactive'}`}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {p.is_locked && <span className="badge badge-inactive" style={{ marginLeft: '8px' }}>Locked</span>}
                </td>
                <td>{p.failed_attempts}</td>
                <td>{p.last_login_at ? new Date(p.last_login_at).toLocaleString() : 'Never'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleRoleChange(p.id, p.role)} className="btn btn-secondary btn-sm">
                      Toggle Admin
                    </button>
                    {p.is_active && (
                      <button onClick={() => handleDeactivate(p.id)} className="btn btn-danger btn-sm">
                        Deactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
