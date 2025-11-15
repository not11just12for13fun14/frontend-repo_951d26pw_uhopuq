import { useEffect, useState } from 'react'
import { GlassPanel, NeonButton } from './GlassUI'
import { seedIfEmpty, listPositions, listCandidates, recordVote, getConfig, consumeToken } from '../lib/db'

export default function VoteFlow({ onDone }) {
  const [step, setStep] = useState(0)
  const [positions, setPositions] = useState([])
  const [choices, setChoices] = useState({})
  const [duplicateMode, setDuplicateMode] = useState('A')
  const [tokenInput, setTokenInput] = useState('')

  useEffect(() => {
    (async () => {
      await seedIfEmpty()
      const p = await listPositions()
      setPositions(p)
      const mode = await getConfig('duplicateMode', 'A')
      setDuplicateMode(mode)
    })()
  }, [])

  async function verifyAndProceed() {
    if (duplicateMode === 'A') {
      // Manual supervisor verification. Nothing to check in app.
      setStep(1)
    } else if (duplicateMode === 'B') {
      // One-time token check
      const ok = await consumeToken(tokenInput.trim())
      if (!ok) {
        alert('Invalid or already used token. Please ask the supervisor.')
        return
      }
      setStep(1)
    } else {
      // Option C would prompt for Student ID + PIN; not preferred and not implemented by default.
      alert('This kiosk is configured for manual check or tokens. Use Admin settings to switch mode.')
    }
  }

  async function submitVote() {
    const selections = Object.entries(choices).map(([positionId, candidateId]) => ({ positionId: Number(positionId), candidateId }))
    await recordVote(selections)
    alert('Vote recorded. Thank you!')
    onDone()
  }

  if (step === 0) {
    return (
      <GlassPanel className="p-6">
        <h2 className="text-2xl text-white mb-4">Supervisor Verification</h2>
        {duplicateMode === 'A' && (
          <p className="text-white/80 mb-4">Supervisor: Verify the voter on the printed roll, then press Proceed.</p>
        )}
        {duplicateMode === 'B' && (
          <div className="mb-4">
            <label className="block text-white/80 mb-2">Enter one-time token</label>
            <input value={tokenInput} onChange={e=>setTokenInput(e.target.value)} className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-300" placeholder="ABC123" />
          </div>
        )}
        <NeonButton onClick={verifyAndProceed}>Proceed</NeonButton>
      </GlassPanel>
    )
  }

  if (step === 1) {
    return (
      <div className="space-y-4">
        {positions.map(p => (
          <PositionSelect key={p.id} position={p} value={choices[p.id]} onChange={cid => setChoices(prev => ({ ...prev, [p.id]: cid }))} />
        ))}
        <div className="flex gap-3">
          <NeonButton onClick={() => setStep(0)} className="bg-white/10">Back</NeonButton>
          <NeonButton onClick={() => setStep(2)} disabled={Object.keys(choices).length === 0}>Review</NeonButton>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <GlassPanel className="p-6">
        <h3 className="text-xl text-white mb-4">Confirm selections</h3>
        <ul className="space-y-2 text-white/90 mb-4">
          {positions.map(p => (
            <li key={p.id}>
              <span className="font-medium">{p.name}: </span>
              <SelectedName positionId={p.id} candidateId={choices[p.id]} />
            </li>
          ))}
        </ul>
        <p className="text-white/80 mb-4">Confirm vote — This action cannot be changed.</p>
        <div className="flex gap-3">
          <NeonButton onClick={() => setStep(1)} className="bg-white/10">Back</NeonButton>
          <NeonButton onClick={submitVote}>Confirm & Submit</NeonButton>
        </div>
      </GlassPanel>
    )
  }
}

function PositionSelect({ position, value, onChange }) {
  const [candidates, setCandidates] = useState([])
  useEffect(() => {
    (async () => {
      const cs = await listCandidates(position.id)
      setCandidates(cs)
    })()
  }, [position.id])

  return (
    <GlassPanel className="p-4">
      <h3 className="text-white text-lg mb-3">{position.name}</h3>
      <div className="grid md:grid-cols-3 gap-3">
        {candidates.map(c => (
          <button key={c.id} onClick={() => onChange(c.id)} className={`p-3 rounded-xl text-left bg-white/5 border ${value===c.id?'border-cyan-300 ring-2 ring-cyan-300':'border-white/10'} transition-all`}> 
            {c.image && <img src={c.image} alt={c.name} className="h-32 w-full object-cover rounded-lg mb-2" />}
            <div className="text-white font-medium">{c.name}</div>
            <div className="text-white/70 text-sm">{c.description}</div>
          </button>
        ))}
      </div>
    </GlassPanel>
  )
}

function SelectedName({ positionId, candidateId }) {
  const [name, setName] = useState('')
  useEffect(() => {
    (async () => {
      const cs = await listCandidates(positionId)
      const c = cs.find(x => x.id === candidateId)
      setName(c?.name || '—')
    })()
  }, [positionId, candidateId])
  return <span>{name}</span>
}
