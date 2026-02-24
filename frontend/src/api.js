const BASE = '/api'

// --- Racks ---
export async function fetchRacks() {
  const r = await fetch(`${BASE}/racks/`)
  return r.json()
}

export async function createRack(data) {
  const r = await fetch(`${BASE}/racks/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function updateRack(id, data) {
  const r = await fetch(`${BASE}/racks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function deleteRack(id) {
  await fetch(`${BASE}/racks/${id}`, { method: 'DELETE' })
}

// --- Cases ---
export async function fetchCases(rackId) {
  const url = rackId ? `${BASE}/cases/?rack_id=${rackId}` : `${BASE}/cases/`
  const r = await fetch(url)
  return r.json()
}

export async function createCase(data) {
  const r = await fetch(`${BASE}/cases/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function deleteCase(id) {
  await fetch(`${BASE}/cases/${id}`, { method: 'DELETE' })
}

export function caseQrImageUrl(id) {
  return `${BASE}/cases/${id}/qr-image`
}

// --- Items ---
export async function fetchItems(params = {}) {
  const qs = new URLSearchParams()
  if (params.case_id) qs.set('case_id', params.case_id)
  if (params.q) qs.set('q', params.q)
  const r = await fetch(`${BASE}/items/?${qs}`)
  return r.json()
}

export async function createItem(formData) {
  const r = await fetch(`${BASE}/items/`, { method: 'POST', body: formData })
  return r.json()
}

export async function deleteItem(id) {
  await fetch(`${BASE}/items/${id}`, { method: 'DELETE' })
}

export async function searchRacks(q) {
  const r = await fetch(`${BASE}/items/search-racks?q=${encodeURIComponent(q)}`)
  return r.json()
}

// --- AI ---
export async function detectItem(imageFile) {
  const fd = new FormData()
  fd.append('image', imageFile)
  const r = await fetch(`${BASE}/ai/detect`, { method: 'POST', body: fd })
  if (!r.ok) return null
  return r.json()
}
