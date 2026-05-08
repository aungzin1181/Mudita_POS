import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TrendingUp, DollarSign, ShoppingCart, Users } from 'lucide-react'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const supabase = await createClient()
  const { from, to } = await searchParams

  // Default: last 30 days
  const toDate = to ? new Date(to) : new Date()
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 86400000)

  toDate.setHours(23, 59, 59, 999)
  fromDate.setHours(0, 0, 0, 0)

  const fromISO = fromDate.toISOString()
  const toISO = toDate.toISOString()

  const [
    { data: txData },
    { data: topItems },
    { data: dailyData },
  ] = await Promise.all([
    // All transactions in range
    supabase
      .from('transactions')
      .select('status, total_amount, subtotal, discount_amount, payment_method, created_at')
      .gte('created_at', fromISO)
      .lte('created_at', toISO)
      .order('created_at', { ascending: false }),

    // Top-selling items
    supabase
      .from('transaction_items')
      .select('description, item_type, quantity, line_total')
      .eq('is_removed', false)
      .order('line_total', { ascending: false })
      .limit(10),

    // Daily summaries (last 14 days for chart)
    supabase
      .from('transactions')
      .select('total_amount, created_at, status')
      .eq('status', 'paid')
      .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString())
      .order('created_at', { ascending: true }),
  ])

  const paid = txData?.filter((t) => t.status === 'paid') ?? []
  const voided = txData?.filter((t) => t.status === 'voided') ?? []
  const pending = txData?.filter((t) => ['draft', 'open'].includes(t.status)) ?? []

  const totalRevenue = paid.reduce((s, t) => s + Number(t.total_amount), 0)
  const totalDiscount = paid.reduce((s, t) => s + Number(t.discount_amount), 0)
  const avgTicket = paid.length > 0 ? totalRevenue / paid.length : 0

  const cashRev = paid.filter((t) => t.payment_method === 'cash').reduce((s, t) => s + Number(t.total_amount), 0)
  const qrRev = paid.filter((t) => t.payment_method === 'qr_ewallet').reduce((s, t) => s + Number(t.total_amount), 0)

  // Build daily buckets for last 14 days
  const dailyMap: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    dailyMap[key] = 0
  }
  dailyData?.forEach((t) => {
    const key = new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (key in dailyMap) dailyMap[key] += Number(t.total_amount)
  })
  const dailyEntries = Object.entries(dailyMap)
  const maxDaily = Math.max(...dailyEntries.map(([, v]) => v), 1)

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Analytics</div>
          <h1 className="page-title">Revenue <em>Reports</em></h1>
        </div>
      </div>

      {/* Date range filter */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <form method="GET" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label className="text-mono text-muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Date Range</label>
            <input
              name="from"
              type="date"
              className="form-input"
              style={{ width: 'auto' }}
              defaultValue={fromDate.toISOString().slice(0, 10)}
            />
            <span className="text-muted">to</span>
            <input
              name="to"
              type="date"
              className="form-input"
              style={{ width: 'auto' }}
              defaultValue={toDate.toISOString().slice(0, 10)}
            />
            <button type="submit" className="btn btn-primary">Apply</button>
            <Link href="/reports" className="btn">Reset</Link>
          </form>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card stat-card-accent">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">${totalRevenue.toFixed(2)}</div>
          <div className="stat-sub">{paid.length} paid transactions</div>
        </div>
        <div className="stat-card stat-card-green">
          <div className="stat-label">Avg. Ticket</div>
          <div className="stat-value">${avgTicket.toFixed(2)}</div>
          <div className="stat-sub">Per paid transaction</div>
        </div>
        <div className="stat-card stat-card-amber">
          <div className="stat-label">Total Discounts</div>
          <div className="stat-value">${totalDiscount.toFixed(2)}</div>
          <div className="stat-sub">{paid.length > 0 ? ((totalDiscount / (totalRevenue + totalDiscount)) * 100).toFixed(1) : '0'}% of gross</div>
        </div>
        <div className="stat-card stat-card-red">
          <div className="stat-label">Voided Transactions</div>
          <div className="stat-value">{voided.length}</div>
          <div className="stat-sub">{pending.length} still pending</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
        {/* Daily Revenue Bar Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="text-mono" style={{ fontSize: '14px' }}>Daily Revenue (Last 14 Days)</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '160px' }}>
                {dailyEntries.map(([label, value]) => (
                  <div
                    key={label}
                    title={`${label}: $${value.toFixed(2)}`}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        background: value > 0 ? 'var(--accent)' : 'var(--surface-alt)',
                        borderRadius: '4px 4px 0 0',
                        height: `${(value / maxDaily) * 130}px`,
                        minHeight: '4px',
                        transition: 'height 0.3s ease',
                      }}
                    />
                    <div
                      className="text-mono text-muted"
                      style={{
                        fontSize: '9px',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        transform: 'rotate(-45deg)',
                        transformOrigin: 'center',
                        marginTop: '4px',
                      }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Method Split */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-mono" style={{ fontSize: '14px' }}>Payment Method Split</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
              {[
                { label: 'Cash', value: cashRev, color: 'var(--green)' },
                { label: 'QR / eWallet', value: qrRev, color: 'var(--accent)' },
              ].map(({ label, value, color }) => {
                const pct = totalRevenue > 0 ? ((value / totalRevenue) * 100).toFixed(1) : '0'
                return (
                  <div key={label} style={{ flex: 1 }}>
                    <div className="text-mono text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '26px', fontWeight: 800, color }}>${value.toFixed(2)}</div>
                    <div style={{ marginTop: '8px', height: '6px', background: 'var(--surface-alt)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px' }} />
                    </div>
                    <div className="text-mono text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>{pct}% of total</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Full Transaction Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-mono" style={{ fontSize: '14px' }}>Transactions in Period</h3>
              <span className="text-muted text-mono" style={{ fontSize: '12px' }}>{txData?.length ?? 0} records</span>
            </div>
            <div style={{ padding: 0, maxHeight: '400px', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Discount</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {txData?.map((t, i) => (
                    <tr key={i}>
                      <td className="text-mono" style={{ fontSize: '12px' }}>
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                      <td className="text-muted" style={{ fontSize: '13px', textTransform: 'capitalize' }}>
                        {t.payment_method || '—'}
                      </td>
                      <td className="text-mono" style={{ color: 'var(--red)', fontSize: '13px' }}>
                        {Number(t.discount_amount) > 0 ? `-$${Number(t.discount_amount).toFixed(2)}` : '—'}
                      </td>
                      <td className="text-mono" style={{ fontWeight: 500 }}>${Number(t.total_amount).toFixed(2)}</td>
                    </tr>
                  ))}
                  {(!txData || txData.length === 0) && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-muted)' }}>
                        No transactions in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right sidebar: top items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="text-mono" style={{ fontSize: '14px' }}>Top Billed Items</h3>
            </div>
            <div style={{ padding: 0 }}>
              {topItems && topItems.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topItems.map((item, i) => (
                      <tr key={i}>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: '13px' }}>{item.description}</div>
                          <div className="text-mono text-muted" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                            {item.item_type}
                          </div>
                        </td>
                        <td className="text-mono" style={{ fontWeight: 500, color: 'var(--accent)' }}>
                          ${Number(item.line_total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-sub">No data yet</div>
                </div>
              )}
            </div>
          </div>

          {/* Status summary */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-mono" style={{ fontSize: '14px' }}>Status Breakdown</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Paid', count: paid.length, cls: 'badge-paid' },
                { label: 'Pending', count: pending.length, cls: 'badge-open' },
                { label: 'Voided', count: voided.length, cls: 'badge-voided' },
              ].map(({ label, count, cls }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge ${cls}`}>{label}</span>
                  <span className="text-mono" style={{ fontWeight: 600, fontSize: '16px' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
