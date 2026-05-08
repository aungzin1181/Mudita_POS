'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, Loader2 } from 'lucide-react'
import { createProduct } from '@/app/actions/inventory'

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)

    try {
      await createProduct({
        name: data.get('name') as string,
        sku: data.get('sku') as string,
        unit_price: parseFloat(data.get('unit_price') as string) || 0,
        stock_qty: parseInt(data.get('stock_qty') as string, 10) || 0,
        category: (data.get('category') as string) || 'general',
        batch_no: (data.get('batch_no') as string) || undefined,
        expiry_date: (data.get('expiry_date') as string) || undefined,
        low_stock_threshold: parseInt(data.get('low_stock_threshold') as string, 10) || 10,
        unit: (data.get('unit') as string) || 'unit',
      })
      router.push('/inventory')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <Link href="/inventory" className="btn" style={{ border: 'none', background: 'none', paddingLeft: 0, marginBottom: '16px' }}>
        <ArrowLeft size={16} /> Back to Inventory
      </Link>

      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <div className="page-eyebrow">Pharmacy · Inventory</div>
          <h1 className="page-title">Add <em>New Product</em></h1>
        </div>
      </div>

      {error && <div className="alert alert-red" style={{ marginBottom: '20px' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
          {/* Main */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-mono" style={{ fontSize: '14px' }}>Product Details</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input name="name" type="text" className="form-input" placeholder="e.g. Paracetamol 500mg" required />
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">SKU *</label>
                  <input name="sku" type="text" className="form-input" placeholder="PCM-500" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select name="category" className="form-input">
                    <option value="oral">Oral</option>
                    <option value="injection">Injection</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Unit Price *</label>
                  <input name="unit_price" type="number" step="0.01" min="0" className="form-input" placeholder="0.00" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <input name="unit" type="text" className="form-input" placeholder="tablet, vial, bottle…" defaultValue="unit" />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Opening Stock *</label>
                  <input name="stock_qty" type="number" min="0" className="form-input" placeholder="0" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Low Stock Threshold</label>
                  <input name="low_stock_threshold" type="number" min="0" className="form-input" placeholder="10" defaultValue="10" />
                </div>
              </div>
            </div>
          </div>

          {/* Batch & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card">
              <div className="card-header">
                <h3 className="text-mono" style={{ fontSize: '14px' }}>Batch Info</h3>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Batch Number</label>
                  <input name="batch_no" type="text" className="form-input" placeholder="BATCH-2025-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Expiry Date</label>
                  <input name="expiry_date" type="date" className="form-input" />
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
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Package size={18} />}
                  Add to Inventory
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
