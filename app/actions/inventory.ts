'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ProductFormData {
  name: string
  sku: string
  unit_price: number
  stock_qty: number
  category?: string
  batch_no?: string
  expiry_date?: string
  low_stock_threshold?: number
  unit?: string
  is_active?: boolean
}

export async function createProduct(data: ProductFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      name: data.name,
      sku: data.sku,
      unit_price: data.unit_price,
      stock_qty: data.stock_qty,
      category: data.category || 'general',
      batch_no: data.batch_no || null,
      expiry_date: data.expiry_date || null,
      low_stock_threshold: data.low_stock_threshold ?? 10,
      unit: data.unit || 'unit',
      is_active: true,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/inventory')
  return product
}

export async function updateProduct(id: string, data: Partial<ProductFormData>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { data: product, error } = await supabase
    .from('products')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/inventory')
  return product
}

/**
 * Adjust stock by a delta (positive = restock, negative = deduct).
 */
export async function adjustStock(productId: string, delta: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { data: product } = await supabase
    .from('products')
    .select('stock_qty')
    .eq('id', productId)
    .single()

  const newQty = Math.max(0, (product?.stock_qty ?? 0) + delta)

  const { error } = await supabase
    .from('products')
    .update({ stock_qty: newQty, updated_at: new Date().toISOString() })
    .eq('id', productId)

  if (error) throw error
  revalidatePath('/inventory')
  return { success: true, newQty }
}
