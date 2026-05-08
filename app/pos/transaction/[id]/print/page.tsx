import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Transaction, TransactionItem, Patient, Doctor } from '@/types/pos'

export default async function PrintTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  // Fetch transaction details
  const { data: tx } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single()

  if (!tx) notFound()

  // Fetch items
  const { data: items } = await supabase
    .from('transaction_items')
    .select('*')
    .eq('transaction_id', id)
    .eq('is_removed', false)

  // Fetch patient
  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', tx.patient_id)
    .single()

  return (
    <div className="print-container">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white; color: black; }
          .sidebar, .btn, header { display: none !important; }
          .app-layout { display: block; }
          .main-content { margin-left: 0; }
          .container { padding: 0; max-width: 100%; }
        }
        .print-receipt {
          max-width: 320px;
          margin: 0 auto;
          background: white;
          color: black;
          padding: 20px;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          line-height: 1.4;
          border: 1px solid #eee;
        }
        .receipt-header { text-align: center; margin-bottom: 20px; }
        .receipt-header h2 { margin: 0; font-size: 16px; font-weight: 800; }
        .receipt-header p { margin: 2px 0; color: #666; font-size: 10px; }
        .receipt-divider { border-top: 1px dashed #ccc; margin: 10px 0; }
        .receipt-row { display: flex; justify-content: space-between; margin: 4px 0; }
        .receipt-item-row { margin: 8px 0; }
        .receipt-item-desc { font-weight: 600; }
        .receipt-item-details { display: flex; justify-content: space-between; font-size: 10px; color: #666; }
        .receipt-total-row { display: flex; justify-content: space-between; font-weight: 800; font-size: 14px; margin-top: 10px; }
        .receipt-footer { text-align: center; margin-top: 30px; font-size: 10px; color: #999; }
      `}} />

      <div className="print-receipt">
        <div className="receipt-header">
          <h2>MUDITA CLINIC</h2>
          <p>Medical & Surgical Center</p>
          <p>Tel: +95 9 123 456 789</p>
          <p>Yangon, Myanmar</p>
        </div>

        <div className="receipt-divider" />

        <div className="receipt-row">
          <span>Date:</span>
          <span>{new Date(tx.created_at).toLocaleString()}</span>
        </div>
        <div className="receipt-row">
          <span>Invoice:</span>
          <span>{tx.invoice_no}</span>
        </div>
        <div className="receipt-row">
          <span>Patient:</span>
          <span>{patient?.full_name || 'N/A'}</span>
        </div>
        {tx.payment_method && (
          <div className="receipt-row">
            <span>Payment:</span>
            <span style={{ textTransform: 'uppercase' }}>{tx.payment_method}</span>
          </div>
        )}

        <div className="receipt-divider" />

        <div className="receipt-items">
          {items?.map((item: TransactionItem) => (
            <div key={item.id} className="receipt-item-row">
              <div className="receipt-item-desc">{item.description}</div>
              <div className="receipt-item-details">
                <span>{item.quantity} x ${Number(item.unit_price).toFixed(2)}</span>
                <span>${Number(item.line_total).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="receipt-divider" />

        <div className="receipt-row">
          <span>Subtotal:</span>
          <span>${Number(tx.subtotal).toFixed(2)}</span>
        </div>
        <div className="receipt-row">
          <span>Discount:</span>
          <span>-${Number(tx.discount_amount).toFixed(2)}</span>
        </div>

        <div className="receipt-total-row">
          <span>TOTAL:</span>
          <span>${Number(tx.total_amount).toFixed(2)}</span>
        </div>

        {tx.amount_paid && (
          <div className="receipt-row">
            <span>Received:</span>
            <span>${Number(tx.amount_paid).toFixed(2)}</span>
          </div>
        )}
        {tx.change_amount !== null && (
          <div className="receipt-row">
            <span>Change:</span>
            <span>${Number(tx.change_amount).toFixed(2)}</span>
          </div>
        )}

        <div className="receipt-divider" />

        <div className="receipt-footer">
          <p>Thank you for choosing Mudita Clinic.</p>
          <p>Health is Wealth.</p>
          <p style={{ marginTop: '10px', fontSize: '8px' }}>Ref: {tx.id}</p>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        window.onload = () => {
          setTimeout(() => {
            window.print();
          }, 500);
        };
      `}} />
    </div>
  )
}
