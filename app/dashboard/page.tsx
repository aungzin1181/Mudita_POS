import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  Users, ShoppingCart, Package,
  TrendingUp, AlertTriangle, Receipt, Calendar
} from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: patientCount },
    { count: txCount },
    { data: recentTx },
    { data: paidToday },
    { data: allActiveProducts },
    { count: pendingApptCount },
  ] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }),
    supabase.from('transactions').select('*', { count: 'exact', head: true }),
    supabase
      .from('transactions')
      .select('id, invoice_no, status, total_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('transactions')
      .select('total_amount')
      .eq('status', 'paid')
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase
      .from('products')
      .select('id, name, stock_qty, low_stock_threshold')
      .eq('is_active', true),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('appointment_date', new Date().toLocaleDateString('en-CA'))
      .eq('status', 'pending'),
  ]);

  const todayRevenue = paidToday?.reduce((sum, t) => sum + Number(t.total_amount), 0) ?? 0;
  const openCount = recentTx?.filter((t) => ['draft', 'open'].includes(t.status)).length ?? 0;

  // Client-side column comparison for low stock (PostgREST can't compare two columns directly)
  const lowStock = allActiveProducts
    ?.filter((p) => p.stock_qty <= (p.low_stock_threshold ?? 10))
    .slice(0, 5) ?? [];

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Medical Clinic POS</div>
          <h1 className="page-title">
            Good day, <em>Doctor</em>
          </h1>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="stat-grid">
        <div className="stat-card stat-card-accent">
          <div className="stat-label">Today&apos;s Revenue</div>
          <div className="stat-value">{todayRevenue.toLocaleString()} MMK</div>
          <div className="stat-sub">Paid transactions today</div>
        </div>
        <div className="stat-card stat-card-blue" style={{ borderLeftColor: 'var(--accent)', background: 'var(--accent-soft)' }}>
          <div className="stat-label">Today&apos;s Appointments</div>
          <div className="stat-value">{pendingApptCount ?? 0}</div>
          <div className="stat-sub">Pending in queue</div>
        </div>
        <div className="stat-card stat-card-green">
          <div className="stat-label">Total Patients</div>
          <div className="stat-value">{patientCount ?? 0}</div>
          <div className="stat-sub">Registered in system</div>
        </div>
        <div className="stat-card stat-card-amber">
          <div className="stat-label">Open Transactions</div>
          <div className="stat-value">{openCount}</div>
          <div className="stat-sub">Awaiting payment</div>
        </div>
        <div className="stat-card stat-card-red">
          <div className="stat-label">Total Transactions</div>
          <div className="stat-value">{txCount ?? 0}</div>
          <div className="stat-sub">All time</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
        {/* RECENT TRANSACTIONS */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-mono" style={{ fontSize: '14px' }}>Recent Transactions</h3>
            <Link href="/pos" className="btn btn-sm">View All</Link>
          </div>
          <div style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentTx?.map((tx) => (
                  <tr key={tx.id}>
                    <td className="text-mono" style={{ color: 'var(--accent)', fontWeight: 500 }}>
                      {tx.invoice_no}
                    </td>
                    <td className="text-muted" style={{ fontSize: '13px' }}>
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`badge badge-${tx.status}`}>{tx.status}</span>
                    </td>
                    <td className="text-mono">{Number(tx.total_amount).toLocaleString()} MMK</td>
                    <td>
                      <Link href={`/pos/transaction/${tx.id}`} className="btn btn-sm">
                        <Receipt size={13} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
                {(!recentTx || recentTx.length === 0) && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-muted)' }}>
                      No transactions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-mono" style={{ fontSize: '14px' }}>Quick Actions</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/appointments" className="btn" style={{ justifyContent: 'flex-start' }}>
                <Calendar size={16} /> Appointments Queue
                {(pendingApptCount ?? 0) > 0 && <span className="badge badge-amber" style={{ marginLeft: 'auto', padding: '2px 6px', fontSize: '10px' }}>{pendingApptCount} pending</span>}
              </Link>
              <Link href="/pos/new" className="btn" style={{ justifyContent: 'flex-start' }}>
                <ShoppingCart size={16} /> New Transaction
              </Link>
              <Link href="/patients/new" className="btn" style={{ justifyContent: 'flex-start' }}>
                <Users size={16} /> Register Patient
              </Link>
              <Link href="/inventory/new" className="btn" style={{ justifyContent: 'flex-start' }}>
                <Package size={16} /> Add Inventory
              </Link>
              <Link href="/reports" className="btn" style={{ justifyContent: 'flex-start' }}>
                <TrendingUp size={16} /> View Reports
              </Link>
            </div>
          </div>

          {/* Low Stock Alert */}
          {lowStock.length > 0 && (
            <div className="card" style={{ borderLeft: '4px solid var(--amber)' }}>
              <div className="card-header">
                <h3 style={{ fontSize: '13px', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} /> Low Stock
                </h3>
                <Link href="/inventory?filter=low" className="btn btn-sm" style={{ fontSize: '11px', padding: '3px 10px' }}>
                  View All
                </Link>
              </div>
              <div style={{ padding: '8px 0' }}>
                {lowStock.map((p) => (
                  <div key={p.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 16px', borderBottom: '1px solid var(--surface-alt)',
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{p.name}</span>
                    <span className="badge badge-low">{p.stock_qty}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lowStock.length === 0 && allActiveProducts && allActiveProducts.length > 0 && (
            <div className="card" style={{ borderLeft: '4px solid var(--green)' }}>
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Package size={18} style={{ color: 'var(--green)' }} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--green)', fontSize: '13px' }}>All Stock OK</div>
                  <div className="text-muted" style={{ fontSize: '12px' }}>{allActiveProducts.length} products tracked</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
