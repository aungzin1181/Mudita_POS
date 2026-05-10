import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Stethoscope, Search } from 'lucide-react';

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const { q } = await searchParams;

  let query = supabase.from('doctors').select('*').order('full_name', { ascending: true });
  if (q) {
    query = query.or(`full_name.ilike.%${q}%,specialization.ilike.%${q}%,doctor_no.ilike.%${q}%`);
  }
  const { data: doctors } = await query;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Staff</div>
          <h1 className="page-title">Doctor <em>Registry</em></h1>
        </div>
        <Link href="/doctors/new" className="btn btn-primary">
          <Plus size={18} /> Add Doctor
        </Link>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-body" style={{ padding: '16px' }}>
          <form method="GET" style={{ display: 'flex', gap: '12px' }}>
            <div className="search-box" style={{ flex: 1 }}>
              <span className="search-box-icon"><Search size={16} /></span>
              <input name="q" defaultValue={q} placeholder="Search by name or specialization…" className="form-input" style={{ paddingLeft: '38px' }} />
            </div>
            <button type="submit" className="btn btn-primary">Search</button>
            {q && <Link href="/doctors" className="btn">Clear</Link>}
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-mono" style={{ fontSize: '14px' }}>Doctors</h3>
          <span className="text-muted text-mono" style={{ fontSize: '12px' }}>{doctors?.length ?? 0} staff</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {doctors && doctors.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Doctor No</th>
                  <th>Name</th>
                  <th>Specialization</th>
                  <th>License No</th>
                  <th>Consult Fee</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d.id}>
                    <td className="text-mono" style={{ color: 'var(--accent)', fontWeight: 500 }}>{d.doctor_no}</td>
                    <td style={{ fontWeight: 500 }}>{d.full_name}</td>
                    <td className="text-muted">{d.specialization || '—'}</td>
                    <td className="text-mono">{d.license_no || '—'}</td>
                    <td className="text-mono">{Number(d.consultation_fee).toLocaleString()} MMK</td>
                    <td>
                      <span className={`badge badge-${d.is_active ? 'active' : 'inactive'}`}>
                        {d.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <Link href={`/doctors/${d.id}`} className="btn btn-sm">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Stethoscope size={48} style={{ margin: '0 auto', display: 'block', color: 'var(--ink-muted)' }} />
              </div>
              <div className="empty-state-title">No doctors registered</div>
              <div className="empty-state-sub">
                {q ? `No results for "${q}"` : 'Add the clinic doctors to get started.'}
              </div>
              <Link href="/doctors/new" className="btn btn-primary"><Plus size={16} /> Add Doctor</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
