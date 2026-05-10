'use client'

import { useState } from 'react'
import { Service } from '@/types/pos'
import { updateService } from '@/app/actions/service'
import { Edit2, Check, X, Loader2 } from 'lucide-react'

export default function ServiceRow({ service }: { service: Service }) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(service.name)
  const [price, setPrice] = useState(service.default_price.toString())
  const [isActive, setIsActive] = useState(service.is_active)

  const handleUpdate = async () => {
    setLoading(true)
    try {
      await updateService(service.id, {
        name,
        type: service.type,
        default_price: parseFloat(price),
        is_active: isActive,
      })
      setEditing(false)
    } catch (err) {
      alert('Failed to update service')
    } finally {
      setLoading(false)
    }
  }

  if (editing) {
    return (
      <tr>
        <td>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: '4px 8px' }}
          />
        </td>
        <td>
          <input
            type="number"
            className="form-input"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{ padding: '4px 8px', width: '100px' }}
          />
        </td>
        <td>
          <select
            className="form-input"
            value={isActive.toString()}
            onChange={(e) => setIsActive(e.target.value === 'true')}
            style={{ padding: '4px 8px' }}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </td>
        <td>
          <div className="flex gap-2">
            <button className="btn btn-sm btn-primary" onClick={handleUpdate} disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            </button>
            <button className="btn btn-sm" onClick={() => setEditing(false)} disabled={loading}>
              <X size={14} />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr>
      <td style={{ fontWeight: 500 }}>{service.name}</td>
      <td className="text-mono">{service.default_price.toLocaleString()} MMK</td>
      <td>
        <span className={`badge badge-${service.is_active ? 'active' : 'inactive'}`}>
          {service.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        <button className="btn btn-sm" onClick={() => setEditing(true)}>
          <Edit2 size={14} />
        </button>
      </td>
    </tr>
  )
}
