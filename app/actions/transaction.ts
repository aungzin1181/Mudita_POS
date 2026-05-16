'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { UpdateItemPayload } from '@/types/pos'
import { writeAuditLog } from '@/lib/audit'

/**
 * Update a transaction item's quantity or mark as removed.
 */
export async function updateTransactionItem(
  transactionId: string,
  itemId: string,
  payload: UpdateItemPayload
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  const { data: tx } = await supabase
    .from('transactions')
    .select('id, status, total_amount, discount_amount')
    .eq('id', transactionId)
    .single()

  if (!tx || !['draft', 'open'].includes(tx.status)) {
    throw new Error('Transaction cannot be edited in its current state')
  }

  const { data: oldItem } = await supabase
    .from('transaction_items')
    .select('*')
    .eq('id', itemId)
    .single()

  await supabase
    .from('transaction_items')
    .update({ ...payload })
    .eq('id', itemId)
    .eq('transaction_id', transactionId)

  const { data: activeItems } = await supabase
    .from('transaction_items')
    .select('line_total')
    .eq('transaction_id', transactionId)
    .eq('is_removed', false)

  const subtotal = activeItems?.reduce(
    (sum, i) => sum + Number(i.line_total), 0
  ) ?? 0

  const total = subtotal - Number(tx.discount_amount)

  await supabase
    .from('transactions')
    .update({ 
      subtotal, 
      total_amount: total, 
      updated_by: userId,
      status: (activeItems?.length ?? 0) > 0 ? 'open' : 'draft',
      updated_at: new Date().toISOString()
    })
    .eq('id', transactionId)

  await writeAuditLog({
    performed_by: userId,
    module: 'pos',
    action: payload.is_removed ? 'item_removed' : 'qty_changed',
    entity_type: 'transaction',
    entity_id: transactionId,
    entity_label: `Item: ${oldItem?.description || itemId}`,
    previous_data: oldItem,
    new_data: { ...oldItem, ...payload },
  })

  revalidatePath(`/pos/transaction/${transactionId}`)
  return { success: true, subtotal, total }
}

/**
 * Apply a discount to a transaction.
 */
export async function applyDiscount(
  transactionId: string,
  discountAmount: number,
  reason: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', userId ?? '').single()

  const canApplyDirectly = !user || ['admin', 'manager'].includes(profile?.role || '')

  if (!canApplyDirectly) {
    await supabase.from('discount_requests').insert({
      transaction_id: transactionId,
      requested_by: userId,
      discount_amount: discountAmount,
      reason,
      status: 'pending',
    })
    return { status: 'pending_approval' }
  }

  const { data: tx } = await supabase
    .from('transactions').select('subtotal')
    .eq('id', transactionId).single()

  const total = Number(tx?.subtotal || 0) - discountAmount

  await supabase.from('transactions').update({
    discount_amount: discountAmount,
    discount_reason: reason,
    total_amount: total,
    updated_by: userId,
    updated_at: new Date().toISOString()
  }).eq('id', transactionId)

  await writeAuditLog({
    performed_by: userId,
    module: 'pos',
    action: 'discount_applied',
    entity_type: 'transaction',
    entity_id: transactionId,
    entity_label: `Discount: ${discountAmount}`,
    new_data: { discount_amount: discountAmount, reason },
  })

  revalidatePath(`/pos/transaction/${transactionId}`)
  return { status: 'applied', total }
}

/**
 * Finalize payment and lock the transaction.
 */
export async function markAsPaid(
  transactionId: string,
  amountPaid: number,
  paymentMethod: 'cash' | 'qr_ewallet' | 'kpay' | 'card',
  referenceNo?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  const { data: tx } = await supabase
    .from('transactions')
    .select('total_amount, status')
    .eq('id', transactionId).single()

  if (tx?.status !== 'open') throw new Error('Transaction not open')
  if (amountPaid < Number(tx.total_amount)) {
    throw new Error('Insufficient payment amount')
  }

  const change = amountPaid - Number(tx.total_amount)

  await supabase.from('transactions').update({
    status: 'paid',
    payment_method: paymentMethod,
    amount_paid: amountPaid,
    change_amount: change,
    updated_by: userId,
    notes: referenceNo ? `Ref: ${referenceNo}` : null,
    updated_at: new Date().toISOString()
  }).eq('id', transactionId)

  await writeAuditLog({
    performed_by: userId,
    module: 'pos',
    action: 'transaction_paid',
    entity_type: 'transaction',
    entity_id: transactionId,
    entity_label: `Paid: ${amountPaid}`,
    new_data: { amount_paid: amountPaid, change, paymentMethod },
  })

  revalidatePath(`/pos/transaction/${transactionId}`)
  return { success: true, change }
}

/**
 * Void a transaction.
 */
export async function voidTransaction(
  transactionId: string,
  reason: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', userId ?? '').single()

  if (user && !['admin', 'manager'].includes(profile?.role || '')) {
    throw new Error('Insufficient permissions to void')
  }

  const { data: tx } = await supabase
    .from('transactions').select('status')
    .eq('id', transactionId).single()

  if (tx?.status === 'voided') throw new Error('Already voided')

  await supabase.from('transactions').update({
    status: 'voided',
    void_reason: reason,
    voided_by: userId,
    voided_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).eq('id', transactionId)

  const { data: medItems } = await supabase
    .from('transaction_items')
    .select('product_id, quantity')
    .eq('transaction_id', transactionId)
    .eq('item_type', 'medication')
    .eq('is_removed', false)

  for (const item of medItems ?? []) {
    if (item.product_id) {
      await supabase.rpc('increment_stock', {
        product_id: item.product_id,
        qty: item.quantity,
      })
    }
  }

  await writeAuditLog({
    performed_by: userId,
    module: 'pos',
    action: 'transaction_voided',
    entity_type: 'transaction',
    entity_id: transactionId,
    entity_label: `Voided: ${reason}`,
    new_data: { reason },
  })

  revalidatePath(`/pos/transaction/${transactionId}`)
  return { success: true }
}

/**
 * Create a new transaction for a patient.
 */
export async function createTransaction(patientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  const invoiceNo = `INV-${Date.now().toString().slice(-8)}`

  const { data: tx, error } = await supabase
    .from('transactions')
    .insert({
      patient_id: patientId,
      created_by: userId,
      updated_by: userId,
      invoice_no: invoiceNo,
      status: 'draft',
      subtotal: 0,
      total_amount: 0,
    })
    .select()
    .single()

  if (error) throw error

  await writeAuditLog({
    performed_by: userId,
    module: 'pos',
    action: 'transaction_created',
    entity_type: 'transaction',
    entity_id: tx.id,
    entity_label: invoiceNo,
  })

  revalidatePath('/pos')
  return tx
}

/**
 * Add a new item to a transaction.
 */
export async function addTransactionItem(
  transactionId: string,
  payload: {
    item_type: 'consultation' | 'procedure' | 'medication';
    service_id?: string;
    product_id?: string;
    description: string;
    quantity: number;
    unit_price: number;
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  const { data: tx } = await supabase
    .from('transactions')
    .select('status, discount_amount')
    .eq('id', transactionId)
    .single()

  if (!tx || !['draft', 'open'].includes(tx.status)) {
    throw new Error('Transaction is not editable')
  }

  const { data: item, error } = await supabase
    .from('transaction_items')
    .insert({
      transaction_id: transactionId,
      ...payload
    })
    .select()
    .single()

  if (error) throw error

  const { data: activeItems } = await supabase
    .from('transaction_items')
    .select('line_total')
    .eq('transaction_id', transactionId)
    .eq('is_removed', false)

  const subtotal = activeItems?.reduce((sum, i) => sum + Number(i.line_total), 0) ?? 0
  const total = subtotal - Number(tx.discount_amount)

  await supabase
    .from('transactions')
    .update({ 
      subtotal, 
      total_amount: total, 
      status: 'open',
      updated_by: userId,
      updated_at: new Date().toISOString()
    })
    .eq('id', transactionId)

  await writeAuditLog({
    performed_by: userId,
    module: 'pos',
    action: 'item_added',
    entity_type: 'transaction',
    entity_id: transactionId,
    entity_label: `Item: ${payload.description}`,
    new_data: item
  })

  revalidatePath(`/pos/transaction/${transactionId}`)
  return { success: true, item }
}

/**
 * Associate a doctor with a transaction.
 */
export async function setTransactionDoctor(transactionId: string, doctorId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  // Update transaction
  const { data: doctor } = await supabase.from('doctors').select('*').eq('id', doctorId).single()
  if (!doctor) throw new Error('Doctor not found')

  const { error: updateError } = await supabase
    .from('transactions')
    .update({ 
      doctor_id: doctorId,
      updated_by: userId,
      updated_at: new Date().toISOString()
    })
    .eq('id', transactionId)

  if (updateError) throw updateError

  // Check if consultation fee already exists
  const { data: existingItems } = await supabase
    .from('transaction_items')
    .select('id')
    .eq('transaction_id', transactionId)
    .eq('description', `Consultation - ${doctor.full_name}`)
    .eq('is_removed', false)

  if (!existingItems || existingItems.length === 0) {
    // Add doctor's consultation fee as an item
    await addTransactionItem(transactionId, {
      item_type: 'consultation',
      description: `Consultation - ${doctor.full_name}`,
      quantity: 1,
      unit_price: Number(doctor.consultation_fee) || 0
    })
  }

  revalidatePath(`/pos/transaction/${transactionId}`)
  return { success: true }
}

/**
 * Discard an empty draft transaction if the user exits without touching it.
 */
export async function discardEmptyDraft(transactionId: string) {
  const supabase = await createClient()

  // Verify it's still a draft
  const { data: tx } = await supabase
    .from('transactions')
    .select('status')
    .eq('id', transactionId)
    .single()

  if (!tx || tx.status !== 'draft') {
    return { success: false, reason: 'not_draft' }
  }

  // Double check no active items exist
  const { data: items } = await supabase
    .from('transaction_items')
    .select('id')
    .eq('transaction_id', transactionId)
    .eq('is_removed', false)

  if (items && items.length > 0) {
    return { success: false, reason: 'has_items' }
  }

  // Delete the draft completely
  await supabase.from('transactions').delete().eq('id', transactionId)

  revalidatePath('/pos')
  return { success: true }
}
