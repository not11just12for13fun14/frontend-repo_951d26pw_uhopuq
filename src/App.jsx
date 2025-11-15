import { useEffect, useState } from 'react'
import Spline from '@splinetool/react-spline'
import { motion } from 'framer-motion'
import { GlassPanel, NeonButton } from './components/GlassUI'
import AdminModal from './components/AdminModal'
import AdminPage from './components/AdminPage'
import VoteFlow from './components/VoteFlow'
import { seedIfEmpty, getConfig } from './lib/db'

function App() {
  const [adminOpen, setAdminOpen] = useState(false)
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [voting, setVoting] = useState(false)
  const [showAdminPage, setShowAdminPage] = useState(false)

  useEffect(() => {
    seedIfEmpty()
  }, [])

  useEffect(() => {
    function moveGlow(e) {
      const btns = document.querySelectorAll('button')
      btns.forEach(b => {
        const rect = b.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        b.style.setProperty('--x', `${x}px`)
        b.style.setProperty('--y', `${y}px`)
      })
    }
    window.addEventListener('mousemove', moveGlow)
    return () => window.removeEventListener('mousemove', moveGlow)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(168,85,247,0.25),transparent),radial-gradient(1000px_800px_at_90%_10%,rgba(34,211,238,0.25),transparent)]">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/qQUip0dJPqrrPryE/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/40 to-black/60 pointer-events-none" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between p-4">
          <motion.h1 initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }} className="text-2xl font-semibold text-white drop-shadow">
            School Election Kiosk
          </motion.h1>
          <NeonButton onClick={() => setAdminOpen(true)} className="!px-4 !py-2 text-sm">Admin</NeonButton>
        </header>

        <main className="flex flex-1 items-center justify-center p-6">
          {!voting && !showAdminPage && (
            <GlassPanel className="max-w-xl w-full p-8 text-center">
              <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-bold text-white mb-6">Welcome — Start Voting</motion.h2>
              <NeonButton onClick={() => setVoting(true)} className="text-xl px-10 py-5">Start Voting</NeonButton>
              <p className="text-white/80 mt-4">No login required. Supervisor verification is performed at the next step.</p>
            </GlassPanel>
          )}

          {voting && (
            <div className="w-full max-w-4xl">
              <VoteFlow onDone={() => { setVoting(false) }} />
            </div>
          )}

          {showAdminPage && (
            <div className="w-full max-w-6xl">
              <AdminPage />
            </div>
          )}
        </main>

        <footer className="p-4 text-center text-white/60">Offline-capable • Cyberpunk liquid glass UI</footer>
      </div>

      <AdminModal
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        onSuccess={() => { setAdminUnlocked(true); setShowAdminPage(true) }}
      />
    </div>
  )
}

export default App
