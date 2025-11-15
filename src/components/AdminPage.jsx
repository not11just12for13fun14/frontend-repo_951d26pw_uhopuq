import { useEffect, useState } from 'react'
import { GlassPanel, NeonButton, GlassInput } from './GlassUI'
import { seedIfEmpty, listPositions, listCandidates, addPosition, updatePosition, deletePosition, addCandidate, updateCandidate, deleteCandidate, tallies, resetResults, addTokens, listTokens, setConfig, getConfig } from '../lib/db'
import jsPDF from 'jspdf'

export default function AdminPage() {
  const [status, setStatus] = useState('stopped')
  const [positions, setPositions] = useState([])
  const [selectedPos, setSelectedPos] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [tokens, setTokens] = useState([])

  useEffect(() => {
    (async () => {
      await seedIfEmpty()
      const s = await getConfig('electionStatus', 'stopped')
      setStatus(s)
      const p = await listPositions()
      setPositions(p)
      if (p.length) selectPosition(p[0])
      const t = await listTokens()
      setTokens(t)
    })()
  }, [])

  async function selectPosition(p) {
    setSelectedPos(p)
    const cs = await listCandidates(p.id)
    setCandidates(cs)
  }

  async function startElection() {
    await setConfig('electionStatus', 'active')
    setStatus('active')
  }
  async function stopElection() {
    await setConfig('electionStatus', 'stopped')
    setStatus('stopped')
  }

  async function createPosition() {
    const name = prompt('Position name')
    if (!name) return
    const description = prompt('Description') || ''
    const p = await addPosition({ name, description })
    const list = await listPositions()
    setPositions(list)
    selectPosition(p)
  }

  async function editPosition(p) {
    const name = prompt('New name', p.name) || p.name
    const description = prompt('New description', p.description) || p.description
    const u = await updatePosition(p.id, { name, description })
    const list = await listPositions()
    setPositions(list)
    selectPosition(u)
  }

  async function removePosition(p) {
    if (!confirm('Delete position and all its candidates?')) return
    await deletePosition(p.id)
    const list = await listPositions()
    setPositions(list)
    if (list.length) selectPosition(list[0])
    else { setSelectedPos(null); setCandidates([]) }
  }

  async function createCandidate() {
    if (!selectedPos) return
    const name = prompt('Candidate name')
    if (!name) return
    const description = prompt('Description') || ''
    // image upload
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files[0]
      const image = file ? await fileToDataURL(file) : ''
      await addCandidate({ name, description, image, positionId: selectedPos.id })
      const cs = await listCandidates(selectedPos.id)
      setCandidates(cs)
    }
    input.click()
  }

  async function editCandidate(c) {
    const name = prompt('New name', c.name) || c.name
    const description = prompt('New description', c.description) || c.description
    const changeImg = confirm('Change image?')
    let image = c.image
    if (changeImg) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = async () => {
        const file = input.files[0]
        image = file ? await fileToDataURL(file) : image
        const u = await updateCandidate(c.id, { name, description, image })
        const cs = await listCandidates(selectedPos.id)
        setCandidates(cs)
      }
      input.click()
    } else {
      const u = await updateCandidate(c.id, { name, description, image })
      const cs = await listCandidates(selectedPos.id)
      setCandidates(cs)
    }
  }

  async function removeCandidate(c) {
    if (!confirm('Delete candidate?')) return
    await deleteCandidate(c.id)
    const cs = await listCandidates(selectedPos.id)
    setCandidates(cs)
  }

  async function exportPDF() {
    const doc = new jsPDF()
    const date = new Date().toLocaleString()
    doc.setFontSize(18)
    doc.text('School Election Results', 14, 20)
    doc.setFontSize(11)
    doc.text(`Timestamp: ${date}`, 14, 28)
    let y = 36
    const posList = await listPositions()
    for (const p of posList) {
      doc.setFontSize(14)
      doc.text(p.name, 14, y)
      y += 6
      const cs = await listCandidates(p.id)
      const tally = await tallies()
      for (const c of cs) {
        const count = tally[p.id]?.[c.id] || 0
        doc.setFontSize(11)
        doc.text(`- ${c.name}: ${count}`, 20, y)
        y += 6
      }
      y += 4
      if (y > 270) { doc.addPage(); y = 20 }
    }
    y += 10
    doc.setFontSize(12)
    doc.text('Signature: ______________________', 14, y)
    doc.save(`election-results-${Date.now()}.pdf`)
  }

  async function resetAll() {
    if (!confirm('Reset all results? This cannot be undone.')) return
    await resetResults()
    alert('Results cleared.')
  }

  async function importTokens() {
    const raw = prompt('Paste one-time tokens separated by commas or new lines:')
    if (!raw) return
    const codes = raw.split(/[\n,\s]+/).map(s => s.trim()).filter(Boolean)
    await addTokens(codes)
    const t = await listTokens()
    setTokens(t)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Admin Control</h2>
        <div className="flex gap-3">
          <NeonButton onClick={startElection} disabled={status === 'active'}>Start Election</NeonButton>
          <NeonButton onClick={stopElection} disabled={status === 'stopped'}>Stop Election</NeonButton>
          <NeonButton onClick={exportPDF}>Export PDF</NeonButton>
          <NeonButton onClick={resetAll}>Reset Results</NeonButton>
        </div>
      </div>

      <GlassPanel className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl text-white">Positions</h3>
          <NeonButton onClick={createPosition}>Add Position</NeonButton>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {positions.map(p => (
            <div key={p.id} className={`p-3 rounded-xl bg-white/5 border border-white/10 ${selectedPos?.id===p.id ? 'ring-2 ring-cyan-300' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{p.name}</div>
                  <div className="text-white/70 text-sm">{p.description}</div>
                </div>
                <div className="flex gap-2">
                  <button className="text-cyan-300" onClick={() => selectPosition(p)}>Open</button>
                  <button className="text-white/80" onClick={() => editPosition(p)}>Edit</button>
                  <button className="text-red-300" onClick={() => removePosition(p)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      {selectedPos && (
        <GlassPanel className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl text-white">Candidates for {selectedPos.name}</h3>
            <NeonButton onClick={createCandidate}>Add Candidate</NeonButton>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {candidates.map(c => (
              <div key={c.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                {c.image && <img src={c.image} alt={c.name} className="h-32 w-full object-cover rounded-lg mb-2" />}
                <div className="text-white font-medium">{c.name}</div>
                <div className="text-white/70 text-sm mb-2">{c.description}</div>
                <div className="flex gap-3">
                  <button className="text-white/80" onClick={() => editCandidate(c)}>Edit</button>
                  <button className="text-red-300" onClick={() => removeCandidate(c)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      <GlassPanel className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl text-white">Anti-duplicate options</h3>
        </div>
        <p className="text-white/80 mb-2">Default: Option A — manual supervisor check using printed roll. Toggle B/C below if your school requires it.</p>
        <div className="flex flex-wrap gap-2">
          <label className="text-white/90 mr-4">
            <input type="radio" name="dup" defaultChecked onChange={() => setConfig('duplicateMode','A')} /> A) Manual check
          </label>
          <label className="text-white/90 mr-4">
            <input type="radio" name="dup" onChange={() => setConfig('duplicateMode','B')} /> B) One-time tokens
          </label>
          <label className="text-white/90">
            <input type="radio" name="dup" onChange={() => setConfig('duplicateMode','C')} /> C) Student ID + PIN
          </label>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <NeonButton onClick={importTokens}>Import tokens</NeonButton>
          <span className="text-white/80">Current tokens: {tokens.filter(t=>!t.used).length} unused / {tokens.length} total</span>
        </div>
      </GlassPanel>
    </div>
  )
}

async function fileToDataURL(file) {
  return new Promise(res => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.readAsDataURL(file)
  })
}
