import Link from 'next/link'

export default function ForbiddenPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f4f8' }}>
      <h1 style={{ fontSize: '48px', margin: '0', color: '#dc2626' }}>403</h1>
      <p style={{ fontSize: '18px', color: '#64748b', marginBottom: '24px' }}>Access Denied: You do not have permission to view this page.</p>
      <Link href="/dashboard" style={{ background: '#2563eb', color: 'white', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none' }}>
        Return to Dashboard
      </Link>
    </div>
  )
}
