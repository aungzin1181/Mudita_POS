import { Suspense } from 'react'
import NewTransactionForm from './NewTransactionForm'
import { Loader2 } from 'lucide-react'

export default function NewTransactionPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}>
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      }
    >
      <NewTransactionForm />
    </Suspense>
  )
}
