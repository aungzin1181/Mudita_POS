'use client'

import { loginWithPassword } from '@/app/actions/auth'
import { useActionState } from 'react'

export default function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: any, formData: FormData) => {
      return await loginWithPassword(formData)
    },
    null
  )

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f4f8' }}>
      <div style={{ background: '#1e293b', borderRadius: '12px', padding: '32px', maxWidth: '380px', width: '100%', color: 'white' }}>
        <div style={{ textAlign: 'center', fontSize: '28px', marginBottom: '12px' }}>🏥</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center', marginBottom: '4px' }}>မုဒိတာဆေးခန်း</div>
        <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', marginBottom: '24px' }}>
          Enter your credentials to continue
        </div>

        {state?.error && (
          <div style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
            {state.error}
          </div>
        )}

        <form action={formAction}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px', display: 'block' }}>
              Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '9px 12px', color: '#e2e8f0', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px', display: 'block' }}>
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '9px 12px', color: '#e2e8f0', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            style={{ width: '100%', background: pending ? '#5b21b6' : '#7c3aed', color: 'white', border: 'none', borderRadius: '7px', padding: '11px', fontSize: '14px', fontWeight: 'bold', cursor: pending ? 'not-allowed' : 'pointer', marginTop: '6px', transition: 'background 0.2s' }}
          >
            {pending ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#475569', marginTop: '14px' }}>
          No self-registration. Contact admin for access.
        </p>
      </div>
    </div>
  )
}
