// "Add from home" uploads for the memory bank. Photos, audio and video are too big for
// localStorage, so they go to IndexedDB (idb-keyval). Stays on the device and works offline.
//
// Each upload: { id, astronautId, from, text, type: 'photo' | 'audio' | 'video', blob, fileName, dropDay, createdAt }

import { createStore, get, set } from 'idb-keyval'

const store = createStore('orbitcare-memory', 'uploads')
const KEY = 'uploads.v1'

async function readAll() {
  return (await get(KEY, store)) ?? []
}

export async function getUploads(astronautId) {
  const all = await readAll()
  return all.filter((u) => u.astronautId === astronautId)
}

export async function addUpload(upload) {
  const all = await readAll()
  await set(KEY, [...all, upload], store)
}

export async function removeUpload(id) {
  const all = await readAll()
  await set(KEY, all.filter((u) => u.id !== id), store)
}

export function typeForFile(file) {
  if (file.type.startsWith('image/')) return 'photo'
  if (file.type.startsWith('audio/')) return 'audio'
  if (file.type.startsWith('video/')) return 'video'
  return null
}
