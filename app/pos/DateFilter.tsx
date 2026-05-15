'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function DateFilter({ period, from, to }: { period?: string, from?: string, to?: string }) {
  const [showCustom, setShowCustom] = useState(false);
  const isCustom = !period && (from || to);

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
      <span className="text-mono text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', marginRight: '8px' }}>Filter:</span>
      <Link href="/pos?period=today" className={`btn btn-sm ${period === 'today' ? 'btn-primary' : ''}`}>Today</Link>
      <Link href="/pos?period=week" className={`btn btn-sm ${period === 'week' ? 'btn-primary' : ''}`}>This Week</Link>
      <Link href="/pos?period=month" className={`btn btn-sm ${period === 'month' ? 'btn-primary' : ''}`}>This Month</Link>
      <Link href="/pos" className={`btn btn-sm ${!period && !from && !to && !showCustom ? 'btn-primary' : ''}`}>All Time</Link>
      
      <div style={{ position: 'relative' }}>
        <button 
          onClick={() => setShowCustom(!showCustom)} 
          className={`btn btn-sm ${isCustom || showCustom ? 'btn-primary' : ''}`}
        >
          Custom
        </button>
        
        {showCustom && (
          <div style={{ 
            position: 'absolute', 
            top: 'calc(100% + 8px)', 
            left: 0, 
            background: 'var(--surface)', 
            border: '1px solid var(--border)', 
            borderRadius: '12px', 
            padding: '16px', 
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', 
            zIndex: 50,
            width: '280px'
          }}>
            <div className="text-mono text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', marginBottom: '12px' }}>Custom Date Range</div>
            <form method="GET" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="text-mono text-muted" style={{ fontSize: '10px' }}>Start Date</label>
                <input name="from" type="date" className="form-input" style={{ padding: '8px 12px' }} defaultValue={from || ''} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="text-mono text-muted" style={{ fontSize: '10px' }}>End Date</label>
                <input name="to" type="date" className="form-input" style={{ padding: '8px 12px' }} defaultValue={to || ''} required />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Apply</button>
                <button type="button" onClick={() => setShowCustom(false)} className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>

      {(period || from || to) && (
        <Link href="/pos" className="text-mono text-muted" style={{ fontSize: '11px', textDecoration: 'underline', marginLeft: 'auto' }}>Clear Filters</Link>
      )}
    </div>
  );
}
