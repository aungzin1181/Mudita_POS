import { createClient } from '@/lib/supabase/server'
import AddServiceForm from './AddServiceForm'
import ServiceRow from './ServiceRow'
import { Stethoscope, Activity } from 'lucide-react'

export default async function ServicesPage() {
  const supabase = await createClient()

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .order('type', { ascending: true })
    .order('name', { ascending: true })

  const consultations = services?.filter((s) => s.type === 'consultation') ?? []
  const procedures = services?.filter((s) => s.type === 'procedure') ?? []

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Clinic Configuration</div>
          <h1 className="page-title">Service <em>Catalog</em></h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>
        {/* LEFT: Two tables */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Consultations */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <Stethoscope size={16} style={{ color: 'var(--accent)' }} />
                <span className="text-mono">Consultations</span>
              </h3>
              <span className="badge badge-open">{consultations.length}</span>
            </div>
            <div style={{ padding: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Default Price</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {consultations.map((s) => (
                    <ServiceRow key={s.id} service={s} />
                  ))}
                  {consultations.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--ink-muted)', fontSize: '13px' }}>
                        No consultations added yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Procedures */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <Activity size={16} style={{ color: 'var(--purple)' }} />
                <span className="text-mono">Procedures</span>
              </h3>
              <span className="badge" style={{ background: 'var(--purple-soft)', color: 'var(--purple)' }}>
                {procedures.length}
              </span>
            </div>
            <div style={{ padding: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Default Price</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {procedures.map((s) => (
                    <ServiceRow key={s.id} service={s} />
                  ))}
                  {procedures.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--ink-muted)', fontSize: '13px' }}>
                        No procedures added yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: Add form */}
        <AddServiceForm />
      </div>
    </div>
  )
}
