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
      <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
        <div className="flex justify-between w-full">
          <h3 className="text-mono" style={{ fontSize: '14px' }}>Catalog Selection</h3>
          <div className="flex gap-2">
            <button className={`btn btn-sm ${category === 'all' ? 'btn-primary' : ''}`} onClick={() => setCategory('all')}>All</button>
            <button className={`btn btn-sm ${category === 'medication' ? 'btn-primary' : ''}`} onClick={() => setCategory('medication')}>Meds</button>
          </div>
        </div>
        <div className="search-box w-full">
          <span className="search-box-icon"><Search size={16} /></span>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px' }}
            placeholder="Search products..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>
      <div className="card-body" style={{ maxHeight: '420px', overflowY: 'auto', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
          {(category === 'all' || category === 'medication') && filteredProducts.map(p => (
            <button
              key={p.id}
              className="product-tile"
              onClick={() => handleAddItem('product', p.id)}
              disabled={!!loading || p.stock_qty <= 0}
            >
              <div className="tile-icon product"><Package size={20} /></div>
              <div className="tile-name">{p.name}</div>
              <div className="tile-stock">Stock: {p.stock_qty}</div>
              <div className="tile-price">{p.unit_price.toLocaleString()} MMK</div>
              {loading === p.id && <div className="tile-loader"><Loader2 size={16} className="animate-spin" /></div>}
              {p.stock_qty <= 0 && <div className="tile-badge-out">Out of Stock</div>}
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '32px', color: 'var(--ink-muted)', fontSize: '13px' }}>
              No products found.
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .product-tile {
          display: flex; flex-direction: column; align-items: center;
          padding: 16px; background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; cursor: pointer; transition: all 0.2s;
          position: relative; text-align: center; gap: 8px;
        }
        .product-tile:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .product-tile:disabled { opacity: 0.6; cursor: not-allowed; }
        .tile-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
        .tile-icon.service { background: var(--accent-soft); color: var(--accent); }
        .tile-icon.product { background: var(--purple-soft); color: var(--purple); }
        .tile-name { font-weight: 600; font-size: 13px; color: var(--ink); height: 32px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .tile-price { font-family: var(--mono); font-weight: 700; color: var(--accent); font-size: 14px; }
        .tile-stock { font-size: 10px; color: var(--muted); }
        .tile-loader { position: absolute; inset: 0; background: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; border-radius: 12px; }
        .tile-badge-out { position: absolute; top: 8px; right: 8px; background: var(--red); color: white; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 700; }
      `}} />
    </div>
  )
}
