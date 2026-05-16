'use client'

import Image from 'next/image'
import { loginWithPassword } from '@/app/actions/auth'
import { useActionState } from 'react'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    async (_prev: any, formData: FormData) => {
      return await loginWithPassword(formData)
    },
    null
  )

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex',
      zIndex: 50,
    }}>

      {/* ── LEFT PANEL: Logo / Brand ── */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(145deg, #0f1923 0%, #1a2e4a 60%, #0e3060 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', width: 500, height: 500,
          borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)',
          top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        }} />
        <div style={{
          position: 'absolute', width: 700, height: 700,
          borderRadius: '50%', border: '1px solid rgba(255,255,255,0.03)',
          top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Image
              src="/logo.png"
              alt="မုဒိတာဆေးခန်း Logo"
              width={260}
              height={260}
              style={{ objectFit: 'contain', marginBottom: 28, filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.4))' }}
              priority
            />

          <h1 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 32,
            fontWeight: 800,
            color: '#ffffff',
            margin: '0 0 8px',
            letterSpacing: '-0.02em',
          }}>
            မုဒိတာဆေးခန်း
          </h1>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
            margin: 0,
          }}>
            Medical Clinic · POS System
          </p>

          {/* Divider dots */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 32 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: i === 1 ? 24 : 6, height: 6,
                borderRadius: 3,
                background: i === 1 ? '#1a4f8a' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Login Form ── */}
      <div style={{
        flex: 2,
        background: '#f5f2ec',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 36 }}>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#5a6272',
              marginBottom: 8,
            }}>
              Welcome back
            </p>
            <h2 style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 28,
              fontWeight: 700,
              color: '#0f1923',
              margin: 0,
              lineHeight: 1.2,
            }}>
              Sign in to continue
            </h2>
          </div>

          {state?.error && (
            <div style={{
              background: '#fde8e8',
              border: '1px solid #7b1e1e',
              color: '#7b1e1e',
              padding: '11px 14px',
              borderRadius: 8,
              marginBottom: 20,
              fontSize: 13,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}>
              <span>⚠</span>
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{
                display: 'block',
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#5a6272',
                marginBottom: 6,
              }}>
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@mudita.clinic"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  border: '1px solid #ddd8ce',
                  borderRadius: 8,
                  background: '#ffffff',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  color: '#0f1923',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = '#1a4f8a'}
                onBlur={e => e.target.style.borderColor = '#ddd8ce'}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#5a6272',
                marginBottom: 6,
              }}>
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  border: '1px solid #ddd8ce',
                  borderRadius: 8,
                  background: '#ffffff',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  color: '#0f1923',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = '#1a4f8a'}
                onBlur={e => e.target.style.borderColor = '#ddd8ce'}
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              style={{
                width: '100%',
                padding: '13px',
                background: pending ? '#5a6272' : '#1a4f8a',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                fontWeight: 600,
                cursor: pending ? 'not-allowed' : 'pointer',
                marginTop: 4,
                transition: 'background 0.2s',
                letterSpacing: '0.02em',
              }}
            >
              {pending ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: '#5a6272',
            marginTop: 28,
            lineHeight: 1.6,
          }}>
            No self-registration.
            <br />Contact your admin for access.
          </p>
        </div>
      </div>
    </div>
  )
}
