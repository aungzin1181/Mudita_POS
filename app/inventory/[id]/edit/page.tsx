import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProductForm from '../../ProductForm'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: product } = await supabase.from('products').select('*').eq('id', id).single()
  if (!product) notFound()

  return <ProductForm initialData={product} />
}
