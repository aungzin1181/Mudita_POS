'use client'

import { useEffect, useState } from 'react'

export function IdleWarningToast() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = () => setShow(true)
    window.addEventListener('idle-warning', handler)
    return () => window.removeEventListener('idle-warning', handler)
  }, [])

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: '#92400e', color: 'white', padding: '14px 20px',
      borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,.3)'
    }}>
      ⏱ "2 မိနစ်အတွင်း auto logout ဖြစ်မည်။ ဆက်လုပ်ရန် နှိပ်ပါ"
      <button 
        onClick={() => setShow(false)}
        style={{ marginLeft: '12px', background: 'white', color: '#92400e', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        Stay Logged In
      </button>
    </div>
  )
}
