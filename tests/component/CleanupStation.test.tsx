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
 * Stateful fake server. Tracks completed task ids + lock presence so
 * optimistic UI can round-trip against a live-ish backend.
 */
function mockCleanupServer(initial?: {
  tasks?: CleanupTask[]
  completed?: string[]
  locked?: boolean
  // Inject a failure on toggle or lock by setting these flags.
  toggleFails?: boolean
  lockConflict?: boolean
}) {
  const state = {
    tasks: initial?.tasks ?? TASKS,
    completed: new Set<string>(initial?.completed ?? []),
    locked: initial?.locked ?? false,
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
          locked: state.locked,
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

    // POST /api/stations/cleanup/lock
    if (url === '/api/stations/cleanup/lock' && method === 'POST') {
      const remaining = state.tasks.length - state.completed.size
      if (initial?.lockConflict || remaining !== 0) {
        return {
          ok: false,
          status: 409,
          json: async () => ({ error: 'tasks remaining', remaining, total: state.tasks.length }),
        } as Response
      }
      state.locked = true
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, locked_at: '2026-04-25T23:30:00Z' }),
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

  it('CLOSE OUT button is disabled until every task is on', async () => {
    mockCleanupServer()
    render(<CleanupStation />)
    await waitFor(() => expect(screen.getByText(/fold & stack tables/i)).toBeInTheDocument())

    const closeOut = screen.getByRole('button', { name: /close out/i })
    expect(closeOut).toBeDisabled()

    fireEvent.click(toggleFor('Fold & Stack Tables'))
    await waitFor(() => expect(screen.getByText(/1\s*\/\s*3\s*done/i)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /close out/i })).toBeDisabled()

    fireEvent.click(toggleFor('Trash Bags to Dumpster'))
    await waitFor(() => expect(screen.getByText(/2\s*\/\s*3\s*done/i)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /close out/i })).toBeDisabled()

    fireEvent.click(toggleFor('Collect Lost & Found'))
    await waitFor(() => expect(screen.getByText(/3\s*\/\s*3\s*done/i)).toBeInTheDocument())
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /close out/i })).not.toBeDisabled()
    })
  })

  it('tapping CLOSE OUT POSTs /lock and shows the NIGHT LOCKED banner', async () => {
    const { calls } = mockCleanupServer({ completed: ['t1', 't2', 't3'] })
    render(<CleanupStation />)
    await waitFor(() => expect(screen.getByText(/3\s*\/\s*3\s*done/i)).toBeInTheDocument())

    const closeOut = screen.getByRole('button', { name: /close out/i })
    await waitFor(() => expect(closeOut).not.toBeDisabled())
    fireEvent.click(closeOut)

    await waitFor(() => {
      const lockPost = calls.find((c) => c.url === '/api/stations/cleanup/lock' && c.method === 'POST')
      expect(lockPost).toBeTruthy()
    })
    await waitFor(() => {
      expect(screen.getByText(/night locked/i)).toBeInTheDocument()
    })
  })

  it('post-lock: toggling an item off re-enables the CLOSE OUT button', async () => {
    const { calls } = mockCleanupServer({ completed: ['t1', 't2', 't3'] })
    render(<CleanupStation />)
    await waitFor(() => expect(screen.getByText(/3\s*\/\s*3\s*done/i)).toBeInTheDocument())

    // Lock it once.
    fireEvent.click(screen.getByRole('button', { name: /close out/i }))
    await waitFor(() => expect(screen.getByText(/night locked/i)).toBeInTheDocument())

    // Toggle one item off — button should be disabled again and show " LEFT".
    fireEvent.click(toggleFor('Fold & Stack Tables'))
    await waitFor(() => {
      expect(screen.getByText(/2\s*\/\s*3\s*done/i)).toBeInTheDocument()
    })
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /close out/i })
      expect(btn).toBeDisabled()
      expect(btn.textContent?.toLowerCase()).toMatch(/left/)
    })

    // Toggle it back on — button re-enables and a second /lock tap is possible.
    fireEvent.click(toggleFor('Fold & Stack Tables'))
    await waitFor(() => expect(screen.getByText(/3\s*\/\s*3\s*done/i)).toBeInTheDocument())
    const btnAgain = screen.getByRole('button', { name: /close out/i })
    await waitFor(() => expect(btnAgain).not.toBeDisabled())

    fireEvent.click(btnAgain)
    await waitFor(() => {
      const lockPosts = calls.filter((c) => c.url === '/api/stations/cleanup/lock' && c.method === 'POST')
      // At least two lock taps landed — append-only writes.
      expect(lockPosts.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('409 on /lock surfaces as an inline error without locking the UI', async () => {
    // Seed with all 3 completed; the mock flag forces a 409 even though remaining is 0.
    mockCleanupServer({ completed: ['t1', 't2', 't3'], lockConflict: true })
    render(<CleanupStation />)
    await waitFor(() => expect(screen.getByText(/3\s*\/\s*3\s*done/i)).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /close out/i }))

    await waitFor(() => {
      // Error banner mentions "tasks remaining"
      expect(screen.getByText(/tasks remaining/i)).toBeInTheDocument()
    })
    // NIGHT LOCKED banner must not appear.
    expect(screen.queryByText(/night locked/i)).not.toBeInTheDocument()
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
