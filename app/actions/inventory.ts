'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { writeAuditLog } from '@/lib/audit'

export interface ProductFormData {
  name: string
  sku: string
  unit_price: number
  buying_price?: number | null
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
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      name: data.name,
      sku: data.sku,
      unit_price: data.unit_price,
      buying_price: data.buying_price ?? null,
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

  await writeAuditLog({
    performed_by: userId,
    module: 'inventory',
    action: 'product_created',
    entity_type: 'product',
    entity_id: product.id,
    entity_label: `${data.name} (${data.sku})`,
    new_data: data as unknown as Record<string, unknown>,
  })

  revalidatePath('/inventory')
  return product
}

/**
 * Update an existing product record.
 */
export async function updateProduct(id: string, data: Partial<ProductFormData>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  // Capture previous state for the audit trail
  const { data: before } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

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

  await writeAuditLog({
    performed_by: userId,
    module: 'inventory',
    action: 'product_updated',
    entity_type: 'product',
    entity_id: id,
    entity_label: before?.name ? `${before.name} (${before.sku})` : id,
    previous_data: before as unknown as Record<string, unknown>,
    new_data: data as unknown as Record<string, unknown>,
  })

  revalidatePath('/inventory')
  return product
}

/**
 * Adjust stock by a delta (positive = restock, negative = deduct).
 */
export async function adjustStock(productId: string, delta: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  const { data: product } = await supabase
    .from('products')
    .select('stock_qty, name, sku')
    .eq('id', productId)
    .single()

  const oldQty = product?.stock_qty ?? 0
  const newQty = Math.max(0, oldQty + delta)

  const { error } = await supabase
    .from('products')
    .update({ stock_qty: newQty, updated_at: new Date().toISOString() })
    .eq('id', productId)

  if (error) throw error

  await writeAuditLog({
    performed_by: userId,
    module: 'inventory',
    action: 'stock_adjusted',
    entity_type: 'product',
    entity_id: productId,
    entity_label: product?.name ? `${product.name} (${product.sku})` : productId,
    previous_data: { stock_qty: oldQty },
    new_data: { stock_qty: newQty, delta },
  })

  revalidatePath('/inventory')
  return { success: true, newQty }
}
