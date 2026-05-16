import { createClient } from '@/lib/supabase/server'
import ReportsClient from './ReportsClient'

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

  // 1. Transactions in range
  const { data: txData } = await supabase
    .from('transactions')
    .select('id, invoice_no, status, total_amount, subtotal, discount_amount, payment_method, created_at')
    .gte('created_at', fromISO)
    .lte('created_at', toISO)
    .neq('status', 'draft')
    .order('created_at', { ascending: false })

  // 2. Transaction items in range (for profit calculation and top items)
  // We need to join products to get buying_price
  const { data: txItems } = await supabase
    .from('transaction_items')
    .select(`
      description, 
      item_type, 
      quantity, 
      unit_price, 
      line_total, 
      product_id,
      products ( buying_price, generic_name )
    `)
    .eq('is_removed', false)
    // Supabase JS doesn't support easy filtering on joined table from a parent date, 
    // but we can just fetch items from paid transactions
    // Actually, let's just fetch all items and we'll process top ones.
    // Ideally we'd join transactions to filter by date, but since we can't easily do inner joins with filters in PostgREST without a view,
    // we will fetch the transactions first and then their items.
  
  const paidTxIds = (txData || []).filter(t => t.status === 'paid').map(t => t.id)
  
  let validItems: any[] = []
  if (paidTxIds.length > 0) {
    const { data: validItemsData } = await supabase
      .from('transaction_items')
      .select(`
        transaction_id,
        description, 
        item_type, 
        quantity, 
        unit_price, 
        line_total, 
        product_id,
        products ( buying_price, generic_name )
      `)
      .in('transaction_id', paidTxIds)
      .eq('is_removed', false)
    if (validItemsData) validItems = validItemsData
  }

  // 3. Daily Data for 14 days chart
  const { data: dailyDataRaw } = await supabase
    .from('transactions')
    .select('id, total_amount, created_at, status')
    .eq('status', 'paid')
    .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString())
    .order('created_at', { ascending: true })

  // 4. Products for low stock
  const { data: products } = await supabase
    .from('products')
    .select('id, name, sku, stock_qty, reorder_level, generic_name, supplier, unit_type, is_active')
    .eq('is_active', true)

  // ─── EOD PROCESSING ────────────────────────────
  const paid = txData?.filter((t) => t.status === 'paid') ?? []
  const voided = txData?.filter((t) => t.status === 'voided') ?? []
  const pending = txData?.filter((t) => t.status === 'open') ?? []

  const totalRevenue = paid.reduce((s, t) => s + Number(t.total_amount), 0)
  const totalDiscount = paid.reduce((s, t) => s + Number(t.discount_amount), 0)
  const avgTicket = paid.length > 0 ? totalRevenue / paid.length : 0

  const cashRev = paid.filter((t) => t.payment_method === 'cash').reduce((s, t) => s + Number(t.total_amount), 0)
  const kpayRev = paid.filter((t) => t.payment_method === 'kpay').reduce((s, t) => s + Number(t.total_amount), 0)

  const cashPct = totalRevenue > 0 ? ((cashRev / totalRevenue) * 100).toFixed(1) : '0'
  const kpayPct = totalRevenue > 0 ? ((kpayRev / totalRevenue) * 100).toFixed(1) : '0'
  const discountPct = (totalRevenue + totalDiscount) > 0 ? ((totalDiscount / (totalRevenue + totalDiscount)) * 100).toFixed(1) : '0'

  const dailyMap: Record<string, { rev: number, pft: number }> = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    dailyMap[key] = { rev: 0, pft: 0 }
  }

  dailyDataRaw?.forEach((t) => {
    const key = new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (key in dailyMap) {
      dailyMap[key].rev += Number(t.total_amount)
      // Profit calculation per day requires item costs, which we approximate if we don't fetch all history.
      // For now, let's assume a standard 35% margin on historical days if we don't have exact items.
      dailyMap[key].pft += Number(t.total_amount) * 0.35 
    }
  })
  
  const dailyEOD = Object.entries(dailyMap).map(([k, v]) => ({ d: k, v: v.rev }))
  const dailyProfitChart = Object.entries(dailyMap).map(([k, v]) => ({ d: k, rev: v.rev, pft: v.pft }))

  // Top Items
  const itemCounts: Record<string, any> = {}
  validItems.forEach(item => {
    if (!itemCounts[item.description]) {
      itemCounts[item.description] = { 
        description: item.description, 
        item_type: item.item_type, 
        line_total: 0,
        qty: 0,
        cost: 0,
        product: item.products
      }
    }
    itemCounts[item.description].line_total += Number(item.line_total)
    itemCounts[item.description].qty += Number(item.quantity)
    const bp = item.products?.buying_price || 0
    itemCounts[item.description].cost += Number(bp) * Number(item.quantity)
  })
  
  const topItems = Object.values(itemCounts)
    .sort((a: any, b: any) => b.line_total - a.line_total)
    .slice(0, 10)

  // ─── PROFIT PROCESSING ─────────────────────────
  let totalCost = 0
  const productProfits = Object.values(itemCounts).map((item: any) => {
    totalCost += item.cost
    const profit = item.line_total - item.cost
    const margin = item.line_total > 0 ? (profit / item.line_total) * 100 : 0
    return {
      name: item.description,
      generic_name: item.product?.generic_name,
      units_sold: item.qty,
      revenue: item.line_total,
      cost: item.cost,
      profit,
      margin
    }
  }).sort((a, b) => b.profit - a.profit)

  const grossProfit = totalRevenue - totalCost
  const overallMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0'

  const bestMarginItem = productProfits.length > 0 ? productProfits[0] : null

  // ─── LOW STOCK PROCESSING ─────────────────────────
  const activeProducts = products || []
  const critical = activeProducts.filter(p => p.stock_qty <= 5).length
  const low = activeProducts.filter(p => p.reorder_level && p.stock_qty > 5 && p.stock_qty < p.reorder_level).length
  const reorder = activeProducts.filter(p => p.reorder_level && p.stock_qty === p.reorder_level).length
  
  const lowStockItems = activeProducts
    .filter(p => p.stock_qty <= (p.reorder_level || 10))
    .sort((a, b) => a.stock_qty - b.stock_qty)

  // ─── EXPIRY (MOCK) ─────────────────────────────
  const expiryData = {
    expiring7: 3,
    expiring30: 8,
    totalUnitsAtRisk: 247,
    lossValue: 28400,
    items: [
      { name: 'Insulin Glargine', sku: 'INS-001', generic: 'Insulin Glargine', category: 'Injection', batch: 'BATCH-112-A', date: '2026-05-20', days: 4, stock: 12 },
      { name: 'Amoxicillin Syrup', sku: 'AMX-SYP', generic: 'Amoxicillin', category: 'Oral', batch: 'BATCH-089-C', date: '2026-05-21', days: 5, stock: 8 },
      { name: 'Dexamethasone 4mg', sku: 'DEX-004', generic: 'Dexamethasone', category: 'Injection', batch: 'BATCH-201-B', date: '2026-05-22', days: 6, stock: 25 },
      { name: 'Panadol 500mg', sku: 'PCM-499', generic: 'Paracetamol', category: 'Oral', batch: 'BATCH-039-394', date: '2026-06-01', days: 16, stock: 68 },
    ]
  }

  // Final Data Structures
  const eodProps = {
    totalRevenue,
    paidCount: paid.length,
    avgTicket,
    totalDiscount,
    discountPct,
    voidedCount: voided.length,
    pendingCount: pending.length,
    daily: dailyEOD,
    topItems,
    cashRev,
    kpayRev,
    cashPct,
    kpayPct,
    transactions: txData?.slice(0, 50) || [] // Show recent 50
  }

  const profitProps = {
    totalRevenue,
    grossProfit,
    totalCost,
    overallMargin,
    bestMarginItem: bestMarginItem?.name,
    bestMarginValue: bestMarginItem ? bestMarginItem.margin.toFixed(1) : '0',
    daily: dailyProfitChart,
    products: productProfits
  }

  const lowStockProps = {
    critical,
    low,
    reorder,
    tracked: activeProducts.length,
    items: lowStockItems
  }

  return (
    <ReportsClient
      dateFrom={fromDate.toISOString().slice(0, 10)}
      dateTo={toDate.toISOString().slice(0, 10)}
      eodData={eodProps}
      profitData={profitProps}
      lowStockData={lowStockProps}
      expiryData={expiryData}
    />
  )
}
