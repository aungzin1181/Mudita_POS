import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Package, AlertTriangle } from 'lucide-react';
import InventoryActions from './InventoryActions';

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const supabase = await createClient();
  const { q, filter } = await searchParams;

  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
  }

  if (filter === 'low') {
    // NOTE: PostgREST can compare columns with .filter using raw SQL via rpc,
    // so we do a manual client-side filter after fetch for simplicity
  }

  const { data: allProducts } = await query;

  const products = filter === 'low'
    ? allProducts?.filter((p) => p.stock_qty <= (p.low_stock_threshold ?? 10))
    : filter === 'expiring'
    ? allProducts?.filter((p) => {
        if (!p.expiry_date) return false;
        const days = Math.ceil((new Date(p.expiry_date).getTime() - Date.now()) / 86400000);
        return days >= 0 && days <= 90;
      })
    : allProducts;

  const lowCount = allProducts?.filter((p) => p.stock_qty <= (p.low_stock_threshold ?? 10)).length ?? 0;
  
  const expiringCount = allProducts?.filter((p) => {
    if (!p.expiry_date) return false;
    const days = Math.ceil((new Date(p.expiry_date).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 90;
  }).length ?? 0;

  // Stats
  const totalItems = allProducts?.length ?? 0;
  const totalValue = allProducts?.reduce((sum, p) => sum + p.stock_qty * Number(p.unit_price), 0) ?? 0;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Pharmacy</div>
          <h1 className="page-title">Inventory <em>Management</em></h1>
        </div>
        <Link href="/inventory/new" className="btn btn-primary">
          <Plus size={18} /> Add Product
        </Link>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
        <div className="stat-card stat-card-accent">
          <div className="stat-label">Total SKUs</div>
          <div className="stat-value">{totalItems}</div>
          <div className="stat-sub">Active products</div>
        </div>
        <div className="stat-card stat-card-green">
          <div className="stat-label">Stock Value</div>
          <div className="stat-value">{totalValue.toLocaleString()} MMK</div>
          <div className="stat-sub">At selling price</div>
        </div>
        <div className={`stat-card ${lowCount > 0 ? 'stat-card-red' : 'stat-card-green'}`}>
          <div className="stat-label">Low Stock Items</div>
          <div className="stat-value">{lowCount}</div>
          <div className="stat-sub">{lowCount > 0 ? 'Action required' : 'All stocked'}</div>
        </div>
        <div className={`stat-card ${expiringCount > 0 ? 'stat-card-amber' : 'stat-card-green'}`}>
          <div className="stat-label">Expiring Soon</div>
          <div className="stat-value">{expiringCount}</div>
          <div className="stat-sub">{expiringCount > 0 ? 'Within 90 days' : 'No near expiries'}</div>
        </div>
      </div>

      {lowCount > 0 && !filter && (
        <div className="alert alert-amber" style={{ marginBottom: '12px' }}>
          <AlertTriangle size={16} />
          <span>
            {lowCount} item{lowCount > 1 ? 's are' : ' is'} running low.{' '}
            <Link href="/inventory?filter=low" style={{ color: 'inherit', fontWeight: 600 }}>View low stock →</Link>
          </span>
        </div>
      )}
      
      {expiringCount > 0 && !filter && (
        <div className="alert alert-amber" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={16} />
          <span>
            {expiringCount} item{expiringCount > 1 ? 's are' : ' is'} expiring within 90 days.{' '}
            <Link href="/inventory?filter=expiring" style={{ color: 'inherit', fontWeight: 600 }}>View expiring items →</Link>
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-body" style={{ padding: '14px 16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <form method="GET" style={{ display: 'flex', gap: '10px', flex: 1 }}>
            <input name="filter" type="hidden" value={filter || ''} />
            <input name="q" defaultValue={q} placeholder="Search by name or SKU…" className="form-input" style={{ flex: 1 }} />
            <button type="submit" className="btn btn-primary">Search</button>
            {(q || filter) && <Link href="/inventory" className="btn">Clear</Link>}
          </form>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/inventory" className={`btn btn-sm ${!filter ? 'btn-primary' : ''}`}>All</Link>
            <Link href="/inventory?filter=low" className={`btn btn-sm ${filter === 'low' ? 'btn-primary' : ''}`}>Low Stock</Link>
            <Link href="/inventory?filter=expiring" className={`btn btn-sm ${filter === 'expiring' ? 'btn-primary' : ''}`}>Expiring (90d)</Link>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-mono" style={{ fontSize: '14px' }}>
            {filter === 'low' ? '⚠️ Low Stock Items' : filter === 'expiring' ? '⚠️ Expiring Items' : 'Product Catalog'}
          </h3>
          <span className="text-muted text-mono" style={{ fontSize: '12px' }}>{products?.length ?? 0} items</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {products && products.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Buying Price</th>
                  <th>Unit Price</th>
                  <th>Stock</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isLow = p.stock_qty <= (p.low_stock_threshold ?? 10);
                  const isExpiringSoon = p.expiry_date && (() => {
                    const days = Math.ceil((new Date(p.expiry_date).getTime() - Date.now()) / 86400000);
                    return days >= 0 && days <= 90;
                  })();
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td className="text-mono" style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>{p.sku}</td>
                      <td>
                        {p.category && (
                          <span className="badge" style={{ background: 'var(--purple-soft)', color: 'var(--purple)', textTransform: 'capitalize' }}>
                            {p.category}
                          </span>
                        )}
                      </td>
                      <td className="text-mono" style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
                        {p.buying_price != null ? `${Number(p.buying_price).toLocaleString()} MMK` : <span style={{ color: 'var(--muted)' }}>—</span>}
                      </td>
                      <td className="text-mono">{Number(p.unit_price).toLocaleString()} MMK</td>
                      <td>
                        <span className={`badge badge-${isLow ? 'low' : 'ok'}`}>{p.stock_qty} {p.unit || 'unit'}</span>
                      </td>
                      <td className="text-mono" style={{ fontSize: '12px', color: isExpiringSoon ? 'var(--amber)' : 'var(--ink-muted)' }}>
                        {p.expiry_date ? new Date(p.expiry_date).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        {isExpiringSoon ? (
                          <span className="badge badge-expiring">Expiring</span>
                        ) : isLow ? (
                          <span className="badge badge-low">Low</span>
                        ) : (
                          <span className="badge badge-ok">OK</span>
                        )}
                      </td>
                      <td>
                        <InventoryActions product={p} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Package size={48} style={{ margin: '0 auto', display: 'block', color: 'var(--ink-muted)' }} />
              </div>
              <div className="empty-state-title">No products found</div>
              <div className="empty-state-sub">
                {q ? `No results for "${q}"` : 'Add your first product to manage inventory.'}
              </div>
              <Link href="/inventory/new" className="btn btn-primary"><Plus size={16} /> Add Product</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
