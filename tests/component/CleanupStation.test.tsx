import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CleanupStation from '@/components/station/CleanupStation'

// next/navigation might be pulled in transitively — stub to be safe.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

type CleanupTask = {
  id: string
  label: string
  sub: string | null
  sort_order: number
  active: boolean
  created_at: string
}

const TASKS: CleanupTask[] = [
  { id: 't1', label: 'Fold & Stack Tables',        sub: 'Main Tent',      sort_order: 10, active: true, created_at: '2026-04-01T00:00:00Z' },
  { id: 't2', label: 'Trash Bags to Dumpster',     sub: 'Side lot',       sort_order: 20, active: true, created_at: '2026-04-01T00:00:00Z' },
  { id: 't3', label: 'Collect Lost & Found',       sub: 'Check-in table', sort_order: 30, active: true, created_at: '2026-04-01T00:00:00Z' },
]

type FetchArgs = [input: RequestInfo | URL, init?: RequestInit]

/**
 * Stateful fake server. Tracks completed task ids so optimistic UI can
 * round-trip against a live-ish backend.
 */
function mockCleanupServer(initial?: {
  tasks?: CleanupTask[]
  completed?: string[]
  // Inject a failure on toggle by setting this flag.
  toggleFails?: boolean
}) {
  const state = {
    tasks: initial?.tasks ?? TASKS,
    completed: new Set<string>(initial?.completed ?? []),
  }
  const calls: Array<{ url: string; method: string; body?: unknown }> = []

  const fetchMock = vi.fn(async (...args: FetchArgs) => {
    const url = typeof args[0] === 'string' ? args[0] : args[0].toString()
    const init = args[1] ?? {}
    const method = (init.method ?? 'GET').toUpperCase()
    const bodyStr = typeof init.body === 'string' ? init.body : undefined
    const bodyObj = bodyStr ? JSON.parse(bodyStr) : undefined
    calls.push({ url, method, body: bodyObj })

    // GET /api/stations/cleanup/state
    if (url === '/api/stations/cleanup/state' && method === 'GET') {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          tasks: state.tasks,
          completed_task_ids: [...state.completed],
        }),
      } as Response
    }

    // POST /api/stations/cleanup/toggle
    if (url === '/api/stations/cleanup/toggle' && method === 'POST') {
      if (initial?.toggleFails) {
        return {
          ok: false,
          status: 500,
          json: async () => ({ error: 'db error' }),
        } as Response
      }
      const { task_id, completed } = bodyObj as { task_id: string; completed: boolean }
      if (completed) state.completed.add(task_id)
      else state.completed.delete(task_id)
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          remaining: state.tasks.length - state.completed.size,
          total: state.tasks.length,
        }),
      } as Response
    }

    throw new Error(`unmocked fetch: ${method} ${url}`)
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return { fetchMock, calls, state }
}

/** Find the toggle checkbox associated with a given task label. */
function toggleFor(label: string): HTMLInputElement {
  const labelEl = screen.getByText(new RegExp(label, 'i'))
  // BigToggle renders label text inside a <label>; climb up, find the checkbox.
  const wrap = labelEl.closest('label')
  if (!wrap) throw new Error(`No <label> wrapping ${label}`)
  const cb = wrap.querySelector('input[type="checkbox"]') as HTMLInputElement | null
  if (!cb) throw new Error(`No checkbox inside label for ${label}`)
  return cb
}

describe('CleanupStation', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the task list from GET /state', async () => {
    mockCleanupServer()
    render(<CleanupStation />)
    await waitFor(() => {
      expect(screen.getByText(/fold & stack tables/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/trash bags to dumpster/i)).toBeInTheDocument()
    expect(screen.getByText(/collect lost & found/i)).toBeInTheDocument()
    // Progress chip reads 0/3 DONE
    expect(screen.getByText(/0\s*\/\s*3\s*done/i)).toBeInTheDocument()
  })

  it('tapping a toggle on POSTs { completed: true } and updates the progress chip', async () => {
    const { calls } = mockCleanupServer()
    render(<CleanupStation />)
    await waitFor(() => expect(screen.getByText(/fold & stack tables/i)).toBeInTheDocument())

    fireEvent.click(toggleFor('Fold & Stack Tables'))

    await waitFor(() => {
      const post = calls.find((c) => c.url === '/api/stations/cleanup/toggle' && c.method === 'POST')
      expect(post).toBeTruthy()
      expect((post!.body as Record<string, unknown>).task_id).toBe('t1')
      expect((post!.body as Record<string, unknown>).completed).toBe(true)
    })
    await waitFor(() => {
      expect(screen.getByText(/1\s*\/\s*3\s*done/i)).toBeInTheDocument()
    })
  })

  it('tapping a toggle off POSTs { completed: false }', async () => {
    const { calls } = mockCleanupServer({ completed: ['t1'] })
    render(<CleanupStation />)
    await waitFor(() => expect(screen.getByText(/1\s*\/\s*3\s*done/i)).toBeInTheDocument())

    fireEvent.click(toggleFor('Fold & Stack Tables'))

    await waitFor(() => {
      const post = calls.find((c) => c.url === '/api/stations/cleanup/toggle' && c.method === 'POST')
      expect(post).toBeTruthy()
      expect((post!.body as Record<string, unknown>).task_id).toBe('t1')
      expect((post!.body as Record<string, unknown>).completed).toBe(false)
    })
    await waitFor(() => {
      expect(screen.getByText(/0\s*\/\s*3\s*done/i)).toBeInTheDocument()
    })
  })

  it('progress chip shows N/M DONE and updates as toggles flip', async () => {
    mockCleanupServer()
    render(<CleanupStation />)
    await waitFor(() => expect(screen.getByText(/0\s*\/\s*3\s*done/i)).toBeInTheDocument())

    fireEvent.click(toggleFor('Fold & Stack Tables'))
    await waitFor(() => expect(screen.getByText(/1\s*\/\s*3\s*done/i)).toBeInTheDocument())

    fireEvent.click(toggleFor('Trash Bags to Dumpster'))
    await waitFor(() => expect(screen.getByText(/2\s*\/\s*3\s*done/i)).toBeInTheDocument())

    fireEvent.click(toggleFor('Collect Lost & Found'))
    await waitFor(() => expect(screen.getByText(/3\s*\/\s*3\s*done/i)).toBeInTheDocument())
  })

  it('toggle server error reverts the optimistic state', async () => {
    mockCleanupServer({ toggleFails: true })
    render(<CleanupStation />)
    await waitFor(() => expect(screen.getByText(/0\s*\/\s*3\s*done/i)).toBeInTheDocument())

    fireEvent.click(toggleFor('Fold & Stack Tables'))

    // Chip should drift optimistically then revert to 0/3 once the 500 lands.
    await waitFor(() => {
      expect(screen.getByText(/0\s*\/\s*3\s*done/i)).toBeInTheDocument()
    })
    // Error surfaced.
    await waitFor(() => {
      const errTexts = screen.queryAllByText(/couldn.?t save|save failed|error/i)
      expect(errTexts.length).toBeGreaterThan(0)
    })
  })
})
