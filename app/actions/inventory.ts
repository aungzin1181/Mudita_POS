'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ProductFormData {
  name: string
  sku: string
  unit_price: number
  stock_qty: number
  generic_name?: string | null
  category?: string
  dosage_strength?: string | null
  unit_type?: string | null
  pack_size?: number | null
  batch_no?: string | null
  expiry_date?: string | null
  low_stock_threshold?: number
  reorder_level?: number | null
  supplier?: string | null
  manufacturer?: string | null
  prescription_required?: boolean
  is_controlled?: boolean
  is_pos_visible?: boolean
  notes?: string | null
  unit?: string
  is_active?: boolean
}

/**
 * Create a new product record.
 */
export async function createProduct(data: ProductFormData) {
  const supabase = await createClient()
  
  // NOTE: Auth check relaxed for development.
  const { data: { user } } = await supabase.auth.getUser()
  void user // unused but ensures session is refreshed

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      name: data.name,
      sku: data.sku,
      unit_price: data.unit_price,
      stock_qty: data.stock_qty,
      category: data.category || 'general',
      generic_name: data.generic_name || null,
      dosage_strength: data.dosage_strength || null,
      unit_type: data.unit_type || null,
      pack_size: data.pack_size || null,
      batch_no: data.batch_no || null,
      expiry_date: data.expiry_date || null,
      low_stock_threshold: data.low_stock_threshold ?? 10,
      reorder_level: data.reorder_level || null,
      supplier: data.supplier || null,
      manufacturer: data.manufacturer || null,
      prescription_required: data.prescription_required ?? false,
      is_controlled: data.is_controlled ?? false,
      is_pos_visible: data.is_pos_visible ?? true,
      notes: data.notes || null,
      unit: data.unit || 'unit',
      is_active: true,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/inventory')
  return product
}

/**
 * Update an existing product record.
 */
export async function updateProduct(id: string, data: Partial<ProductFormData>) {
  const supabase = await createClient()

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
