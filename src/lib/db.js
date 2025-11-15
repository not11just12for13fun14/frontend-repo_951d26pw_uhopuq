// IndexedDB setup using idb
// Provides persistent offline storage for election data
// Collections: positions, candidates, votes, config, tokens
import { openDB } from 'idb'

const DB_NAME = 'school-election-db'
const DB_VERSION = 1

export async function getDB() {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('positions')) {
        const store = db.createObjectStore('positions', { keyPath: 'id', autoIncrement: true })
        store.createIndex('by_name', 'name', { unique: false })
      }
      if (!db.objectStoreNames.contains('candidates')) {
        const store = db.createObjectStore('candidates', { keyPath: 'id', autoIncrement: true })
        store.createIndex('by_positionId', 'positionId', { unique: false })
      }
      if (!db.objectStoreNames.contains('votes')) {
        const store = db.createObjectStore('votes', { keyPath: 'id', autoIncrement: true })
        store.createIndex('by_positionId', 'positionId', { unique: false })
        store.createIndex('by_timestamp', 'timestamp', { unique: false })
      }
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config')
      }
      if (!db.objectStoreNames.contains('tokens')) {
        const store = db.createObjectStore('tokens', { keyPath: 'code' })
        store.createIndex('by_used', 'used', { unique: false })
      }
    },
  })
  return db
}

export async function getConfig(key, defaultValue = null) {
  const db = await getDB()
  const val = await db.get('config', key)
  return val ?? defaultValue
}

export async function setConfig(key, value) {
  const db = await getDB()
  await db.put('config', value, key)
}

export async function seedIfEmpty() {
  const db = await getDB()
  const count = await db.count('positions')
  if (count > 0) return

  const positions = [
    { name: 'School President', description: 'Leads the student council.' },
    { name: 'Vice President', description: 'Supports the president.' },
    { name: 'Sports Captain', description: 'Leads sports initiatives.' },
  ]
  for (const p of positions) {
    const positionId = await db.add('positions', p)
    // 2–3 candidate samples with simple SVG avatar placeholders
    const candidates = [
      { name: 'Alex Nova', description: 'Focused on inclusivity and events.', image: sampleAvatar('#7c3aed'), positionId },
      { name: 'Riley Azure', description: 'Sustainability & clubs.', image: sampleAvatar('#06b6d4'), positionId },
      { name: 'Kai Ember', description: 'Tech and innovation.', image: sampleAvatar('#f59e0b'), positionId },
    ]
    for (const c of candidates) {
      await db.add('candidates', c)
    }
  }
  await setConfig('electionStatus', 'stopped')
  await setConfig('duplicateMode', 'A') // A=manual check (default). B=tokens, C=ID+PIN
}

function sampleAvatar(color = '#06b6d4') {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">\n  <defs>\n    <radialGradient id="g" cx="50%" cy="50%" r="75%">\n      <stop offset="0%" stop-color="${color}" stop-opacity="0.9"/>\n      <stop offset="100%" stop-color="${color}" stop-opacity="0.3"/>\n    </radialGradient>\n  </defs>\n  <rect width="200" height="200" rx="24" fill="url(#g)"/>\n  <circle cx="100" cy="80" r="36" fill="white" fill-opacity="0.9"/>\n  <rect x="45" y="125" width="110" height="50" rx="18" fill="white" fill-opacity="0.85"/>\n</svg>`
  return 'data:image/svg+xml;base64,' + btoa(svg)
}

// Positions
export async function listPositions() {
  const db = await getDB()
  return await db.getAll('positions')
}
export async function addPosition(data) {
  const db = await getDB()
  const id = await db.add('positions', data)
  return { id, ...data }
}
export async function updatePosition(id, patch) {
  const db = await getDB()
  const existing = await db.get('positions', id)
  if (!existing) return null
  const updated = { ...existing, ...patch }
  await db.put('positions', updated)
  return updated
}
export async function deletePosition(id) {
  const db = await getDB()
  // delete candidates under this position
  const idx = db.transaction('candidates').store.index('by_positionId')
  let cursor = await idx.openCursor(IDBKeyRange.only(id))
  while (cursor) {
    await db.delete('candidates', cursor.primaryKey)
    cursor = await cursor.continue()
  }
  await db.delete('positions', id)
}

// Candidates
export async function listCandidates(positionId) {
  const db = await getDB()
  const idx = db.transaction('candidates').store.index('by_positionId')
  return await idx.getAll(IDBKeyRange.only(positionId))
}
export async function addCandidate(data) {
  const db = await getDB()
  const id = await db.add('candidates', data)
  return { id, ...data }
}
export async function updateCandidate(id, patch) {
  const db = await getDB()
  const existing = await db.get('candidates', id)
  if (!existing) return null
  const updated = { ...existing, ...patch }
  await db.put('candidates', updated)
  return updated
}
export async function deleteCandidate(id) {
  const db = await getDB()
  await db.delete('candidates', id)
}

// Votes
export async function recordVote(selections) {
  // selections: array of { positionId, candidateId }
  const db = await getDB()
  const timestamp = Date.now()
  for (const sel of selections) {
    await db.add('votes', { positionId: sel.positionId, candidateId: sel.candidateId, timestamp })
  }
}
export async function resetResults() {
  const db = await getDB()
  await db.clear('votes')
}
export async function tallies() {
  const db = await getDB()
  const positions = await db.getAll('positions')
  const result = {}
  for (const p of positions) {
    const idx = db.transaction('votes').store.index('by_positionId')
    const votes = await idx.getAll(IDBKeyRange.only(p.id))
    const byCandidate = {}
    for (const v of votes) {
      byCandidate[v.candidateId] = (byCandidate[v.candidateId] || 0) + 1
    }
    result[p.id] = byCandidate
  }
  return result
}

// Tokens (Option B)
export async function addTokens(codes = []) {
  const db = await getDB()
  for (const code of codes) {
    await db.put('tokens', { code, used: false, usedAt: null })
  }
}
export async function listTokens() {
  const db = await getDB()
  return await db.getAll('tokens')
}
export async function consumeToken(code) {
  const db = await getDB()
  const token = await db.get('tokens', code)
  if (!token || token.used) return false
  await db.put('tokens', { ...token, used: true, usedAt: Date.now() })
  return true
}
