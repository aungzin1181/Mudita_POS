'use client'

import { useState } from 'react'
import { Transaction } from '@/types/pos'
import { markAsPaid, voidTransaction, applyDiscount } from '@/app/actions/transaction'
import { CheckCircle, XCircle, Tag, Banknote, Smartphone, Loader2, Printer } from 'lucide-react'

export default function PaymentPanel({ transaction }: { transaction: Transaction }) {
  const [loading, setLoading] = useState(false)
  const [showDiscount, setShowDiscount] = useState(false)
  const [discountAmount, setDiscountAmount] = useState('')
  const [discountReason, setDiscountReason] = useState('')

  const handlePay = async (method: 'cash' | 'kpay') => {
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
    <div className="flex flex-col gap-4">
      {/* SUMMARY CARD */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-mono" style={{ fontSize: '14px' }}>Bill Summary</h3>
          {transaction.status === 'paid' && (
            <button 
              className="btn btn-sm" 
              onClick={() => window.open(`/pos/transaction/${transaction.id}/print`, '_blank')}
            >
              <Printer size={14} /> Print
            </button>
          )}
        </div>
        <div className="card-body">
          <div className="flex justify-between mb-2">
            <span className="text-muted">Subtotal</span>
            <span className="text-mono">{Number(transaction.subtotal).toLocaleString()} MMK</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-muted">Discount</span>
            <span className="text-mono" style={{ color: 'var(--red)' }}>-{Number(transaction.discount_amount).toLocaleString()} MMK</span>
          </div>
          {transaction.discount_reason && (
            <div className="text-mono text-muted mb-4" style={{ fontSize: '11px', fontStyle: 'italic' }}>
              Reason: {transaction.discount_reason}
            </div>
          )}
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
          <div className="flex justify-between items-center">
            <span style={{ fontWeight: 600 }}>Total Amount</span>
            <span className="text-serif" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)' }}>
              {Number(transaction.total_amount).toLocaleString()} MMK
            </span>
          </div>

          {transaction.status === 'paid' && (
            <div className="mt-4 p-3" style={{ background: 'var(--green-soft)', borderRadius: '8px', border: '1px solid var(--green)' }}>
              <div className="flex items-center gap-2 text-green" style={{ fontWeight: 600, color: 'var(--green)' }}>
                <CheckCircle size={16} /> Paid in Full
              </div>
              <div className="text-mono text-muted mt-1" style={{ fontSize: '11px' }}>
                via {transaction.payment_method?.toUpperCase()} · Change: {Number(transaction.change_amount ?? 0).toLocaleString()} MMK
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ACTIONS PANEL */}
      {isEditable && (
        <div className="card">
          <div className="card-body flex flex-col gap-3">
            <button className="btn w-full" style={{ justifyContent: 'center' }} onClick={() => setShowDiscount(!showDiscount)}>
              <Tag size={18} />
              {showDiscount ? 'Cancel Discount' : 'Apply Discount'}
            </button>

            {showDiscount && (
              <form onSubmit={handleApplyDiscount} className="p-3 mb-2" style={{ background: 'var(--bg)', borderRadius: '8px' }}>
                <input 
                  type="number" 
                  placeholder="Amount" 
                  className="form-input mb-2" 
                  value={discountAmount}
                  onChange={e => setDiscountAmount(e.target.value)}
                  required
                />
                <input 
                  type="text" 
                  placeholder="Reason" 
                  className="form-input mb-2" 
                  value={discountReason}
                  onChange={e => setDiscountReason(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
                  Submit Discount
                </button>
              </form>
            )}

            <div className="grid gap-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button className="btn btn-primary justify-center" onClick={() => handlePay('cash')} disabled={loading || transaction.total_amount <= 0}>
                <Banknote size={18} /> Cash
              </button>
              <button className="btn btn-primary justify-center" onClick={() => handlePay('kpay')} disabled={loading || transaction.total_amount <= 0}>
                <Smartphone size={18} /> KPay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN PANEL */}
      {(isEditable || transaction.status === 'paid') && (
        <div className="card" style={{ background: 'var(--surface-alt)' }}>
          <div className="card-body">
            <button className="btn btn-danger w-full justify-center" onClick={handleVoid} disabled={loading}>
              <XCircle size={18} /> Void Transaction
            </button>
            <div className="text-mono text-muted mt-2" style={{ fontSize: '9px', textAlign: 'center', textTransform: 'uppercase' }}>
              Requires Admin Privileges
            </div>
          </div>
        </div>
      )}

      {transaction.status === 'voided' && (
        <div className="card" style={{ background: 'var(--red-soft)', borderColor: 'var(--red)' }}>
          <div className="card-body">
            <div className="flex items-center gap-2 text-red" style={{ fontWeight: 600, color: 'var(--red)' }}>
              <XCircle size={16} /> VOIDED
            </div>
            <div className="text-mono text-muted mt-1" style={{ fontSize: '11px' }}>
              Reason: {transaction.void_reason}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
