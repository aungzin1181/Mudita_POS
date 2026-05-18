'use client'

import { useState } from 'react'
import { TransactionItem, Doctor, Transaction } from '@/types/pos'
import { updateTransactionItem, addTransactionItem } from '@/app/actions/transaction'
import { Trash2, Plus, Minus, ShoppingCart as CartIcon, Loader2 } from 'lucide-react'

interface ShoppingCartProps {
  transactionId: string
  items: TransactionItem[]
  isEditable: boolean
  autoConsultationFee?: boolean
  doctors?: Doctor[]
  transaction?: Transaction
}

export default function ShoppingCart({
  transactionId,
  items,
  isEditable,
  autoConsultationFee = true,
  doctors = [],
  transaction
}: ShoppingCartProps) {
  const [loading, setLoading] = useState<string | null>(null)


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

  return (
    <div className="card">
      <div className="card-header" style={{ padding: '8px 12px' }}>
        <h3 className="text-mono" style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)' }}>
          <CartIcon size={12} /> Shopping Cart
        </h3>
        <span className="badge badge-open" style={{ padding: '2px 6px', fontSize: '9px', fontWeight: 500 }}>{items.length} items</span>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        <table className="pos-table">
          <thead>
            <tr>
              <th>Item</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Qty</th>
              <th style={{ width: '110px', textAlign: 'right' }}>Price</th>
              <th style={{ width: '110px', textAlign: 'right' }}>Total</th>
              {isEditable && <th style={{ width: '44px' }}></th>}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>
                  <div style={{ fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {item.item_type === 'consultation' ? 'Consultation' : item.description}
                  </div>
                  <div className="text-mono text-muted" style={{ fontSize: '9px', textTransform: 'uppercase' }}>
                    {item.item_type}
                  </div>
                </td>
                <td>
                  <div className="flex items-center justify-center">
                    {item.item_type !== 'consultation' ? (
                      isEditable ? (
                        <div 
                          className="flex items-center" 
                          style={{ 
                            border: '1px solid var(--border)', 
                            borderRadius: '6px', 
                            background: 'var(--surface-alt)',
                            height: '26px',
                            overflow: 'hidden'
                          }}
                        >
                          <button
                            type="button"
                            className="btn-qty"
                            disabled={!!loading || item.quantity <= 1}
                            onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                            style={{
                              width: '24px',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'none',
                              border: 'none',
                              color: 'var(--ink-muted)',
                              cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                              padding: 0
                            }}
                          >
                            <Minus size={11} />
                          </button>
                          
                          <input
                            type="number"
                            min="1"
                            step="1"
                            defaultValue={item.quantity}
                            key={`${item.id}-${item.quantity}`}
                            className="text-mono"
                            style={{
                              width: '32px',
                              height: '100%',
                              padding: 0,
                              fontSize: '12px',
                              textAlign: 'center',
                              background: 'none',
                              border: 'none',
                              outline: 'none',
                              fontWeight: 600,
                              color: 'var(--ink)'
                            }}
                            disabled={!!loading}
                            onBlur={async (e) => {
                              const val = parseInt(e.target.value, 10)
                              const cleanQty = Math.max(1, isNaN(val) ? 1 : val)
                              if (cleanQty !== item.quantity) {
                                await handleQtyChange(item.id, cleanQty)
                              } else {
                                e.target.value = String(item.quantity)
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur()
                              }
                            }}
                          />

                          <button
                            type="button"
                            className="btn-qty"
                            disabled={!!loading}
                            onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                            style={{
                              width: '24px',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'none',
                              border: 'none',
                              color: 'var(--ink-muted)',
                              cursor: 'pointer',
                              padding: 0
                            }}
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-mono" style={{ fontWeight: 700, fontSize: '12px' }}>{item.quantity}</span>
                      )
                    ) : (
                      <span className="text-mono text-muted" style={{ fontSize: '12px' }}></span>
                    )}
                  </div>
                </td>
                <td className="text-mono" style={{ textAlign: 'right', fontSize: '12px' }}>
                  {isEditable && item.item_type === 'consultation' ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        className="form-input text-mono"
                        style={{
                          width: '80px',
                          padding: '3px 6px',
                          fontSize: '12px',
                          textAlign: 'right',
                          background: 'var(--surface-alt)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px'
                        }}
                        defaultValue={item.unit_price}
                        onBlur={async (e) => {
                          const val = parseFloat(e.target.value) || 0
                          if (val !== item.unit_price) {
                            setLoading(item.id)
                            try {
                              await updateTransactionItem(transactionId, item.id, { unit_price: val })
                            } catch (err: any) {
                              alert(err.message)
                            } finally {
                              setLoading(null)
                            }
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <span>{Number(item.unit_price).toLocaleString()} MMK</span>
                  )}
                </td>
                <td className="text-mono" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent)', fontSize: '12px' }}>
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
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-muted)' }}>
                  Cart is empty. Select products from the catalog.
                </td>
              </tr>
            )}
          </tbody>
        </table>


      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .pos-table th { background: var(--surface-alt); padding: 8px 12px; font-size: 10px; text-transform: uppercase; color: var(--muted); }
        .pos-table td { padding: 8px 12px; border-bottom: 1px solid var(--border); }
        .pos-table input[type=number]::-webkit-outer-spin-button,
        .pos-table input[type=number]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .pos-table input[type=number] {
          -moz-appearance: textfield;
        }
        .btn-icon-danger { background: none; border: none; color: var(--red); opacity: 0.5; cursor: pointer; transition: opacity 0.2s; }
        .btn-icon-danger:hover { opacity: 1; }
        .btn-qty { transition: all 0.15s ease-in-out; }
        .btn-qty:hover { background: var(--border-soft) !important; color: var(--ink) !important; }
        .btn-qty:active { background: var(--border) !important; }
      `}} />
    </div>
  )
}
