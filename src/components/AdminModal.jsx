import { useState } from 'react'
import { GlassModal, GlassInput, NeonButton, GlassPanel } from './GlassUI'
import { verifyPassword } from '../lib/security'

export default function AdminModal({ open, onClose, onSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    const ok = await verifyPassword(password)
    if (ok) {
      setPassword('')
      setError('')
      onSuccess()
      onClose()
    } else {
      setError('Incorrect password. Please try again.')
    }
  }

  return (
    <GlassModal open={open} onClose={onClose}>
      <h2 className="mb-4 text-xl font-semibold text-white">Enter admin password to open settings</h2>
      <form onSubmit={submit} className="space-y-4">
        <GlassInput label="Admin password" type="password" value={password} onChange={setPassword} placeholder="••••••" />
        {error && <p className="text-red-300">{error}</p>}
        <div className="flex items-center gap-3">
          <NeonButton type="submit">Unlock Admin</NeonButton>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white">Cancel</button>
        </div>
      </form>
      <GlassPanel className="mt-4 p-3 text-xs text-white/70">
        <p>Security note: password is verified via salted SHA-256 on-device. Default hash is pre-configured.</p>
      </GlassPanel>
    </GlassModal>
  )
}
