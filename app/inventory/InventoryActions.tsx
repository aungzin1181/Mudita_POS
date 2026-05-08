'use client'

import { useState } from 'react'
import { Product } from '@/types/pos'
import Link from 'next/link'
import { Edit3, Package, Loader2 } from 'lucide-react'
import { adjustStock } from '@/app/actions/inventory'

export default function InventoryActions({ product }: { product: Product }) {
  const [showAdj, setShowAdj] = useState(false)
  const [adjQty, setAdjQty] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await adjustStock(product.id, parseInt(adjQty, 10))
      setShowAdj(false)
      setAdjQty('')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to adjust stock')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', minWidth: '150px' }}>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button className="btn btn-sm" onClick={() => setShowAdj(!showAdj)}>
          <Package size={13} /> Adjust
        </button>
        <Link href={`/inventory/${product.id}/edit`} className="btn btn-sm">
          <Edit3 size={13} /> Edit
        </Link>
      </div>
      {showAdj && (
        <form onSubmit={handleAdjust} style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
          <input
            type="number"
            value={adjQty}
            onChange={(e) => setAdjQty(e.target.value)}
            placeholder="±qty"
            className="form-input"
            style={{ width: '70px', padding: '4px 8px', fontSize: '13px' }}
            required
          />
          <button type="submit" className="btn btn-sm btn-primary" disabled={loading}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : 'OK'}
          </button>
        </form>
      )}
    </div>
  )
}
