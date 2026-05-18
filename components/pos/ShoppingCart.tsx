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
  const [addingFee, setAddingFee] = useState(false)

  const handleAddManualConsultation = async () => {
    if (!transaction) return
    setAddingFee(true)
    try {
      const doctor = doctors.find(d => d.id === transaction.doctor_id)
      const desc = doctor ? `Consultation - ${doctor.full_name}` : 'Consultation Fee'
      const price = doctor ? Number(doctor.consultation_fee) : 0

      await addTransactionItem(transactionId, {
        item_type: 'consultation',
        description: desc,
        quantity: 1,
        unit_price: price
      })
    } catch (err: any) {
      alert(err.message || 'Failed to add consultation fee')
    } finally {
      setAddingFee(false)
    }
  }

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
      <div className="card-header">
        <h3 className="text-mono" style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CartIcon size={16} /> Shopping Cart
        </h3>
        <span className="badge badge-open">{items.length} items</span>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        <table className="pos-table">
          <thead>
            <tr>
              <th>Item</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Qty</th>
              <th style={{ width: '110px', textAlign: 'right' }}>Price</th>
              <th style={{ width: '110px', textAlign: 'right' }}>Total</th>
              {isEditable && <th style={{ width: '44px' }}></th>}
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
                  <div className="flex items-center justify-center gap-2">
                    {isEditable && (item.item_type !== 'consultation' || !autoConsultationFee) ? (
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
                <td className="text-mono" style={{ textAlign: 'right' }}>
                  {isEditable && item.item_type === 'consultation' && !autoConsultationFee ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        className="form-input text-mono"
                        style={{
                          width: '80px',
                          padding: '3px 6px',
                          fontSize: '13px',
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
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-muted)' }}>
                  Cart is empty. Select products from the catalog.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {isEditable && !autoConsultationFee && !items.some(item => item.item_type === 'consultation') && (
          <div style={{
            padding: '16px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'center',
            background: 'var(--surface-alt)'
          }}>
            <button
              type="button"
              className="btn btn-sm btn-accent"
              onClick={handleAddManualConsultation}
              disabled={addingFee}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
            >
              {addingFee ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Add Consultation Fee
            </button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .pos-table th { background: var(--surface-alt); padding: 10px 14px; font-size: 11px; text-transform: uppercase; color: var(--muted); }
        .pos-table td { padding: 12px 14px; border-bottom: 1px solid var(--border); }
        .btn-circle {
          width: 26px; height: 26px; border-radius: 50%;
          border: 1px solid var(--border); background: var(--surface);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.1s;
        }
        .btn-circle:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
        .btn-icon-danger { background: none; border: none; color: var(--red); opacity: 0.5; cursor: pointer; transition: opacity 0.2s; }
        .btn-icon-danger:hover { opacity: 1; }
      `}} />
    </div>
  )
}
