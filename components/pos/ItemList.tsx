'use client'

import { useState } from 'react'
import { TransactionItem, Service, Product } from '@/types/pos'
import { updateTransactionItem, addTransactionItem } from '@/app/actions/transaction'
import { Trash2, Plus, Package, Stethoscope, Search, Loader2, Minus, ShoppingCart } from 'lucide-react'

interface ItemListProps {
  transactionId: string
  items: TransactionItem[]
  isEditable: boolean
  services: Service[]
  products: Product[]
}

export default function ItemList({ transactionId, items, isEditable, services, products }: ItemListProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [category, setCategory] = useState<'all' | 'medication' | 'service'>('all')

  const handleQtyChange = async (itemId: string, newQty: number) => {
    if (newQty < 1) return
    setLoading(itemId)
    try {
      await updateTransactionItem(transactionId, itemId, { quantity: newQty })
    } finally {
      setLoading(null)
    }
  }

  const handleRemove = async (itemId: string) => {
    setLoading(itemId)
    try {
      await updateTransactionItem(transactionId, itemId, { is_removed: true })
    } finally {
      setLoading(null)
    }
  }

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

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
      
      {/* PRODUCT SELECTOR GRID */}
      {isEditable && (
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
          <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto', padding: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              


              {/* Products */}
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
            </div>
          </div>
        </div>
      )}

      {/* SHOPPING CART / LINE ITEMS */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-mono" style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={16} /> Shopping Cart
          </h3>
          <span className="badge badge-open">{items.length} items</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="pos-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style={{ width: '140px', textAlign: 'center' }}>Quantity</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Price</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Total</th>
                {isEditable && <th style={{ width: '50px' }}></th>}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.description}</div>
                    <div className="text-mono text-muted" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                      {item.item_type}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-3">
                      {isEditable && item.item_type !== 'consultation' ? (
                        <>
                          <button className="btn-circle" onClick={() => handleQtyChange(item.id, item.quantity - 1)} disabled={!!loading}>
                            <Minus size={12} />
                          </button>
                          <span className="text-mono" style={{ fontSize: '14px', fontWeight: 700, width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                          <button className="btn-circle" onClick={() => handleQtyChange(item.id, item.quantity + 1)} disabled={!!loading}>
                            <Plus size={12} />
                          </button>
                        </>
                      ) : (
                        <span className="text-mono" style={{ fontWeight: 700 }}>{item.quantity}</span>
                      )}
                    </div>
                  </td>
                  <td className="text-mono" style={{ textAlign: 'right' }}>{Number(item.unit_price).toLocaleString()} MMK</td>
                  <td className="text-mono" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}>
                    {Number(item.line_total).toLocaleString()} MMK
                  </td>
                  {isEditable && (
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn-icon-danger" 
                        onClick={() => handleRemove(item.id)}
                        disabled={!!loading}
                      >
                        {loading === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '60px', color: 'var(--ink-muted)' }}>
                    Your cart is empty. Select products from the catalog above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .product-tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          text-align: center;
          gap: 8px;
        }
        .product-tile:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .product-tile:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .tile-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }
        .tile-icon.service { background: var(--accent-soft); color: var(--accent); }
        .tile-icon.product { background: var(--purple-soft); color: var(--purple); }
        .tile-name { font-weight: 600; font-size: 13px; color: var(--ink); height: 32px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .tile-price { font-family: var(--mono); font-weight: 700; color: var(--accent); font-size: 14px; }
        .tile-stock { font-size: 10px; color: var(--muted); }
        .tile-loader { position: absolute; inset: 0; background: rgba(255,255,255,0.7); display: flex; alignItems: center; justify-content: center; border-radius: 12px; }
        .tile-badge-out { position: absolute; top: 8px; right: 8px; background: var(--red); color: white; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 700; }
        
        .pos-table th { background: var(--surface-alt); padding: 12px 16px; font-size: 11px; text-transform: uppercase; color: var(--muted); }
        .pos-table td { padding: 14px 16px; border-bottom: 1px solid var(--border); }
        
        .btn-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1px solid var(--border);
          background: var(--surface);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.1s;
        }
        .btn-circle:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
        
        .btn-icon-danger {
          background: none;
          border: none;
          color: var(--red);
          opacity: 0.5;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-icon-danger:hover { opacity: 1; }
      `}} />
    </div>
  )
}
