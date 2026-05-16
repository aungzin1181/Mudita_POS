/**
 * lib/audit.ts
 * Lightweight audit logging helper. Uses the service-role client to bypass
 * RLS so logs are ALWAYS written even if the session is partial/expired.
 * Never throws — logging failures must never break the main action flow.
 */
import { supabaseAdmin } from '@/lib/supabase/admin'

export interface AuditEntry {
  performed_by?: string | null
  module: 'inventory' | 'patient' | 'doctor' | 'appointment' | 'user_mgmt' | 'auth'
  action: string
  entity_type: string
  entity_id?: string | null
  entity_label?: string | null
  previous_data?: Record<string, unknown> | null
  new_data?: Record<string, unknown> | null
  ip_address?: string | null
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('audit_log').insert({
      performed_by:  entry.performed_by  ?? null,
      module:        entry.module,
      action:        entry.action,
      entity_type:   entry.entity_type,
      entity_id:     entry.entity_id     ?? null,
      entity_label:  entry.entity_label  ?? null,
      previous_data: entry.previous_data ?? null,
      new_data:      entry.new_data      ?? null,
      ip_address:    entry.ip_address    ?? null,
    })
    if (error) {
      console.error('[audit_log] Insert error:', error.message)
    }
  } catch (err) {
    // Must never propagate — logging failure is non-fatal
    console.error('[audit_log] Unexpected failure:', err)
  }
}
