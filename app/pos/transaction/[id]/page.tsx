import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Transaction, TransactionItem, Service, Product, Doctor } from '@/types/pos'
import ItemList from '@/components/pos/ItemList'
import ShoppingCart from '@/components/pos/ShoppingCart'
import PaymentPanel from '@/components/pos/PaymentPanel'
import TransactionHeader from '@/components/pos/TransactionHeader'
import TransactionBackButton from './TransactionBackButton'
import { getSetting } from '@/app/actions/settings'

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  // 1. Fetch transaction details
  const { data: tx } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single()

  if (!tx) notFound()

  // 2. Fetch items (non-removed)
  const { data: items } = await supabase
    .from('transaction_items')
    .select('*')
    .eq('transaction_id', id)
    .eq('is_removed', false)

  // 3. Fetch available services, products, and doctors
  const [
    { data: services },
    { data: products },
    { data: doctors },
    { data: patient },
    autoConsultationFeeStr
  ] = await Promise.all([
    supabase.from('services').select('*').eq('is_active', true),
    supabase.from('products').select('*').eq('is_active', true),
    supabase.from('doctors').select('*').eq('is_active', true),
    supabase.from('patients').select('*').eq('id', tx.patient_id).single(),
    getSetting('auto_consultation_fee', 'true')
  ])

  const autoConsultationFee = autoConsultationFeeStr === 'true'

  const isEditable = ['draft', 'open'].includes(tx.status)

  return (
    <div className="container" style={{ maxWidth: '1400px' }}>
      <div className="flex justify-between items-center mb-4">
        <TransactionBackButton transactionId={id} status={tx.status} />
        <div className="text-mono text-muted" style={{ fontSize: '12px' }}>
          Transaction ID: {id}
        </div>
      </div>

      <TransactionHeader 
        transaction={tx as Transaction} 
        patient={patient} 
        doctors={(doctors || []) as Doctor[]} 
      />

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 420px', 
        gap: '24px', 
        alignItems: 'start', 
        marginTop: '20px' 
      }}>
        {/* LEFT: Catalog Selector only */}
        <div>
          <ItemList
            transactionId={id}
            isEditable={isEditable}
            services={(services || []) as Service[]}
            products={(products || []) as Product[]}
          />
        </div>

        {/* RIGHT: Shopping Cart (top) → Bill Summary & Payment (bottom) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <ShoppingCart
            transactionId={id}
            items={(items || []) as TransactionItem[]}
            isEditable={isEditable}
            autoConsultationFee={autoConsultationFee}
            doctors={(doctors || []) as Doctor[]}
            transaction={tx as Transaction}
          />
          <PaymentPanel transaction={tx as Transaction} />
        </div>
      </div>
    </div>
  )
}
