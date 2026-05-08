import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ProductEditForm from './ProductEditForm'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: product } = await supabase.from('products').select('*').eq('id', id).single()
  if (!product) notFound()

  return (
    <div className="container">
      <Link href="/inventory" className="btn" style={{ border: 'none', background: 'none', paddingLeft: 0, marginBottom: '16px' }}>
        <ArrowLeft size={16} /> Back to Inventory
      </Link>

      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <div className="page-eyebrow">Pharmacy · Inventory</div>
          <h1 className="page-title">Edit <em>{product.name}</em></h1>
        </div>
      </div>

      <ProductEditForm product={product} />
    </div>
  )
}
