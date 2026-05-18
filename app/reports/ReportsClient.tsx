'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import './reports.css'

export default function ReportsClient({
  dateFrom,
  dateTo,
  eodData,
  profitData,
  lowStockData,
  expiryData,
}: any) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('eod')

  // We use native form action instead of handleDateApply to ensure robust server-side re-fetching
  const handleDateApply = (e: React.FormEvent) => {
    // keeping for backward compatibility if needed, but native form is better
  }

  const switchReport = (id: string) => {
    setActiveTab(id)
  }

  // Calculate EOD Max Bar
  const eodMax = Math.max(...eodData.daily.map((d: any) => d.v), 1)
  const pftMax = Math.max(...profitData.daily.map((d: any) => d.rev), 1)

  return (
    <div className="report-container container" style={{ minHeight: 'calc(100vh - 80px)' }}>
      {/* ══════════════ SHARED PAGE HEADER + TABS ══════════════ */}
      <div className="page-eyebrow">Analytics</div>
      <div className="page-title">Revenue <em>Reports</em></div>

      <div className="report-tabs">
        <button className={`tab-btn ${activeTab === 'eod' ? 'active' : ''}`} onClick={() => switchReport('eod')}>
          <span className="tab-icon">📊</span> EOD Report
        </button>
        <button className={`tab-btn ${activeTab === 'profit' ? 'active' : ''}`} onClick={() => switchReport('profit')}>
          <span className="tab-icon">💰</span> Daily Income & Profit
        </button>
        <button className={`tab-btn ${activeTab === 'expiry' ? 'active' : ''}`} onClick={() => switchReport('expiry')}>
          <span className="tab-icon">⏳</span> Near-Expiry Products
        </button>
        <button className={`tab-btn ${activeTab === 'lowstock' ? 'active' : ''}`} onClick={() => switchReport('lowstock')}>
          <span className="tab-icon">📦</span> Low Stock Products
        </button>
      </div>

      {/* ══════════════ 1. EOD REPORT ══════════════ */}
      {activeTab === 'eod' && (
        <section className="report-section active">
          <form className="filter-bar" action="/reports" method="GET">
            <span className="filter-label">Date Range</span>
            <input className="filter-input" name="from" type="date" defaultValue={dateFrom} />
            <span className="filter-sep">to</span>
            <input className="filter-input" name="to" type="date" defaultValue={dateTo} />
            <button className="btn-apply" type="submit">Apply</button>
            <Link href="/reports" className="btn-reset">Reset</Link>
          </form>

          {/* KPIs */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Total Revenue</div>
              <div className="kpi-value">{eodData.totalRevenue.toLocaleString()} MMK</div>
              <div className="kpi-sub">{eodData.paidCount} paid transactions</div>
            </div>
            <div className="kpi-card green">
              <div className="kpi-label">Doctor Fees</div>
              <div className="kpi-value">{eodData.doctorFees?.toLocaleString() ?? 0} MMK</div>
              <div className="kpi-sub">Total consultation income</div>
            </div>
            <div className="kpi-card amber">
              <div className="kpi-label">Profit on Products</div>
              <div className="kpi-value">{eodData.productProfit?.toLocaleString() ?? 0} MMK</div>
              <div className="kpi-sub">Calculated from buying price</div>
            </div>
            <div className="kpi-card purple">
              <div className="kpi-label">Pharmacy Revenue</div>
              <div className="kpi-value">{eodData.pharmacyRevenue?.toLocaleString() ?? 0} MMK</div>
              <div className="kpi-sub">Product sales only</div>
            </div>
          </div>

          {/* Chart + Top Billed */}
          <div className="two-col">
            <div className="rcard">
              <div className="rcard-head">
                <span className="rcard-title">Daily Revenue (Last 14 Days)</span>
                <span className="rcard-meta">MMK</span>
              </div>
              <div className="rcard-body">
                <div className="chart-wrap">
                  {eodData.daily.map((d: any, i: number) => (
                    <div className="chart-bar-group" key={d.d}>
                      <div className={`chart-bar ${i === eodData.daily.length - 1 ? 'highlight' : ''}`}
                           style={{ height: `${d.v > 0 ? Math.max(4, (d.v / eodMax) * 152) : 2}px` }}
                           title={`${d.d}: ${d.v.toLocaleString()} MMK`}></div>
                      <div className="chart-date">{d.d}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rcard">
              <div className="rcard-head">
                <span className="rcard-title">Top Billed Items</span>
                <span className="rcard-meta">Period</span>
              </div>
              <div className="rcard-body" style={{ padding: '12px 18px', maxHeight: '252px', overflowY: 'auto' }}>
                {eodData.topItems.map((item: any, i: number) => (
                  <div className="top-item" key={i}>
                    <div>
                      <div className="top-item-name">{item.description}</div>
                      <div className="top-item-cat">{item.item_type}</div>
                    </div>
                    <div className="top-item-rev">{Number(item.line_total).toLocaleString()} MMK</div>
                  </div>
                ))}
                {eodData.topItems.length === 0 && <div className="text-muted" style={{ fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>No items sold in this period.</div>}
              </div>
            </div>
          </div>

          {/* Payment Method Split */}
          <div className="rcard">
            <div className="rcard-head"><span className="rcard-title">Payment Method Split</span></div>
            <div className="rcard-body">
              <div className="pay-split">
                <div className="pay-method">
                  <div className="pay-label-mono">Cash</div>
                  <div className="pay-amount cash">{eodData.cashRev.toLocaleString()} MMK</div>
                  <div className="pay-bar">
                    <div className="pay-fill fill-green" style={{ width: `${eodData.cashPct}%` }}></div>
                  </div>
                  <div className="pay-pct">{eodData.cashPct}% of total</div>
                </div>
                <div className="pay-method">
                  <div className="pay-label-mono">KPay</div>
                  <div className="pay-amount kpay">{eodData.kpayRev.toLocaleString()} MMK</div>
                  <div className="pay-bar">
                    <div className="pay-fill fill-teal" style={{ width: `${eodData.kpayPct}%` }}></div>
                  </div>
                  <div className="pay-pct">{eodData.kpayPct}% of total</div>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions table */}
          <div className="rcard">
            <div className="rcard-head">
              <span className="rcard-title">Transactions</span>
              <span className="rcard-meta">{eodData.transactions.length} records</span>
            </div>
            <table className="rtbl">
              <thead>
                <tr><th>TXN No.</th><th>Status</th><th>Payment</th><th>Discount</th><th>Total</th></tr>
              </thead>
              <tbody>
                {eodData.transactions.map((t: any) => (
                  <tr key={t.id}>
                    <td className="num">{t.invoice_no || t.id.substring(0,8)}</td>
                    <td>
                      <span className={`rbadge ${t.status === 'paid' ? 'b-paid' : t.status === 'voided' ? 'b-voided' : 'b-pending'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      <span className={`rbadge ${t.payment_method === 'cash' ? 'b-cash' : t.payment_method === 'kpay' ? 'b-kpay' : ''}`}>
                        {t.payment_method || '—'}
                      </span>
                    </td>
                    <td className="num">{t.discount_amount > 0 ? t.discount_amount.toLocaleString() : '—'}</td>
                    <td className="num">{t.total_amount.toLocaleString()} MMK</td>
                  </tr>
                ))}
                {eodData.transactions.length === 0 && (
                  <tr><td colSpan={5} style={{textAlign: 'center', padding: '20px', color: 'var(--r-muted)'}}>No transactions found.</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr><td colSpan={4} style={{ textAlign: 'right', color: 'var(--r-muted)' }}>Total Collected</td><td className="num" style={{ color: 'var(--r-green)', fontWeight: 600 }}>{eodData.totalRevenue.toLocaleString()} MMK</td></tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {/* ══════════════ 2. DAILY INCOME + PROFIT ══════════════ */}
      {activeTab === 'profit' && (
        <section className="report-section active">
          <form className="filter-bar" action="/reports" method="GET">
            <input type="hidden" name="tab" value="profit" />
            <span className="filter-label">Date Range</span>
            <input className="filter-input" name="from" type="date" defaultValue={dateFrom} />
            <span className="filter-sep">to</span>
            <input className="filter-input" name="to" type="date" defaultValue={dateTo} />
            <button className="btn-apply" type="submit">Apply</button>
            <Link href="/reports?tab=profit" className="btn-reset">Reset</Link>
          </form>

          {/* KPIs */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Total Revenue</div>
              <div className="kpi-value">{profitData.totalRevenue.toLocaleString()} MMK</div>
              <div className="kpi-sub">Selected period</div>
            </div>
            <div className="kpi-card green">
              <div className="kpi-label">Gross Profit</div>
              <div className="kpi-value">{profitData.grossProfit.toLocaleString()} MMK</div>
              <div className="kpi-sub">{profitData.overallMargin}% overall margin</div>
            </div>
            <div className="kpi-card amber">
              <div className="kpi-label">Total Cost</div>
              <div className="kpi-value">{profitData.totalCost.toLocaleString()} MMK</div>
              <div className="kpi-sub">Buying price total</div>
            </div>
            <div className="kpi-card purple">
              <div className="kpi-label">Best Margin Item</div>
              <div className="kpi-value" style={{ fontSize: '20px' }}>{profitData.bestMarginItem || '—'}</div>
              <div className="kpi-sub">{profitData.bestMarginValue}% margin</div>
            </div>
          </div>

          {/* Revenue + Profit Chart */}
          <div className="rcard">
            <div className="rcard-head">
              <span className="rcard-title">Revenue vs Profit (Last 14 Days)</span>
              <span className="rcard-meta" style={{ display: 'flex', gap: '14px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--r-navy)', display: 'inline-block' }}></span>Revenue</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--r-green)', display: 'inline-block' }}></span>Profit</span>
              </span>
            </div>
            <div className="rcard-body">
              <div className="chart-wrap">
                {profitData.daily.map((d: any) => (
                  <div className="chart-bar-group" style={{ gap: '2px', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }} key={d.d}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                      <div className="chart-bar" style={{ height: `${d.rev > 0 ? Math.max(3, (d.rev / pftMax) * 152) : 2}px`, width: '45%' }} title={`${d.d} Revenue: ${d.rev.toLocaleString()} MMK`}></div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                      <div className="chart-bar profit" style={{ height: `${d.pft > 0 ? Math.max(3, (d.pft / pftMax) * 152) : 2}px`, width: '45%' }} title={`${d.d} Profit: ${d.pft.toLocaleString()} MMK`}></div>
                    </div>
                    <div className="chart-date" style={{ position: 'absolute', bottom: '-4px' }}>{d.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Profit table */}
          <div className="rcard">
            <div className="rcard-head">
              <span className="rcard-title">Product Profit Summary</span>
              <span className="rcard-meta">Sorted by gross profit</span>
            </div>
            <table className="rtbl">
              <thead>
                <tr><th>Product</th><th>Units Sold</th><th>Revenue</th><th>Cost</th><th>Profit</th><th>Margin %</th></tr>
              </thead>
              <tbody>
                {profitData.products.map((p: any, i: number) => {
                  let cls = 'margin-high';
                  if (p.margin < 30 && p.margin >= 10) cls = 'margin-mid';
                  if (p.margin < 10) cls = 'margin-low';
                  
                  return (
                    <tr className={cls} key={i}>
                      <td><div style={{ fontWeight: 500 }}>{p.name}</div><div style={{ fontFamily: 'var(--r-f-mono)', fontSize: '10px', color: 'var(--r-muted)' }}>{p.generic_name || 'No generic'}</div></td>
                      <td className="num">{p.units_sold}</td>
                      <td className="num">{p.revenue.toLocaleString()} MMK</td>
                      <td className="num">{p.cost.toLocaleString()} MMK</td>
                      <td className="num">{p.profit.toLocaleString()} MMK</td>
                      <td><span className="num">{p.margin.toFixed(1)}%</span></td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} style={{ color: 'var(--r-muted)' }}>Total</td>
                  <td className="num">{profitData.totalRevenue.toLocaleString()} MMK</td>
                  <td className="num">{profitData.totalCost.toLocaleString()} MMK</td>
                  <td className="num" style={{ color: 'var(--r-green)' }}>{profitData.grossProfit.toLocaleString()} MMK</td>
                  <td className="num" style={{ color: 'var(--r-green)' }}>{profitData.overallMargin}%</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '16px', fontFamily: 'var(--r-f-mono)', fontSize: '11px', color: 'var(--r-muted)' }}>
            <span style={{ color: 'var(--r-green)' }}>● ≥ 30% Good margin</span>
            <span style={{ color: 'var(--r-amber)' }}>● 10–29% Watch margin</span>
            <span style={{ color: 'var(--r-red)' }}>● &lt; 10% Low margin — review pricing</span>
          </div>
        </section>
      )}

      {/* ══════════════ 3. NEAR-EXPIRY ══════════════ */}
      {activeTab === 'expiry' && (
        <section className="report-section active">
          <div className="filter-bar">
            <span className="filter-label">Expiry Within</span>
            <select className="filter-input" style={{ cursor: 'pointer' }} defaultValue="30">
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
            <button className="btn-apply">Apply</button>
            <button className="btn-reset">Reset</button>
          </div>

          <div className="kpi-grid">
            <div className="kpi-card red">
              <div className="kpi-label">Expiring This Week</div>
              <div className="kpi-value">{expiryData.expiring7}</div>
              <div className="kpi-sub">Within 7 days</div>
            </div>
            <div className="kpi-card amber">
              <div className="kpi-label">Expiring This Month</div>
              <div className="kpi-value">{expiryData.expiring30}</div>
              <div className="kpi-sub">Within 30 days</div>
            </div>
            <div className="kpi-card green">
              <div className="kpi-label">Total Stock at Risk</div>
              <div className="kpi-value">{expiryData.totalUnitsAtRisk}</div>
              <div className="kpi-sub">Units expiring soon</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Est. Loss Value</div>
              <div className="kpi-value">{expiryData.lossValue.toLocaleString()} MMK</div>
              <div className="kpi-sub">If not used in time</div>
            </div>
          </div>

          {expiryData.expiring7 > 0 && (
            <div className="ralert al-red">
              <span>⚠️</span>
              <span><strong>{expiryData.expiring7} products expire within 7 days.</strong> Prioritize dispensing or contact supplier for return authorization.</span>
            </div>
          )}

          <div className="rcard">
            <div className="rcard-head">
              <span className="rcard-title">Near-Expiry Product List</span>
              <span className="rcard-meta">Mock data shown</span>
            </div>
            <table className="rtbl">
              <thead>
                <tr><th>Product</th><th>Generic Name</th><th>Category</th><th>Batch No.</th><th>Expiry Date</th><th>Days Left</th><th>Stock Qty</th><th>Status</th></tr>
              </thead>
              <tbody>
                {expiryData.items.map((item: any, i: number) => (
                  <tr key={i}>
                    <td><div style={{ fontWeight: 500 }}>{item.name}</div><div style={{ fontFamily: 'var(--r-f-mono)', fontSize: '10px', color: 'var(--r-muted)' }}>SKU: {item.sku}</div></td>
                    <td style={{ fontSize: '12px', color: 'var(--r-muted)' }}>{item.generic}</td>
                    <td><span className="rbadge b-oral">{item.category}</span></td>
                    <td className="num">{item.batch}</td>
                    <td className="num">{item.date}</td>
                    <td><span className={`rbadge ${item.days <= 7 ? 'b-crit' : 'b-warn'}`}>{item.days} days</span></td>
                    <td className="num">{item.stock} units</td>
                    <td><span className="rbadge b-paid">Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ══════════════ 4. LOW STOCK ══════════════ */}
      {activeTab === 'lowstock' && (
        <section className="report-section active">
          <div className="filter-bar">
            <span className="filter-label">Category</span>
            <select className="filter-input" style={{ cursor: 'pointer' }}>
              <option>All Categories</option>
            </select>
            <button className="btn-apply">Apply</button>
            <button className="btn-reset">Reset</button>
          </div>

          <div className="kpi-grid">
            <div className="kpi-card red">
              <div className="kpi-label">Critical (0–5 units)</div>
              <div className="kpi-value">{lowStockData.critical}</div>
              <div className="kpi-sub">Restock immediately</div>
            </div>
            <div className="kpi-card amber">
              <div className="kpi-label">Low (Below threshold)</div>
              <div className="kpi-value">{lowStockData.low}</div>
              <div className="kpi-sub">Order soon</div>
            </div>
            <div className="kpi-card green">
              <div className="kpi-label">At Reorder Level</div>
              <div className="kpi-value">{lowStockData.reorder}</div>
              <div className="kpi-sub">Plan next order</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Products Tracked</div>
              <div className="kpi-value">{lowStockData.tracked}</div>
              <div className="kpi-sub">Active inventory items</div>
            </div>
          </div>

          {lowStockData.critical > 0 && (
            <div className="ralert al-red">
              <span>🚨</span>
              <span><strong>{lowStockData.critical} products are critically low (0–5 units).</strong> These may run out before the next delivery. Contact suppliers immediately.</span>
            </div>
          )}

          <div className="rcard">
            <div className="rcard-head">
              <span className="rcard-title">Low Stock Product List</span>
              <span className="rcard-meta">Sorted by stock qty ascending</span>
            </div>
            <table className="rtbl">
              <thead>
                <tr><th>Product</th><th>Unit Type</th><th>Stock Qty</th><th>Reorder Level</th><th>Supplier</th><th>Status</th></tr>
              </thead>
              <tbody>
                {lowStockData.items.map((p: any) => {
                  let badge = <span className="rbadge b-ok">Reorder</span>;
                  if (p.stock_qty <= 5) badge = <span className="rbadge b-crit">Critical</span>;
                  else if (p.reorder_level && p.stock_qty < p.reorder_level) badge = <span className="rbadge b-warn">Low</span>;

                  return (
                    <tr key={p.id}>
                      <td><div style={{ fontWeight: 500 }}>{p.name}</div><div style={{ fontFamily: 'var(--r-f-mono)', fontSize: '10px', color: 'var(--r-muted)' }}>SKU: {p.sku}</div></td>
                      <td style={{ fontSize: '12px' }}>{p.unit_type || '—'}</td>
                      <td>
                        <span style={{ fontFamily: 'var(--r-f-mono)', fontSize: '13px', fontWeight: 600, color: p.stock_qty <= 5 ? 'var(--r-red)' : 'var(--r-amber)' }}>
                          {p.stock_qty}
                        </span>
                      </td>
                      <td className="num">{p.reorder_level || '—'}</td>
                      <td style={{ fontSize: '12px', color: 'var(--r-muted)' }}>{p.supplier || '—'}</td>
                      <td>{badge}</td>
                    </tr>
                  )
                })}
                {lowStockData.items.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'var(--r-muted)' }}>No low stock items found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '16px', fontFamily: 'var(--r-f-mono)', fontSize: '11px', color: 'var(--r-muted)' }}>
            <span style={{ color: 'var(--r-red)' }}>● Critical: 0–5 units</span>
            <span style={{ color: 'var(--r-amber)' }}>● Low: below threshold</span>
            <span style={{ color: 'var(--r-teal)' }}>● Reorder: at reorder level</span>
          </div>
        </section>
      )}
    </div>
  )
}
