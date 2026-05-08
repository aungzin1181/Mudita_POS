'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Product } from '@/types/pos'
import { updateProduct } from '@/app/actions/inventory'
import { Save, Loader2 } from 'lucide-react'

export default function ProductEditForm({ product }: { product: Product }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    const form = e.currentTarget
    const data = new FormData(form)

    try {
      await updateProduct(product.id, {
        name: data.get('name') as string,
        sku: data.get('sku') as string,
        unit_price: parseFloat(data.get('unit_price') as string) || 0,
        stock_qty: parseInt(data.get('stock_qty') as string, 10) || 0,
        category: (data.get('category') as string) || 'general',
        batch_no: (data.get('batch_no') as string) || undefined,
        expiry_date: (data.get('expiry_date') as string) || undefined,
        low_stock_threshold: parseInt(data.get('low_stock_threshold') as string, 10) || 10,
        unit: (data.get('unit') as string) || 'unit',
        is_active: data.get('is_active') === 'true',
      })
      setSuccess(true)
      setTimeout(() => router.push('/inventory'), 1200)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="text-mono" style={{ fontSize: '14px' }}>Product Details</h3>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-red" style={{ marginBottom: '16px' }}>{error}</div>}
            {success && <div className="alert alert-green" style={{ marginBottom: '16px' }}>✓ Saved! Redirecting…</div>}

            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input name="name" type="text" className="form-input" defaultValue={product.name} required />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">SKU *</label>
                <input name="sku" type="text" className="form-input" defaultValue={product.sku} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select name="category" className="form-input" defaultValue={product.category || 'general'}>
                  <option value="oral">Oral</option>
                  <option value="injection">Injection</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Unit Price</label>
                <input name="unit_price" type="number" step="0.01" min="0" className="form-input" defaultValue={product.unit_price} />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <input name="unit" type="text" className="form-input" defaultValue={product.unit || 'unit'} />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Stock Qty</label>
                <input name="stock_qty" type="number" min="0" className="form-input" defaultValue={product.stock_qty} />
              </div>
              <div className="form-group">
                <label className="form-label">Low Stock Threshold</label>
                <input name="low_stock_threshold" type="number" min="0" className="form-input" defaultValue={product.low_stock_threshold ?? 10} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select name="is_active" className="form-input" defaultValue={product.is_active ? 'true' : 'false'}>
                <option value="true">Active</option>
                <option value="false">Inactive (hidden from POS)</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="text-mono" style={{ fontSize: '14px' }}>Batch Info</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Batch Number</label>
                <input name="batch_no" type="text" className="form-input" defaultValue={product.batch_no || ''} />
              </div>
              <div className="form-group">
                <label className="form-label">Expiry Date</label>
                <input name="expiry_date" type="date" className="form-input" defaultValue={product.expiry_date || ''} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={loading}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
