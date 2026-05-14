import { loginWithPassword } from '@/app/actions/auth'

export default function LoginPage({ searchParams }: { searchParams: { reason?: string } }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f4f8' }}>
      <div style={{ background: '#1e293b', borderRadius: '12px', padding: '32px', maxWidth: '380px', width: '100%', color: 'white' }}>
        <div style={{ textAlign: 'center', fontSize: '28px', marginBottom: '12px' }}>🏥</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center', marginBottom: '4px' }}>Clinic POS Login</div>
        <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', marginBottom: '24px' }}>
          {searchParams.reason === 'idle' ? 'You were logged out due to inactivity.' : 'Enter your credentials to continue'}
        </div>
        
        <form action={loginWithPassword}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px', display: 'block' }}>Email Address</label>
            <input name="email" type="email" required style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '9px 12px', color: '#e2e8f0', fontSize: '13px' }} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px', display: 'block' }}>Password</label>
            <input name="password" type="password" required style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '9px 12px', color: '#e2e8f0', fontSize: '13px' }} />
          </div>
          <button type="submit" style={{ width: '100%', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '7px', padding: '11px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}>Continue →</button>
        </form>
        
        <p style={{ textAlign: 'center', fontSize: '11px', color: '#475569', marginTop: '14px' }}>No self-registration. Contact admin for access.</p>
      </div>
    </div>
  )
}
