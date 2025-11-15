import { motion } from 'framer-motion'

export function GlassPanel({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_40px_rgba(0,0,0,0.25)] rounded-2xl ${className}`}
    >
      {children}
    </motion.div>
  )
}

export function NeonButton({ children, onClick, className = '', type = 'button', disabled }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl px-6 py-3 font-semibold tracking-wide ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(168,85,247,0.9), rgba(34,211,238,0.9))',
        boxShadow: '0 0 24px rgba(34,211,238,0.45), inset 0 0 24px rgba(255,255,255,0.08)'
      }}
    >
      <span className="relative z-10 text-white drop-shadow">{children}</span>
      <span className="pointer-events-none absolute inset-0 opacity-50" style={{
        background: 'radial-gradient(120px 120px at var(--x,50%) var(--y,50%), rgba(255,255,255,0.3), transparent 60%)'
      }} />
    </motion.button>
  )
}

export function GlassInput({ label, type = 'text', value, onChange, placeholder, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-white/90">{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-300"
      />
    </label>
  )
}

export function GlassModal({ open, onClose, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/60" />
      <GlassPanel className="relative z-10 w-full max-w-md p-6">
        {children}
      </GlassPanel>
    </div>
  )
}
