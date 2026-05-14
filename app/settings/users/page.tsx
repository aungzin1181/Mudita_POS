import { createClient } from '@/lib/supabase/server'
import { createStaffUser, deactivateUser, changeUserRole } from '@/app/actions/user'
import { redirect } from 'next/navigation'

export default async function UsersSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.app_metadata?.user_role !== 'admin') {
    redirect('/403')
  }

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="card">
      <h1 className="page-title">User Management</h1>
      
      <div className="card-content" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Add New Staff</h2>
        <form action={createStaffUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
          <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2' }}>Create Staff User</button>
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
            {profiles?.map(p => (
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
                    <form action={changeUserRole.bind(null, p.id, p.role === 'admin' ? 'cashier' : 'admin')}>
                      <button type="submit" className="btn btn-secondary btn-sm">Toggle Admin</button>
                    </form>
                    {p.is_active && (
                      <form action={deactivateUser.bind(null, p.id)}>
                        <button type="submit" className="btn btn-danger btn-sm">Deactivate</button>
                      </form>
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
