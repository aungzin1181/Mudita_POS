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

  // Fetch doctor if assigned
  let doctor = null
  if (tx.doctor_id) {
    const { data: doc } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', tx.doctor_id)
      .single()
    doctor = doc
  }

  return (
    <div className="print-container">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white; color: black; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
          font-family: 'DM Mono', system-ui, -apple-system, sans-serif;
          font-size: 12px;
          line-height: 1.5;
          border: 1px solid #eee;
          position: relative;
        }
        .receipt-header { text-align: center; margin-bottom: 20px; }
        .receipt-header h2 { margin: 0; font-size: 16px; font-weight: 800; line-height: 1.5; color: #0f172a; }
        .receipt-header p { margin: 3px 0; color: #334155; font-size: 10px; line-height: 1.4; }
        .receipt-divider { border-top: 1px dashed #cbd5e1; margin: 10px 0; }
        .receipt-row { display: flex; justify-content: space-between; margin: 4px 0; }
        .receipt-item-row { margin: 8px 0; }
        .receipt-item-desc { font-weight: 600; color: #0f172a; }
        .receipt-item-details { display: flex; justify-content: space-between; font-size: 10px; color: #475569; }
        .receipt-total-row {
          display: flex;
          justify-content: space-between;
          font-weight: 800;
          font-size: 14px;
          margin-top: 10px;
          background: #f1f5f9;
          padding: 6px 10px;
          border-radius: 4px;
          border-left: 4px solid #1e293b;
          color: #0f172a;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .receipt-paid-status {
          margin-top: 12px;
          background: #dcfce7;
          border: 1px solid #bbf7d0;
          border-left: 4px solid #16a34a;
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 11px;
          color: #15803d;
          font-weight: 800;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .receipt-footer { text-align: center; margin-top: 30px; font-size: 10px; color: #64748b; }
      `}} />

      <div className="print-receipt">
        {/* Watermark Logo */}
        <div style={{
          position: 'absolute',
          top: '55%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '220px',
          height: '220px',
          backgroundImage: 'url("/logo.png")',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.04,
          zIndex: 0,
          pointerEvents: 'none',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="receipt-header">
            <h2>မုဒိတာ</h2>
            <h2>အထွေထွေရောဂါကုဆေးခန်း</h2>
            <p>Tel: 09-882228790, 09-985839302</p>
            <p style={{ marginTop: '4px', fontSize: '9px' }}>ကျည်တောင်ကန် ပိတောက်လမ်းမကြီး အမှတ်တစ်ရပ်ကွက် ပုပ္ပသီရိနေပြည်တော်</p>
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
          {doctor && (
            <div className="receipt-row">
              <span>Doctor:</span>
              <span>{doctor.full_name}</span>
            </div>
          )}
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
                  <span>{item.quantity} x {Number(item.unit_price).toLocaleString()} MMK</span>
                  <span>{Number(item.line_total).toLocaleString()} MMK</span>
                </div>
              </div>
            ))}
          </div>

          <div className="receipt-divider" />

          <div className="receipt-row">
            <span>Subtotal:</span>
            <span>{Number(tx.subtotal).toLocaleString()} MMK</span>
          </div>
          <div className="receipt-row">
            <span>Discount:</span>
            <span>-{Number(tx.discount_amount).toLocaleString()} MMK</span>
          </div>

          <div className="receipt-total-row">
            <span>TOTAL:</span>
            <span>{Number(tx.total_amount).toLocaleString()} MMK</span>
          </div>

          {tx.amount_paid && (
            <div className="receipt-row">
              <span>Received:</span>
              <span>{Number(tx.amount_paid).toLocaleString()} MMK</span>
            </div>
          )}
          {tx.change_amount !== null && (
            <div className="receipt-row">
              <span>Change:</span>
              <span>{Number(tx.change_amount).toLocaleString()} MMK</span>
            </div>
          )}

          {tx.status === 'paid' && (
            <div className="receipt-paid-status">
              PAID IN FULL via {tx.payment_method?.toUpperCase()}
            </div>
          )}

          <div className="receipt-divider" />

          <div className="receipt-footer">
            <p>Thank you for choosing Mudita Clinic.</p>
            <p>Health is Wealth.</p>
            <p style={{ marginTop: '10px', fontSize: '8px' }}>Ref: {tx.id}</p>
          </div>
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
