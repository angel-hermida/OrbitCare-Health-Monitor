// Claude API client for the AI assistant. The only network call outside NASA DONKI.
//
// Key: VITE_ANTHROPIC_API_KEY in .env (gitignored). Vite builds it into the JavaScript, so anyone
// with the built site can read it. Use it for local demos only; for a public deploy, move this
// call behind a small server that holds the key (see README "AI assistant").
//
// Privacy: the astronaut's data never leaves the device in bulk. The model only receives the
// results of the tools it asks for (see tools.js), and an uploaded record only when it is read.
// Nothing medical is written to the console.

const API_URL = 'https://api.anthropic.com/v1/messages'
export const MODEL = import.meta.env?.VITE_CLAUDE_MODEL || 'claude-sonnet-5-5'
const MAX_TOOL_ROUNDS = 6

export const apiKey = () => import.meta.env?.VITE_ANTHROPIC_API_KEY || ''
export const assistantConfigured = () => Boolean(apiKey())

export class AssistantError extends Error {
  constructor(kind, message) {
    super(message)
    this.kind = kind // 'nokey' | 'network' | 'auth' | 'rate' | 'api'
  }
}

async function callClaude(body, { signal } = {}) {
  const key = apiKey()
  if (!key) throw new AssistantError('nokey', 'Assistant unavailable. No Claude API key is configured on this device.')
  let res
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model: MODEL, ...body }),
    })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new AssistantError('network', 'No link to the assistant service. Readings and all other pages still work offline.')
  }
  if (!res.ok) {
    let detail = ''
    try {
      detail = (await res.json())?.error?.message || ''
    } catch {
      // ignore
    }
    if (res.status === 401 || res.status === 403) throw new AssistantError('auth', 'Assistant unavailable. The Claude API key was rejected.')
    if (res.status === 429 || res.status === 529) throw new AssistantError('rate', 'Assistant busy. Wait a moment and send again.')
    throw new AssistantError('api', `Assistant error (${res.status}). ${detail}`.trim())
  }
  return res.json()
}

// One astronaut turn. `history` is the API message list so far (user / assistant / tool turns).
// tools: { definitions, run(name, input) -> { result, card } }
// Returns { history, text, cards }.
export async function runAssistantTurn({ system, history, userText, tools, signal }) {
  let messages = [...history, { role: 'user', content: userText }]
  const cards = []
  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const data = await callClaude({ system, messages, tools: tools.definitions, max_tokens: 1024 }, { signal })
    messages = [...messages, { role: 'assistant', content: data.content }]
    const uses = data.content.filter((b) => b.type === 'tool_use')
    if (data.stop_reason !== 'tool_use' || uses.length === 0) {
      const text = data.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim()
      return { history: messages, text, cards }
    }
    const results = uses.map((u) => {
      const { result, card } = tools.run(u.name, u.input)
      if (card) cards.push(card)
      return { type: 'tool_result', tool_use_id: u.id, content: JSON.stringify(result) }
    })
    messages = [...messages, { role: 'user', content: results }]
  }
  return { history: messages, text: 'Request stopped: too many steps. Ask a shorter question.', cards }
}

// Keep the API history short: drop the oldest whole exchanges (a plain-text user turn starts each one).
export function trimHistory(history, maxExchanges = 8) {
  const starts = history.map((m, i) => (m.role === 'user' && typeof m.content === 'string' ? i : -1)).filter((i) => i >= 0)
  if (starts.length <= maxExchanges) return history
  return history.slice(starts[starts.length - maxExchanges])
}

// ---------- Medical record extraction ----------

const RECORD_TOOL = {
  name: 'save_medical_record',
  description: 'Save the medical information found in the document. Only include what the document explicitly states.',
  input_schema: {
    type: 'object',
    properties: {
      isMedicalRecord: { type: 'boolean', description: 'false if the document is not a medical record.' },
      readable: { type: 'boolean', description: 'false if the text cannot be read.' },
      documentType: { type: 'string', description: 'e.g. "Blood test report", "Pre-flight physical", "Discharge summary".' },
      documentDate: { type: ['string', 'null'], description: 'Date of the document, YYYY-MM-DD, or null.' },
      patientName: { type: ['string', 'null'], description: 'Name of the patient as written, or null.' },
      conditions: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, status: { type: 'string', description: 'e.g. current, resolved, history of' }, evidence: { type: 'string', description: 'Short exact text from the document' } }, required: ['name', 'evidence'] } },
      medications: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, dose: { type: 'string' }, frequency: { type: 'string' }, status: { type: 'string', description: 'current or stopped, as written' }, evidence: { type: 'string' } }, required: ['name', 'evidence'] } },
      allergies: { type: 'array', items: { type: 'object', properties: { substance: { type: 'string' }, reaction: { type: 'string' }, evidence: { type: 'string' } }, required: ['substance', 'evidence'] } },
      labs: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, value: { type: 'string' }, unit: { type: 'string' }, referenceRange: { type: 'string' }, flag: { type: 'string', description: 'H / L / abnormal, only if printed' }, date: { type: 'string' } }, required: ['name', 'value'] } },
      exams: { type: 'array', items: { type: 'object', properties: { date: { type: 'string' }, type: { type: 'string' }, summary: { type: 'string' } }, required: ['type'] } },
      history: { type: 'array', items: { type: 'string' }, description: 'Past medical / surgical history items as written.' },
      notes: { type: 'string', description: 'Anything unclear or partly unreadable.' },
    },
    required: ['isMedicalRecord', 'readable', 'conditions', 'medications', 'allergies', 'labs', 'exams', 'history'],
  },
}

// file: a browser File. Returns the extracted object (see RECORD_TOOL).
export async function extractMedicalRecord(file, { signal } = {}) {
  const base64 = await fileToBase64(file)
  const isPdf = file.type === 'application/pdf'
  const source = { type: 'base64', media_type: file.type, data: base64 }
  const block = isPdf ? { type: 'document', source } : { type: 'image', source }
  const data = await callClaude(
    {
      max_tokens: 4096,
      system:
        'You extract structured data from medical documents for an astronaut health app. Copy values exactly as written. Never infer, complete or guess a condition, medication, dose, allergy or lab value that is not printed. If a section is absent, return an empty list.',
      tools: [RECORD_TOOL],
      tool_choice: { type: 'tool', name: 'save_medical_record' },
      messages: [{ role: 'user', content: [block, { type: 'text', text: 'Extract the medical information from this document.' }] }],
    },
    { signal }
  )
  const use = data.content.find((b) => b.type === 'tool_use')
  if (!use) throw new AssistantError('api', 'The record could not be read.')
  return use.input
}

export const SUPPORTED_RECORD_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif']
export const MAX_RECORD_BYTES = 10 * 1024 * 1024

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = () => reject(new AssistantError('api', 'The file could not be opened.'))
    reader.readAsDataURL(file)
  })
}
