import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CleanupEditor from '@/components/admin/CleanupEditor'

type CleanupTask = {
  id: string
  label: string
  sub: string | null
  sort_order: number
  active: boolean
  created_at: string
}

const FIXTURE: CleanupTask[] = [
  { id: 't1', label: 'Pick up cups',     sub: 'All tables',    sort_order: 10, active: true,  created_at: '2026-04-01T00:00:00Z' },
  { id: 't2', label: 'Wipe down tables', sub: null,            sort_order: 20, active: true,  created_at: '2026-04-01T00:00:00Z' },
  { id: 't3', label: 'Retired task',     sub: null,            sort_order: 30, active: false, created_at: '2026-04-01T00:00:00Z' },
]

type FetchArgs = [input: RequestInfo | URL, init?: RequestInit]

function mockFetchSequence(responses: Array<{ status?: number; body: unknown }>) {
  const fetchMock = vi.fn(async (..._args: FetchArgs) => {
    const r = responses.shift()!
    return {
      ok: (r.status ?? 200) >= 200 && (r.status ?? 200) < 300,
      status: r.status ?? 200,
      json: async () => r.body,
    } as Response
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

function findCall(
  fetchMock: ReturnType<typeof mockFetchSequence>,
  url: string,
  method: string,
): FetchArgs | undefined {
  return fetchMock.mock.calls.find(
    (c) => c[0] === url && (c[1] as RequestInit | undefined)?.method === method,
  ) as FetchArgs | undefined
}

describe('CleanupEditor', () => {
  const origConfirm = global.confirm
  beforeEach(() => {
    // accept destructive confirms by default
    global.confirm = () => true
  })
  afterEach(() => {
    global.confirm = origConfirm
    vi.restoreAllMocks()
  })

  it('loads and renders active and inactive cleanup tasks', async () => {
    mockFetchSequence([{ body: { tasks: FIXTURE } }])
    render(<CleanupEditor />)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Pick up cups')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Wipe down tables')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Retired task')).toBeInTheDocument()
    })
  })

  it('POSTs to /api/admin/cleanup when Add is clicked', async () => {
    const fetchMock = mockFetchSequence([
      { body: { tasks: FIXTURE } }, // initial load
      { body: { task: { id: 't4', label: 'Empty trash', sub: null, sort_order: 40, active: true, created_at: 'now' } } }, // POST
      { body: { tasks: FIXTURE } }, // reload after create
    ])
    render(<CleanupEditor />)
    await waitFor(() => expect(screen.getByDisplayValue('Pick up cups')).toBeInTheDocument())

    const newLabel = screen.getByLabelText(/new task label/i)
    fireEvent.change(newLabel, { target: { value: 'Empty trash' } })
    fireEvent.click(screen.getByRole('button', { name: /add task/i }))

    await waitFor(() => {
      const call = findCall(fetchMock, '/api/admin/cleanup', 'POST')
      expect(call).toBeTruthy()
      const body = JSON.parse((call![1] as RequestInit).body as string)
      expect(body.label).toBe('Empty trash')
    })
  })

  it('PATCHes on label blur when label changed', async () => {
    const fetchMock = mockFetchSequence([
      { body: { tasks: FIXTURE } }, // initial
      { body: { task: { ...FIXTURE[0], label: 'Pick up ALL cups' } } }, // PATCH
      { body: { tasks: FIXTURE } }, // reload
    ])
    render(<CleanupEditor />)
    await waitFor(() => expect(screen.getByDisplayValue('Pick up cups')).toBeInTheDocument())

    const labelInput = screen.getByLabelText('label-t1')
    fireEvent.change(labelInput, { target: { value: 'Pick up ALL cups' } })
    fireEvent.blur(labelInput)

    await waitFor(() => {
      const call = findCall(fetchMock, '/api/admin/cleanup/t1', 'PATCH')
      expect(call).toBeTruthy()
      const body = JSON.parse((call![1] as RequestInit).body as string)
      expect(body.label).toBe('Pick up ALL cups')
    })
  })

  it('DELETEs (soft) when Deactivate is clicked on an active row', async () => {
    const fetchMock = mockFetchSequence([
      { body: { tasks: FIXTURE } }, // initial
      { body: { ok: true } },       // DELETE
      { body: { tasks: FIXTURE } }, // reload
    ])
    render(<CleanupEditor />)
    await waitFor(() => expect(screen.getByDisplayValue('Pick up cups')).toBeInTheDocument())

    fireEvent.click(screen.getByLabelText('deactivate-t1'))

    await waitFor(() => {
      const call = findCall(fetchMock, '/api/admin/cleanup/t1', 'DELETE')
      expect(call).toBeTruthy()
    })
  })

  it('reactivates an inactive task via PATCH active=true', async () => {
    const fetchMock = mockFetchSequence([
      { body: { tasks: FIXTURE } }, // initial
      { body: { task: { ...FIXTURE[2], active: true } } }, // PATCH
      { body: { tasks: FIXTURE } }, // reload
    ])
    render(<CleanupEditor />)
    await waitFor(() => expect(screen.getByDisplayValue('Retired task')).toBeInTheDocument())

    fireEvent.click(screen.getByLabelText('reactivate-t3'))

    await waitFor(() => {
      const call = findCall(fetchMock, '/api/admin/cleanup/t3', 'PATCH')
      expect(call).toBeTruthy()
      const body = JSON.parse((call![1] as RequestInit).body as string)
      expect(body.active).toBe(true)
    })
  })

  it('reorders via up/down arrow button PATCHing sort_order', async () => {
    // Swap path: PATCH t2 → t1's sort_order, reload, PATCH t1 → t2's sort_order, reload.
    const fetchMock = mockFetchSequence([
      { body: { tasks: FIXTURE } }, // initial GET
      { body: { task: { ...FIXTURE[1], sort_order: 10 } } }, // PATCH t2
      { body: { tasks: FIXTURE } }, // reload
      { body: { task: { ...FIXTURE[0], sort_order: 20 } } }, // PATCH t1
      { body: { tasks: FIXTURE } }, // reload
    ])
    render(<CleanupEditor />)
    await waitFor(() => expect(screen.getByDisplayValue('Wipe down tables')).toBeInTheDocument())

    fireEvent.click(screen.getByLabelText('move-up-t2'))

    await waitFor(() => {
      const call = findCall(fetchMock, '/api/admin/cleanup/t2', 'PATCH')
      expect(call).toBeTruthy()
      const body = JSON.parse((call![1] as RequestInit).body as string)
      expect(typeof body.sort_order).toBe('number')
      expect(body.sort_order).toBeLessThan(20)
    })
  })

  it('does not POST when label is empty', async () => {
    const fetchMock = mockFetchSequence([{ body: { tasks: FIXTURE } }])
    render(<CleanupEditor />)
    await waitFor(() => expect(screen.getByDisplayValue('Pick up cups')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /add task/i }))

    // only the initial GET — no POST
    const posts = fetchMock.mock.calls.filter((c) => (c[1] as RequestInit | undefined)?.method === 'POST')
    expect(posts.length).toBe(0)
  })

  it('PATCHes sub field on blur', async () => {
    const fetchMock = mockFetchSequence([
      { body: { tasks: FIXTURE } }, // initial
      { body: { task: { ...FIXTURE[0], sub: 'Updated sub' } } }, // PATCH
      { body: { tasks: FIXTURE } }, // reload
    ])
    render(<CleanupEditor />)
    await waitFor(() => expect(screen.getByDisplayValue('Pick up cups')).toBeInTheDocument())

    const subInput = screen.getByLabelText('sub-t1')
    fireEvent.change(subInput, { target: { value: 'Updated sub' } })
    fireEvent.blur(subInput)

    await waitFor(() => {
      const call = findCall(fetchMock, '/api/admin/cleanup/t1', 'PATCH')
      expect(call).toBeTruthy()
      const body = JSON.parse((call![1] as RequestInit).body as string)
      expect(body.sub).toBe('Updated sub')
    })
  })
})
