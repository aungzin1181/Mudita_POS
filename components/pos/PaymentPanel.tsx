'use client'

import { useState } from 'react'
import { Transaction, TransactionItem } from '@/types/pos'
import { markAsPaid, voidTransaction, applyDiscount } from '@/app/actions/transaction'
import { CheckCircle, XCircle, Tag, Banknote, Smartphone, Printer } from 'lucide-react'

export default function PaymentPanel({ transaction, items = [] }: { transaction: Transaction; items?: TransactionItem[] }) {
  const [loading, setLoading] = useState(false)
  const [showDiscount, setShowDiscount] = useState(false)
  const [discountAmount, setDiscountAmount] = useState('')
  const [discountReason, setDiscountReason] = useState('')

  const handlePay = async (method: 'cash' | 'kpay') => {
    // Client-side validation: if a doctor is assigned, check if consultation item has been priced
    if (transaction.doctor_id) {
      const consultationItem = items.find(i => i.item_type === 'consultation')
      if (!consultationItem || Number(consultationItem.unit_price) <= 0) {
        alert('Please set the Consultation Fee (must be greater than 0) before finalizing payment.')
        return
      }
    }

    const amount = prompt(`Enter amount paid (${method.toUpperCase()}) in MMK:`, transaction.total_amount.toString())
    if (!amount) return

    let refNo = undefined
    if (method === 'kpay') {
      refNo = prompt('Enter KPay Transaction Reference / Auth Code:') || undefined
    }

    setLoading(true)
    try {
      const res = await markAsPaid(transaction.id, parseFloat(amount), method, refNo)
      if (res.success) {
        alert(`Payment successful! Change: ${res.change.toLocaleString()} MMK`)
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVoid = async () => {
    const reason = prompt('Reason for voiding:')
    if (!reason) return

    setLoading(true)
    try {
      await voidTransaction(transaction.id, reason)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await applyDiscount(transaction.id, parseFloat(discountAmount), discountReason)
      if (res.status === 'pending_approval') {
        alert('Discount request submitted for approval.')
      }
      setShowDiscount(false)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isEditable = ['draft', 'open'].includes(transaction.status)

  return (
    <div className="flex flex-col gap-3">
      {/* SUMMARY CARD */}
      <div className="card">
        <div className="card-header" style={{ padding: '8px 12px' }}>
          <h3 className="text-mono" style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)' }}>Bill Summary</h3>
          {transaction.status === 'paid' && (
            <button 
              className="btn btn-sm btn-accent" 
              onClick={() => window.open(`/pos/transaction/${transaction.id}/print`, '_blank')}
              style={{ 
                padding: '4px 10px', 
                fontSize: '11px', 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                boxShadow: '0 2px 4px rgba(29, 78, 216, 0.25)'
              }}
            >
              <Printer size={12} /> Print Receipt
            </button>
          )}
        </div>
        <div className="card-body" style={{ padding: '12px' }}>
          <div className="flex justify-between mb-1" style={{ fontSize: '11px' }}>
            <span className="text-muted">Subtotal</span>
            <span className="text-mono">{Number(transaction.subtotal).toLocaleString()} MMK</span>
          </div>
          <div className="flex justify-between mb-1" style={{ fontSize: '11px' }}>
            <span className="text-muted">Discount</span>
            <span className="text-mono" style={{ color: 'var(--red)' }}>-{Number(transaction.discount_amount).toLocaleString()} MMK</span>
          </div>
          {transaction.discount_reason && (
            <div className="text-mono text-muted mb-2" style={{ fontSize: '10px', fontStyle: 'italic' }}>
              Reason: {transaction.discount_reason}
            </div>
          )}
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />
          <div className="flex justify-between items-center mb-3">
            <span style={{ fontWeight: 600, fontSize: '12px' }}>Total Amount</span>
            <span className="text-serif" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent)' }}>
              {Number(transaction.total_amount).toLocaleString()} MMK
            </span>
          </div>

          {transaction.status === 'paid' && (
            <div className="p-2" style={{ background: 'var(--green-soft)', borderRadius: '6px', border: '1px solid var(--green)' }}>
              <div className="flex items-center gap-1.5 text-green" style={{ fontWeight: 600, color: 'var(--green)', fontSize: '11px' }}>
                <CheckCircle size={14} /> Paid in Full
              </div>
              <div className="text-mono text-muted mt-0.5" style={{ fontSize: '10px' }}>
                via {transaction.payment_method?.toUpperCase()} · Change: {Number(transaction.change_amount ?? 0).toLocaleString()} MMK
              </div>
            </div>
          )}

          {/* ACTIONS (DISCOUNT, CASH, KPAY) PANEL */}
          {isEditable && (
            <div className="flex flex-col gap-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <button 
                  className="btn btn-primary justify-center btn-sm" 
                  style={{ padding: '6px 12px', fontSize: '12px', height: '32px' }}
                  onClick={() => handlePay('cash')} 
                  disabled={loading || transaction.total_amount <= 0}
                >
                  <Banknote size={14} /> Cash
                </button>
                <button 
                  className="btn btn-primary justify-center btn-sm" 
                  style={{ padding: '6px 12px', fontSize: '12px', height: '32px' }}
                  onClick={() => handlePay('kpay')} 
                  disabled={loading || transaction.total_amount <= 0}
                >
                  <Smartphone size={14} /> KPay
                </button>
              </div>

              <button 
                className="btn btn-sm w-full justify-center" 
                style={{ padding: '4px 8px', fontSize: '11px', height: '26px', border: '1px solid var(--border)' }} 
                onClick={() => setShowDiscount(!showDiscount)}
              >
                <Tag size={12} />
                {showDiscount ? 'Cancel Discount' : 'Apply Discount'}
              </button>

              {showDiscount && (
                <form onSubmit={handleApplyDiscount} className="p-2 flex flex-col gap-2 mt-1" style={{ background: 'var(--surface-alt)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Amount" 
                      className="form-input" 
                      style={{ flex: 1, padding: '4px 8px', fontSize: '12px', height: '28px' }}
                      value={discountAmount}
                      onChange={e => setDiscountAmount(e.target.value)}
                      required
                    />
                    <input 
                      type="text" 
                      placeholder="Reason" 
                      className="form-input" 
                      style={{ flex: 1, padding: '4px 8px', fontSize: '12px', height: '28px' }}
                      value={discountReason}
                      onChange={e => setDiscountReason(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm w-full justify-center" style={{ padding: '4px', fontSize: '11px', height: '26px' }} disabled={loading}>
                    Confirm Discount
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ADMIN VOID ACTION LINK */}
          {(isEditable || transaction.status === 'paid') && (
            <div style={{ marginTop: '10px', borderTop: '1px dashed var(--border)', paddingTop: '8px', textAlign: 'center' }}>
              <button 
                className="btn btn-danger btn-sm" 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--red)', 
                  fontSize: '10px', 
                  padding: '2px 8px',
                  opacity: 0.7,
                  margin: '0 auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }} 
                onClick={handleVoid} 
                disabled={loading}
              >
                <XCircle size={10} /> Void Transaction
              </button>
            </div>
          )}
        </div>
      </div>

      {transaction.status === 'voided' && (
        <div className="card" style={{ background: 'var(--red-soft)', borderColor: 'var(--red)', padding: '8px 12px' }}>
          <div className="flex items-center gap-1.5 text-red" style={{ fontWeight: 600, color: 'var(--red)', fontSize: '11px' }}>
            <XCircle size={14} /> VOIDED
          </div>
          <div className="text-mono text-muted mt-0.5" style={{ fontSize: '10px' }}>
            Reason: {transaction.void_reason}
          </div>
        </div>
      )}
    </div>
  )
}
