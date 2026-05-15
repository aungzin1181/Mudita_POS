import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Transaction } from '@/types/pos';
import { Plus, Receipt } from 'lucide-react';

export default async function POSPage() {
  const supabase = await createClient();

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .neq('status', 'draft')
    .order('created_at', { ascending: false });

  return (
    <div className="container">
      <header className="mb-4 flex justify-between items-center">
        <div>
          <div className="text-mono text-muted" style={{ fontSize: '11px', letterSpacing: '0.15em' }}>SYSTEM · POS</div>
          <h1 style={{ fontSize: '36px' }}>Transaction <em>Overview</em></h1>
        </div>
        <Link href="/pos/new" className="btn btn-primary">
          <Plus size={18} />
          New Transaction
        </Link>
      </header>

      <div className="card">
        <div className="card-header">
          <h3 className="text-mono" style={{ fontSize: '14px' }}>Recent Transactions</h3>
          <span className="text-muted text-mono" style={{ fontSize: '12px' }}>{transactions?.length || 0} Total</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions?.map((tx: Transaction) => (
                <tr key={tx.id}>
                  <td className="text-mono" style={{ color: 'var(--accent)', fontWeight: 500 }}>{tx.invoice_no}</td>
                  <td className="text-muted">{new Date(tx.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge badge-${tx.status}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="text-mono">{tx.total_amount.toLocaleString()} MMK</td>
                  <td>
                    <Link href={`/pos/transaction/${tx.id}`} className="btn" style={{ padding: '4px 12px', fontSize: '13px' }}>
                      <Receipt size={14} />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {(!transactions || transactions.length === 0) && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-muted)' }}>
                    No transactions found. Start by creating a new one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
