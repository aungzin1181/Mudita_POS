import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Transaction } from '@/types/pos';
import { Plus, Receipt } from 'lucide-react';

import DateFilter from './DateFilter';

export default async function POSPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}) {
  const { period, from, to } = await searchParams;
  const supabase = await createClient();

  let startIso: string | null = null;
  let endIso: string | null = null;
  let label = 'Recent Transactions';

  if (period === 'today') {
    label = 'Today';
    const d = new Date().toLocaleDateString('en-CA');
    startIso = new Date(d + 'T00:00:00').toISOString();
    endIso = new Date(d + 'T23:59:59.999').toISOString();
  } else if (period === 'week') {
    label = 'This Week';
    const d = new Date();
    d.setDate(d.getDate() - d.getDay()); // Sunday
    startIso = new Date(d.toLocaleDateString('en-CA') + 'T00:00:00').toISOString();
    endIso = new Date(new Date().toLocaleDateString('en-CA') + 'T23:59:59.999').toISOString();
  } else if (period === 'month') {
    label = 'This Month';
    const d = new Date();
    d.setDate(1);
    startIso = new Date(d.toLocaleDateString('en-CA') + 'T00:00:00').toISOString();
    endIso = new Date(new Date().toLocaleDateString('en-CA') + 'T23:59:59.999').toISOString();
  } else if (from || to) {
    label = 'Custom Date Range';
    if (from) startIso = new Date(from + 'T00:00:00').toISOString();
    if (to) endIso = new Date(to + 'T23:59:59.999').toISOString();
  }

  let query = supabase
    .from('transactions')
    .select('*')
    .neq('status', 'draft')
    .order('created_at', { ascending: false });

  if (startIso) query = query.gte('created_at', startIso);
  if (endIso) query = query.lte('created_at', endIso);

  const { data: transactions } = await query;

  // Breakdown for the filtered period
  const paid = transactions?.filter(t => t.status === 'paid') || [];
  const open = transactions?.filter(t => t.status === 'open') || [];
  const voided = transactions?.filter(t => t.status === 'voided') || [];
  
  const totalRev = paid.reduce((sum, t) => sum + Number(t.total_amount), 0);

  return (
    <div className="container">
      <header className="mb-4 flex justify-between items-center" style={{ marginBottom: '24px' }}>
        <div>
          <div className="text-mono text-muted" style={{ fontSize: '11px', letterSpacing: '0.15em' }}>SYSTEM · POS</div>
          <h1 style={{ fontSize: '36px' }}>Transaction <em>Overview</em></h1>
        </div>
        <Link href="/pos/new" className="btn btn-primary">
          <Plus size={18} />
          New Transaction
        </Link>
      </header>

      {/* Filters and Stats */}
      <div className="card" style={{ marginBottom: '24px', overflow: 'visible' }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <DateFilter period={period} from={from} to={to} />
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: '28px' }}>
        <div className="stat-card stat-card-green">
          <div className="stat-label">Paid Invoices</div>
          <div className="stat-value">{paid.length}</div>
          <div className="stat-sub">{totalRev.toLocaleString()} MMK</div>
        </div>
        <div className="stat-card stat-card-amber">
          <div className="stat-label">Open / Pending</div>
          <div className="stat-value">{open.length}</div>
          <div className="stat-sub">Awaiting payment</div>
        </div>
        <div className="stat-card stat-card-red">
          <div className="stat-label">Voided</div>
          <div className="stat-value">{voided.length}</div>
          <div className="stat-sub">Cancelled transactions</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-mono" style={{ fontSize: '14px' }}>{label}</h3>
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
                  <td className="text-muted">
                    {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
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
                    No transactions found for this period.
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
