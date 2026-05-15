'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { discardEmptyDraft } from '@/app/actions/transaction'

export default function TransactionBackButton({ transactionId, status }: { transactionId: string, status: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleBack = async () => {
    if (status === 'draft') {
      setLoading(true)
      try {
        await discardEmptyDraft(transactionId)
      } catch (e) {
        console.error(e)
      }
    }
    router.push('/pos')
  }

  return (
    <button 
      onClick={handleBack} 
      className="btn" 
      style={{ border: 'none', background: 'none', paddingLeft: 0, cursor: 'pointer' }}
      disabled={loading}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowLeft size={16} />}
      Back to Overview
    </button>
  )
}
