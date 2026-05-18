'use client'

import { useState } from 'react'
import { Service, Product } from '@/types/pos'
import { addTransactionItem } from '@/app/actions/transaction'
import { Package, Search, Loader2 } from 'lucide-react'

interface ItemListProps {
  transactionId: string
  isEditable: boolean
  services: Service[]
  products: Product[]
}

export default function ItemList({ transactionId, isEditable, services, products }: ItemListProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [category, setCategory] = useState<'all' | 'medication' | 'service'>('all')

  const handleAddItem = async (type: 'service' | 'product', id: string) => {
    setLoading(id)
    try {
      if (type === 'service') {
        const service = services.find(s => s.id === id)
        if (!service) return
        await addTransactionItem(transactionId, {
          item_type: service.type,
          service_id: service.id,
          description: service.name,
          quantity: 1,
          unit_price: service.default_price
        })
      } else {
        const product = products.find(p => p.id === id)
        if (!product) return
        await addTransactionItem(transactionId, {
          item_type: 'medication',
          product_id: product.id,
          description: product.name,
          quantity: 1,
          unit_price: product.unit_price
        })
      }
    } finally {
      setLoading(null)
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase()) ||
    p.sku.toLowerCase().includes(filter.toLowerCase())
  )

  if (!isEditable) return null

  return (
    <div className="card">
      <div className="card-header" style={{ padding: '8px 12px', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
        <div className="flex justify-between w-full items-center">
          <h3 className="text-mono" style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)' }}>Catalog Selection</h3>
          <div className="flex gap-1">
            <button className={`btn btn-sm ${category === 'all' ? 'btn-primary' : ''}`} style={{ padding: '2px 8px', fontSize: '10px' }} onClick={() => setCategory('all')}>All</button>
            <button className={`btn btn-sm ${category === 'medication' ? 'btn-primary' : ''}`} style={{ padding: '2px 8px', fontSize: '10px' }} onClick={() => setCategory('medication')}>Meds</button>
          </div>
        </div>
        <div className="search-box w-full">
          <span className="search-box-icon" style={{ left: '10px' }}><Search size={14} /></span>
          <input
            type="text"
            className="form-input"
            style={{ padding: '4px 8px 4px 32px', fontSize: '12px' }}
            placeholder="Search products..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>
      <div className="card-body" style={{ maxHeight: '420px', overflowY: 'auto', padding: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
          {(category === 'all' || category === 'medication') && filteredProducts.map(p => (
            <button
              key={p.id}
              className="product-tile"
              onClick={() => handleAddItem('product', p.id)}
              disabled={!!loading || p.stock_qty <= 0}
            >
              <div className="tile-icon product"><Package size={14} /></div>
              <div className="tile-name">{p.name}</div>
              <div className="tile-stock">Stock: {p.stock_qty}</div>
              <div className="tile-price">{p.unit_price.toLocaleString()} MMK</div>
              {loading === p.id && <div className="tile-loader"><Loader2 size={12} className="animate-spin" /></div>}
              {p.stock_qty <= 0 && <div className="tile-badge-out">Out of Stock</div>}
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '24px', color: 'var(--ink-muted)', fontSize: '12px' }}>
              No products found.
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .product-tile {
          display: flex; flex-direction: column; align-items: center;
          padding: 8px; background: var(--surface); border: 1px solid var(--border);
          border-radius: 8px; cursor: pointer; transition: all 0.2s;
          position: relative; text-align: center; gap: 4px;
        }
        .product-tile:hover { border-color: var(--accent); transform: translateY(-1px); box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
        .product-tile:disabled { opacity: 0.6; cursor: not-allowed; }
        .tile-icon { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 2px; }
        .tile-icon.service { background: var(--accent-soft); color: var(--accent); }
        .tile-icon.product { background: var(--purple-soft); color: var(--purple); }
        .tile-name { font-weight: 600; font-size: 11px; color: var(--ink); line-height: 1.2; height: 14px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; width: 100%; }
        .tile-price { font-family: var(--mono); font-weight: 700; color: var(--accent); font-size: 11px; }
        .tile-stock { font-size: 9px; color: var(--ink-muted); }
        .tile-loader { position: absolute; inset: 0; background: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; border-radius: 8px; }
        .tile-badge-out { position: absolute; top: 4px; right: 4px; background: var(--red); color: white; font-size: 8px; padding: 1px 4px; border-radius: 2px; font-weight: 700; }
      `}} />
    </div>
  )
}
