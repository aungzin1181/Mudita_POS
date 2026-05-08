import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Users, Search } from 'lucide-react';

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const { q } = await searchParams;

  let query = supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });

  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,patient_no.ilike.%${q}%,phone_no.ilike.%${q}%`
    );
  }

  const { data: patients } = await query;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Medical Records</div>
          <h1 className="page-title">
            Patient <em>Registry</em>
          </h1>
        </div>
        <Link href="/patients/new" className="btn btn-primary">
          <Plus size={18} />
          Register Patient
        </Link>
      </div>

      {/* SEARCH */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-body" style={{ padding: '16px' }}>
          <form method="GET" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="search-box" style={{ flex: 1 }}>
              <span className="search-box-icon"><Search size={16} /></span>
              <input
                name="q"
                defaultValue={q}
                placeholder="Search by name, patient number, or phone…"
                className="form-input"
                style={{ paddingLeft: '38px' }}
              />
            </div>
            <button type="submit" className="btn btn-primary">Search</button>
            {q && <Link href="/patients" className="btn">Clear</Link>}
          </form>
        </div>
      </div>

      {/* TABLE */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-mono" style={{ fontSize: '14px' }}>Patients</h3>
          <span className="text-muted text-mono" style={{ fontSize: '12px' }}>
            {patients?.length ?? 0} records
          </span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {patients && patients.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Patient No</th>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Age</th>
                  <th>Phone</th>
                  <th>Blood Type</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td className="text-mono" style={{ color: 'var(--accent)', fontWeight: 500 }}>
                      {p.patient_no}
                    </td>
                    <td style={{ fontWeight: 500 }}>{p.full_name}</td>
                    <td className="text-muted" style={{ textTransform: 'capitalize' }}>
                      {p.gender}
                    </td>
                    <td className="text-mono">
                      {p.age ? `${p.age} yrs` : '—'}
                    </td>
                    <td className="text-mono">{p.phone_no || '—'}</td>
                    <td>
                      {p.blood_type ? (
                        <span className="badge badge-open">{p.blood_type}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link href={`/patients/${p.id}`} className="btn btn-sm">
                          View
                        </Link>
                        <Link href={`/pos/new?patient_id=${p.id}&patient_name=${encodeURIComponent(p.full_name)}`} className="btn btn-sm btn-primary">
                          + Transaction
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Users size={48} style={{ margin: '0 auto', display: 'block', color: 'var(--ink-muted)' }} />
              </div>
              <div className="empty-state-title">No patients found</div>
              <div className="empty-state-sub">
                {q ? `No results for "${q}"` : 'Register your first patient to get started.'}
              </div>
              <Link href="/patients/new" className="btn btn-primary">
                <Plus size={16} /> Register Patient
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
