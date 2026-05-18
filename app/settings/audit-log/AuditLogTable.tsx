'use client'

import { useState } from 'react'
import { X, Copy, Check, ArrowRight } from 'lucide-react'

export default function AuditLogTable({
  logs,
  userNames,
  entityNames,
  MODULE_META,
  ACTION_LABELS
}: {
  logs: any[]
  userNames: Record<string, string>
  entityNames: Record<string, string>
  MODULE_META: any
  ACTION_LABELS: any
}) {
  const [selectedLog, setSelectedLog] = useState<any | null>(null)
  const [copied, setCopied] = useState(false)

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Visual diff parser based on module and action
  const renderDiff = (log: any) => {
    const oldData = log.previous_data || {}
    const newData = log.new_data || {}

    // No changes data
    if (Object.keys(oldData).length === 0 && Object.keys(newData).length === 0) {
      return (
        <div className="text-muted" style={{ fontSize: '13px', fontStyle: 'italic', padding: '16px 0' }}>
          No detailed change data recorded for this event.
        </div>
      )
    }

    // Specific formatting per action type
    if (log.action === 'login') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="diff-row">
            <span className="diff-label">OS:</span>
            <span className="diff-new" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {newData.os === 'Windows' && '🪟'}
              {newData.os === 'macOS' && '🍎'}
              {newData.os === 'iOS' && '📱'}
              {newData.os === 'Android' && '🤖'}
              {newData.os === 'Linux' && '🐧'}
              {newData.os || 'Unknown'}
            </span>
          </div>
          <div className="diff-row">
            <span className="diff-label">Device:</span>
            <span className="diff-new">{newData.device_type || 'Unknown'}</span>
          </div>
          <div className="diff-row">
            <span className="diff-label">Browser:</span>
            <span className="diff-new">{newData.browser || 'Unknown'}</span>
          </div>
        </div>
      )
    }

    if (log.action === 'role_changed') {
      return (
        <div className="diff-row">
          <span className="diff-label">Role:</span>
          <span className="diff-old">{oldData.role || 'Unknown'}</span>
          <ArrowRight size={14} className="text-muted" />
          <span className="diff-new">{newData.role || 'Unknown'}</span>
        </div>
      )
    }

    if (log.action === 'status_changed') {
      return (
        <div className="diff-row">
          <span className="diff-label">Status:</span>
          <span className="diff-old">{oldData.status || 'Pending'}</span>
          <ArrowRight size={14} className="text-muted" />
          <span className="diff-new">{newData.status || 'Updated'}</span>
        </div>
      )
    }

    if (log.action === 'fee_changed') {
      return (
        <div className="diff-row">
          <span className="diff-label">Consultation Fee:</span>
          <span className="diff-old">{Number(oldData.consultation_fee || 0).toLocaleString()} MMK</span>
          <ArrowRight size={14} className="text-muted" />
          <span className="diff-new">{Number(newData.consultation_fee || 0).toLocaleString()} MMK</span>
        </div>
      )
    }

    if (log.action === 'stock_adjusted' || log.action === 'qty_changed') {
      const oldQty = oldData.stock_qty ?? oldData.quantity ?? 0
      const newQty = newData.stock_qty ?? newData.quantity ?? 0
      return (
        <div className="diff-row">
          <span className="diff-label">Quantity:</span>
          <span className="diff-old">{oldQty}</span>
          <ArrowRight size={14} className="text-muted" />
          <span className="diff-new">{newQty}</span>
        </div>
      )
    }

    if (log.action === 'discount_applied') {
      return (
        <div className="diff-row">
          <span className="diff-label">Discount:</span>
          <span className="diff-new">{Number(newData.discount_amount || 0).toLocaleString()} MMK</span>
          {newData.reason && <div style={{marginLeft: '12px', fontSize: '12px', color: 'var(--muted)'}}>Reason: {newData.reason}</div>}
        </div>
      )
    }

    // Generic JSON diff for any other object
    const changedKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)])
    
    return Array.from(changedKeys).map(key => {
      const o = oldData[key]
      const n = newData[key]
      
      // Skip if unchanged or if they are large objects (keep it simple)
      if (JSON.stringify(o) === JSON.stringify(n)) return null

      // In partial updates, missing keys in newData (undefined) mean no change, not deleted.
      // Explicit deletions usually pass null.
      if (n === undefined && o !== undefined) return null;

      const displayVal = (val: any) => {
        if (val === null || val === undefined) return ''
        if (typeof val === 'object') return JSON.stringify(val)
        if (typeof val === 'string' && entityNames[val]) return entityNames[val]
        return String(val)
      }

      return (
        <div className="diff-row" key={key}>
          <span className="diff-label" style={{textTransform: 'capitalize'}}>{key.replace(/_/g, ' ')}:</span>
          {o !== undefined && (
            <>
              <span className="diff-old">{displayVal(o)}</span>
              <ArrowRight size={14} className="text-muted" />
            </>
          )}
          {n !== undefined && (
            <span className="diff-new">{displayVal(n)}</span>
          )}
          {n === undefined && o !== undefined && (
            <span className="diff-new" style={{color: 'var(--red)', background: 'var(--red2)'}}>Deleted</span>
          )}
        </div>
      )
    })
  }

  return (
    <>
      <style>{`
        .audit-table-row {
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .audit-table-row:hover {
          background: var(--s2);
        }
        
        /* Drawer Overlay */
        .drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(2px);
          z-index: 1000;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .drawer-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }

        /* Drawer Panel */
        .drawer-panel {
          position: fixed;
          top: 0;
          right: -420px;
          width: 400px;
          height: 100vh;
          background: var(--surface);
          box-shadow: -4px 0 24px rgba(0,0,0,0.08);
          z-index: 1001;
          transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
        }
        .drawer-panel.open {
          right: 0;
        }

        /* Drawer Internals */
        .drawer-header {
          padding: 24px;
          border-bottom: 1px solid var(--border);
          position: relative;
        }
        .drawer-close {
          position: absolute;
          top: 24px;
          right: 24px;
          cursor: pointer;
          color: var(--muted);
          transition: color 0.15s;
        }
        .drawer-close:hover {
          color: var(--text);
        }
        .drawer-body {
          padding: 24px;
          flex: 1;
          overflow-y: auto;
        }
        .drawer-footer {
          padding: 24px;
          background: var(--s2);
          border-top: 1px solid var(--border);
          font-family: var(--mono);
          font-size: 11px;
          color: var(--muted);
        }

        /* Diff Styling */
        .diff-section-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
          margin-bottom: 12px;
          font-weight: 600;
        }
        .diff-container {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .diff-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          flex-wrap: wrap;
        }
        .diff-label {
          font-weight: 500;
          color: var(--text);
          min-width: 80px;
        }
        .diff-old {
          color: var(--red);
          background: var(--red2);
          padding: 2px 6px;
          border-radius: 4px;
          text-decoration: line-through;
          text-decoration-color: rgba(139, 26, 26, 0.5);
        }
        .diff-new {
          color: var(--green);
          background: var(--green2);
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }
      `}</style>

      <div className="card-body" style={{ padding: 0 }}>
        {logs && logs.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Module</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Performed By</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const meta = MODULE_META[log.module] ?? { label: log.module, color: '#64748b', icon: '•' }
                return (
                  <tr key={log.id} className="audit-table-row" onClick={() => setSelectedLog(log)}>
                    <td className="text-mono" style={{ fontSize: '12px', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleDateString()}{' '}
                      <span style={{ color: 'var(--muted)' }}>
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: `${meta.color}18`,
                          color: meta.color,
                          border: `1px solid ${meta.color}30`,
                          fontFamily: 'var(--mono)',
                          fontSize: '10px',
                        }}
                      >
                        {meta.icon} {meta.label}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500, fontSize: '13px' }}>
                      {ACTION_LABELS[log.action] ?? log.action}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: '13px' }}>{log.entity_label ?? log.entity_type}</div>
                      {log.entity_id && (
                        <div className="text-mono text-muted" style={{ fontSize: '10px' }}>
                          {log.entity_id.slice(0, 8)}…
                        </div>
                      )}
                    </td>
                    <td>
                      {log.performed_by
                        ? (
                          <span style={{ fontWeight: 500, fontSize: '13px' }}>
                            {userNames[log.performed_by] ?? 'Unknown'}
                          </span>
                        )
                        : <span className="text-muted" style={{ fontSize: '12px' }}>System</span>
                      }
                    </td>
                    <td className="text-mono" style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      {log.ip_address ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
            <div style={{ fontWeight: 600, marginBottom: '6px' }}>No audit events found</div>
            <div style={{ fontSize: '13px' }}>Events will appear here as actions are performed.</div>
          </div>
        )}
      </div>

      {/* Drawer Overlay */}
      <div 
        className={`drawer-overlay ${selectedLog ? 'open' : ''}`} 
        onClick={() => setSelectedLog(null)}
      />

      {/* Drawer Panel */}
      <div className={`drawer-panel ${selectedLog ? 'open' : ''}`}>
        {selectedLog && (() => {
          const meta = MODULE_META[selectedLog.module] ?? { label: selectedLog.module, color: '#64748b', icon: '•' }
          const userName = selectedLog.performed_by ? (userNames[selectedLog.performed_by] ?? 'Unknown') : 'System'
          
          return (
            <>
              <div className="drawer-header">
                <X className="drawer-close" size={20} onClick={() => setSelectedLog(null)} />
                <div style={{ marginBottom: '16px' }}>
                  <span
                    className="badge"
                    style={{
                      background: `${meta.color}18`,
                      color: meta.color,
                      border: `1px solid ${meta.color}30`,
                      fontFamily: 'var(--mono)',
                      fontSize: '11px',
                    }}
                  >
                    {meta.icon} {meta.label}
                  </span>
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px', color: 'var(--text)' }}>
                  {ACTION_LABELS[selectedLog.action] ?? selectedLog.action}
                </h2>
                <div style={{ fontSize: '13px', color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>By <strong style={{color: 'var(--text)'}}>{userName}</strong></div>
                  <div>
                    {new Date(selectedLog.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {new Date(selectedLog.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div className="drawer-body">
                <div className="diff-section-title">Entity Affected</div>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '24px', color: 'var(--text)' }}>
                  {selectedLog.entity_label || selectedLog.entity_type}
                  <div className="text-mono text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>Type: {selectedLog.entity_type}</div>
                </div>

                <div className="diff-section-title">Change Details</div>
                <div className="diff-container">
                  {renderDiff(selectedLog)}
                </div>
              </div>

              <div className="drawer-footer">
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>IP Address:</span>
                  <span>{selectedLog.ip_address || 'Not recorded'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>User Agent:</span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedLog.user_agent || 'Not recorded'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>Entity ID:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selectedLog.entity_id || 'N/A'}
                    </span>
                    {selectedLog.entity_id && (
                      <button 
                        onClick={() => copyId(selectedLog.entity_id!)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: copied ? 'var(--green)' : 'var(--muted)' }}
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )
        })()}
      </div>
    </>
  )
}
