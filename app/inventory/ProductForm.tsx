'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createProduct, updateProduct, ProductFormData } from '@/app/actions/inventory'
import { Product } from '@/types/pos'
import './product-form.css'
import { Loader2, ArrowLeft } from 'lucide-react'

export default function ProductForm({ initialData }: { initialData?: Product }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stockQty, setStockQty] = useState(initialData?.stock_qty || 0)

  // Live summary states
  const [name, setName] = useState(initialData?.name || '')
  const [generic, setGeneric] = useState(initialData?.generic_name || '')
  const [strength, setStrength] = useState(initialData?.dosage_strength || '')
  const [unitType, setUnitType] = useState(initialData?.unit_type || 'Tablet')
  const [price, setPrice] = useState(initialData?.unit_price || 0)
  const [buyingPrice, setBuyingPrice] = useState<number | ''>(initialData?.buying_price ?? '')
  const [expiry, setExpiry] = useState(initialData?.expiry_date || '')
  const [rx, setRx] = useState(initialData?.prescription_required || false)
  const [status, setStatus] = useState(initialData?.is_active ?? true)

  const isEdit = !!initialData

  const maxStock = Math.max(stockQty, 200)
  const stockPct = Math.min(100, (stockQty / maxStock) * 100)
  const stockColor = stockQty < 10 ? '#c0392b' : stockQty < 30 ? '#d97706' : '#2a7a9e'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)

    const payload: ProductFormData = {
      name: data.get('name') as string,
      generic_name: data.get('generic_name') as string || null,
      sku: data.get('sku') as string,
      category: data.get('category') as string,
      dosage_strength: data.get('dosage_strength') as string || null,
      unit_type: data.get('unit_type') as string,
      pack_size: parseInt(data.get('pack_size') as string) || null,
      unit_price: parseFloat(data.get('unit_price') as string) || 0,
      buying_price: parseFloat(data.get('buying_price') as string) || null,
      stock_qty: parseInt(data.get('stock_qty') as string) || 0,
      low_stock_threshold: parseInt(data.get('low_stock_threshold') as string) || 10,
      reorder_level: parseInt(data.get('reorder_level') as string) || null,
      batch_no: data.get('batch_no') as string || null,
      expiry_date: data.get('expiry_date') as string || null,
      supplier: data.get('supplier') as string || null,
      manufacturer: data.get('manufacturer') as string || null,
      prescription_required: data.get('prescription_required') === 'on',
      is_controlled: data.get('is_controlled') === 'on',
      is_pos_visible: data.get('is_pos_visible') === 'on',
      notes: data.get('notes') as string || null,
      is_active: data.get('status') === 'Active',
      unit: data.get('unit_type') as string,
    }

    try {
      if (isEdit) {
        await updateProduct(initialData.id, payload)
      } else {
        await createProduct(payload)
      }
      router.push('/inventory')
    } catch (err: any) {
      setError(err.message || 'Failed to save product')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>


      <div className="pf-page" style={{ paddingTop: '0' }}>
        <div className="page-header" style={{ marginBottom: '24px' }}>
          <div>
            <Link href="/inventory" className="btn" style={{ border: 'none', background: 'none', paddingLeft: 0, marginBottom: '12px' }}>
              <ArrowLeft size={16} /> Back to Inventory
            </Link>
            <div className="page-eyebrow">Pharmacy · Inventory</div>
            <h1 className="page-title">{isEdit ? <>Edit <em>Product</em></> : <>Add <em>New Product</em></>}</h1>
            <p className="pf-page-sub" style={{ margin: 0 }}>
              {isEdit ? `SKU: ${initialData.sku} · Last updated ${new Date(initialData.updated_at || Date.now()).toLocaleDateString()}` : 'Fill in product details to add to inventory'}
            </p>
          </div>
        </div>

        {error && <div className="alert alert-red">{error}</div>}

        <div className="pf-layout">
          {/* LEFT */}
          <div>
            {/* Product Details */}
            <div className="pf-card">
              <div className="pf-card-head">
                <div className="pf-card-icon pf-ci-blue">💊</div>
                <div><div className="pf-card-title">Product Details</div><div className="pf-card-desc">Basic identification and pricing</div></div>
              </div>
              <div className="pf-card-body">
                <div className="pf-row pf-r2">
                  <div className="pf-field">
                    <label className="pf-lbl">Brand / Product Name <span className="pf-req">*</span></label>
                    <input name="name" className="pf-inp" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Panadol" required />
                    <span className="pf-hint">Commercial name shown in POS</span>
                  </div>
                  <div className="pf-field">
                    <label className="pf-lbl">Generic Name </label>
                    <input name="generic_name" className="pf-inp" type="text" value={generic} onChange={e => setGeneric(e.target.value)} placeholder="e.g. Paracetamol" />
                    <span className="pf-hint">Active ingredient / INN name</span>
                  </div>
                </div>

                <div className="pf-row pf-r3">
                  <div className="pf-field">
                    <label className="pf-lbl">SKU <span className="pf-req">*</span></label>
                    <input name="sku" className="pf-inp" type="text" defaultValue={initialData?.sku} style={{ fontFamily: 'var(--mono)', fontSize: '12px' }} required />
                  </div>
                  <div className="pf-field">
                    <label className="pf-lbl">Category <span className="pf-req">*</span></label>
                    <select name="category" className="pf-sel" defaultValue={initialData?.category || 'oral'}>
                      <option value="oral">Oral</option>
                      <option value="injection">Injection</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                  <div className="pf-field">
                    <label className="pf-lbl">Dosage / Strength </label>
                    <input name="dosage_strength" className="pf-inp" type="text" value={strength} onChange={e => setStrength(e.target.value)} placeholder="e.g. 500mg" />
                  </div>
                </div>

                <div className="pf-row pf-r3">
                  <div className="pf-field">
                    <label className="pf-lbl">Unit Type <span className="pf-req">*</span> </label>
                    <select name="unit_type" className="pf-sel" value={unitType} onChange={e => setUnitType(e.target.value)}>
                      <option>Tablet</option>
                      <option>Capsule</option>
                      <option>Vial</option>
                      <option>Ampule</option>
                      <option>Bottle</option>
                      <option>Sachet</option>
                      <option>Strip</option>
                      <option>ml</option>
                      <option>unit</option>
                    </select>
                    <span className="pf-hint">Dispensing unit</span>
                  </div>
                  <div className="pf-field">
                    <label className="pf-lbl">Pack Size </label>
                    <div className="pf-ig">
                      <span className="pf-ig-pre">per box</span>
                      <input name="pack_size" className="pf-inp" type="number" defaultValue={initialData?.pack_size || ''} placeholder="100" />
                    </div>
                    <span className="pf-hint">Units per package</span>
                  </div>
                  <div className="pf-field">
                    <label className="pf-lbl">Unit Price <span className="pf-req">*</span></label>
                    <div className="pf-ig">
                      <span className="pf-ig-pre">MMK</span>
                      <input name="unit_price" className="pf-inp" type="number" value={price || ''} onChange={e => setPrice(parseFloat(e.target.value) || 0)} required />
                    </div>
                  </div>
                  <div className="pf-field">
                    <label className="pf-lbl">Buying Price</label>
                    <div className="pf-ig">
                      <span className="pf-ig-pre">MMK</span>
                      <input name="buying_price" className="pf-inp" type="number" value={buyingPrice} onChange={e => setBuyingPrice(parseFloat(e.target.value) || '')} placeholder="Cost price" />
                    </div>
                    <span className="pf-hint">Purchase / cost price per unit</span>
                  </div>
                </div>

                <div className="pf-row pf-r1">
                  <div className="pf-field">
                    <label className="pf-lbl">Status</label>
                    <select name="status" className="pf-sel" style={{ maxWidth: '220px' }} value={status ? 'Active' : 'Inactive'} onChange={e => setStatus(e.target.value === 'Active')}>
                      <option>Active</option>
                      <option>Inactive</option>
                      <option>Discontinued</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Info */}
            <div className="pf-card">
              <div className="pf-card-head">
                <div className="pf-card-icon pf-ci-green">📦</div>
                <div><div className="pf-card-title">Stock Information</div><div className="pf-card-desc">Inventory levels and alert thresholds</div></div>
              </div>
              <div className="pf-card-body">
                <div className="pf-row pf-r3">
                  <div className="pf-field">
                    <label className="pf-lbl">Stock Qty <span className="pf-req">*</span></label>
                    <input name="stock_qty" className="pf-inp" type="number" value={stockQty} onChange={e => setStockQty(parseInt(e.target.value) || 0)} required />
                    <div className="pf-s-bar"><div className="pf-s-fill" style={{ width: `${stockPct}%`, background: stockColor }}></div></div>
                    <div className="pf-s-lbls"><span>0</span><span>{stockQty} / {maxStock}</span></div>
                  </div>
                  <div className="pf-field">
                    <label className="pf-lbl">Low Stock Alert</label>
                    <input name="low_stock_threshold" className="pf-inp" type="number" defaultValue={initialData?.low_stock_threshold ?? 10} placeholder="10" />
                    <span className="pf-hint">Warn when stock falls below</span>
                  </div>
                  <div className="pf-field">
                    <label className="pf-lbl">Reorder Level </label>
                    <input name="reorder_level" className="pf-inp" type="number" defaultValue={initialData?.reorder_level || ''} placeholder="30" />
                    <span className="pf-hint">Suggested restock trigger</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Batch & Supplier */}
            <div className="pf-card">
              <div className="pf-card-head">
                <div className="pf-card-icon pf-ci-amber">🏭</div>
                <div><div className="pf-card-title">Batch & Supplier</div><div className="pf-card-desc">Traceability and procurement</div></div>
              </div>
              <div className="pf-card-body">
                <div className="pf-sec-lbl">Batch Information</div>
                <div className="pf-row pf-r2">
                  <div className="pf-field">
                    <label className="pf-lbl">Batch Number</label>
                    <input name="batch_no" className="pf-inp" type="text" defaultValue={initialData?.batch_no || ''} style={{ fontFamily: 'var(--mono)', fontSize: '12px' }} />
                  </div>
                  <div className="pf-field">
                    <label className="pf-lbl">Expiry Date</label>
                    <input name="expiry_date" className="pf-inp" type="date" value={expiry} onChange={e => setExpiry(e.target.value)} />
                  </div>
                </div>
                <div className="pf-dvd" />
                <div className="pf-sec-lbl">Supplier / Manufacturer</div>
                <div className="pf-row pf-r2">
                  <div className="pf-field">
                    <label className="pf-lbl">Supplier Name </label>
                    <input name="supplier" className="pf-inp" type="text" defaultValue={initialData?.supplier || ''} placeholder="e.g. ABC Pharma Ltd" />
                  </div>
                  <div className="pf-field">
                    <label className="pf-lbl">Manufacturer </label>
                    <input name="manufacturer" className="pf-inp" type="text" defaultValue={initialData?.manufacturer || ''} placeholder="e.g. GlaxoSmithKline" />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="pf-card">
              <div className="pf-card-head">
                <div className="pf-card-icon pf-ci-purple">📝</div>
                <div><div className="pf-card-title">Notes & Storage</div><div className="pf-card-desc">Handling instructions for staff</div></div>
              </div>
              <div className="pf-card-body">
                <div className="pf-field">
                  <label className="pf-lbl">Description / Storage Notes </label>
                  <textarea name="notes" className="pf-ta" defaultValue={initialData?.notes || ''} placeholder="Store below 30°C. Keep away from moisture..."></textarea>
                  <span className="pf-hint">Displayed as a tooltip in POS when staff hover over this product</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div>
            {/* Clinical Flags */}
            <div className="pf-card">
              <div className="pf-card-head">
                <div className="pf-card-icon pf-ci-purple">🔐</div>
                <div><div className="pf-card-title">Clinical Flags</div><div className="pf-card-desc">Prescription & dispensing rules</div></div>
              </div>
              <div className="pf-card-body">
                <div className="pf-tog-row">
                  <div>
                    <div className="pf-tog-lbl">Prescription Required </div>
                    <div className="pf-tog-desc">Doctor order needed to dispense</div>
                  </div>
                  <label className="pf-tog"><input name="prescription_required" type="checkbox" checked={rx} onChange={e => setRx(e.target.checked)} /><span className="pf-tog-sl"></span></label>
                </div>
                <div className="pf-tog-row">
                  <div>
                    <div className="pf-tog-lbl">Controlled Medicine </div>
                    <div className="pf-tog-desc">Special logging per dispense</div>
                  </div>
                  <label className="pf-tog"><input name="is_controlled" type="checkbox" defaultChecked={initialData?.is_controlled} /><span className="pf-tog-sl"></span></label>
                </div>
                <div className="pf-tog-row">
                  <div>
                    <div className="pf-tog-lbl">Visible in POS Search</div>
                    <div className="pf-tog-desc">Cashier can add this item</div>
                  </div>
                  <label className="pf-tog"><input name="is_pos_visible" type="checkbox" defaultChecked={initialData?.is_pos_visible ?? true} /><span className="pf-tog-sl"></span></label>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="pf-card">
              <div className="pf-card-head">
                <div className="pf-card-icon pf-ci-blue">📋</div>
                <div><div className="pf-card-title">Quick Summary</div><div className="pf-card-desc">Live key details preview</div></div>
              </div>
              <div className="pf-card-body">
                <div className="pf-sum-row"><span style={{ color: 'var(--muted)' }}>Brand</span><span className="pf-sum-val">{name || '—'}</span></div>
                <div className="pf-sum-row"><span style={{ color: 'var(--muted)' }}>Generic</span><span className="pf-sum-val" style={{ color: 'var(--accent)' }}>{generic || '—'}</span></div>
                <div className="pf-sum-row"><span style={{ color: 'var(--muted)' }}>Strength</span><span className="pf-sum-val">{strength || '—'} · {unitType}</span></div>
                <div className="pf-sum-row"><span style={{ color: 'var(--muted)' }}>Selling Price</span><span className="pf-sum-val">MMK {price.toLocaleString()}</span></div>
                <div className="pf-sum-row"><span style={{ color: 'var(--muted)' }}>Buying Price</span><span className="pf-sum-val" style={{ color: buyingPrice ? 'var(--green)' : 'var(--muted)' }}>{buyingPrice ? `MMK ${Number(buyingPrice).toLocaleString()}` : '—'}</span></div>
                <div className="pf-sum-row"><span style={{ color: 'var(--muted)' }}>Stock</span><span className="pf-sum-val" style={{ color: stockColor }}>{stockQty} {unitType}s</span></div>
                <div className="pf-sum-row"><span style={{ color: 'var(--muted)' }}>Expiry</span><span className="pf-sum-val">{expiry ? new Date(expiry).toLocaleDateString() : '—'}</span></div>
                <div className="pf-sum-row"><span style={{ color: 'var(--muted)' }}>Rx</span><span className="pf-sum-val" style={{ color: 'var(--muted)' }}>{rx ? 'Required' : 'Not required'}</span></div>
                <div className="pf-sum-row"><span style={{ color: 'var(--muted)' }}>Status</span><span><span className={status ? "pf-dot pf-dot-on" : "pf-dot pf-dot-off"}></span><span style={{ fontSize: '12px', fontWeight: 600, color: status ? 'var(--green)' : 'var(--muted)' }}>{status ? 'Active' : 'Inactive'}</span></span></div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <Link href="/inventory" className="btn" style={{ flex: 1, justifyContent: 'center' }}>Discard</Link>
              <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
