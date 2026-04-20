import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PrizesEditor from '@/components/admin/PrizesEditor'

type Prize = {
  id: string
  label: string
  sub: string | null
  sort_order: number
  active: boolean
  created_at: string
}

const FIXTURE: Prize[] = [
  { id: 'p1', label: 'Slinky', sub: 'Classic spring', sort_order: 10, active: true, created_at: '2026-04-01T00:00:00Z' },
  { id: 'p2', label: 'Glow bracelet', sub: null,      sort_order: 20, active: true, created_at: '2026-04-01T00:00:00Z' },
  { id: 'p3', label: 'Retired',       sub: null,      sort_order: 30, active: false, created_at: '2026-04-01T00:00:00Z' },
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

describe('PrizesEditor', () => {
  const origConfirm = global.confirm
  beforeEach(() => {
    // accept destructive confirms by default
    global.confirm = () => true
  })
  afterEach(() => {
    global.confirm = origConfirm
    vi.restoreAllMocks()
  })

  it('loads and renders active and inactive prizes', async () => {
    mockFetchSequence([{ body: { prizes: FIXTURE } }])
    render(<PrizesEditor />)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Slinky')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Glow bracelet')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Retired')).toBeInTheDocument()
    })
  })

  it('POSTs to /api/admin/prizes when Add is clicked', async () => {
    const fetchMock = mockFetchSequence([
      { body: { prizes: FIXTURE } }, // initial load
      { body: { prize: { id: 'p4', label: 'Candy', sub: null, sort_order: 40, active: true, created_at: 'now' } } }, // POST
      { body: { prizes: FIXTURE } }, // reload after create
    ])
    render(<PrizesEditor />)
    await waitFor(() => expect(screen.getByDisplayValue('Slinky')).toBeInTheDocument())

    const newLabel = screen.getByLabelText(/new prize label/i)
    fireEvent.change(newLabel, { target: { value: 'Candy' } })
    fireEvent.click(screen.getByRole('button', { name: /add prize/i }))

    await waitFor(() => {
      const call = findCall(fetchMock, '/api/admin/prizes', 'POST')
      expect(call).toBeTruthy()
      const body = JSON.parse((call![1] as RequestInit).body as string)
      expect(body.label).toBe('Candy')
    })
  })

  it('PATCHes on label blur when label changed', async () => {
    const fetchMock = mockFetchSequence([
      { body: { prizes: FIXTURE } }, // initial
      { body: { prize: { ...FIXTURE[0], label: 'Super Slinky' } } }, // PATCH
      { body: { prizes: FIXTURE } }, // reload
    ])
    render(<PrizesEditor />)
    await waitFor(() => expect(screen.getByDisplayValue('Slinky')).toBeInTheDocument())

    const labelInput = screen.getByLabelText('label-p1')
    fireEvent.change(labelInput, { target: { value: 'Super Slinky' } })
    fireEvent.blur(labelInput)

    await waitFor(() => {
      const call = findCall(fetchMock, '/api/admin/prizes/p1', 'PATCH')
      expect(call).toBeTruthy()
      const body = JSON.parse((call![1] as RequestInit).body as string)
      expect(body.label).toBe('Super Slinky')
    })
  })

  it('DELETEs (soft) when Deactivate is clicked on an active row', async () => {
    const fetchMock = mockFetchSequence([
      { body: { prizes: FIXTURE } }, // initial
      { body: { ok: true } },        // DELETE
      { body: { prizes: FIXTURE } }, // reload
    ])
    render(<PrizesEditor />)
    await waitFor(() => expect(screen.getByDisplayValue('Slinky')).toBeInTheDocument())

    fireEvent.click(screen.getByLabelText('deactivate-p1'))

    await waitFor(() => {
      const call = findCall(fetchMock, '/api/admin/prizes/p1', 'DELETE')
      expect(call).toBeTruthy()
    })
  })

  it('reactivates an inactive prize via PATCH active=true', async () => {
    const fetchMock = mockFetchSequence([
      { body: { prizes: FIXTURE } }, // initial
      { body: { prize: { ...FIXTURE[2], active: true } } }, // PATCH
      { body: { prizes: FIXTURE } }, // reload
    ])
    render(<PrizesEditor />)
    await waitFor(() => expect(screen.getByDisplayValue('Retired')).toBeInTheDocument())

    fireEvent.click(screen.getByLabelText('reactivate-p3'))

    await waitFor(() => {
      const call = findCall(fetchMock, '/api/admin/prizes/p3', 'PATCH')
      expect(call).toBeTruthy()
      const body = JSON.parse((call![1] as RequestInit).body as string)
      expect(body.active).toBe(true)
    })
  })

  it('reorders via up/down arrow button PATCHing sort_order', async () => {
    // Swap path: PATCH p2 → p1's sort_order, reload, PATCH p1 → p2's sort_order, reload.
    const fetchMock = mockFetchSequence([
      { body: { prizes: FIXTURE } }, // initial GET
      { body: { prize: { ...FIXTURE[1], sort_order: 10 } } }, // PATCH p2
      { body: { prizes: FIXTURE } }, // reload
      { body: { prize: { ...FIXTURE[0], sort_order: 20 } } }, // PATCH p1
      { body: { prizes: FIXTURE } }, // reload
    ])
    render(<PrizesEditor />)
    await waitFor(() => expect(screen.getByDisplayValue('Glow bracelet')).toBeInTheDocument())

    fireEvent.click(screen.getByLabelText('move-up-p2'))

    await waitFor(() => {
      const call = findCall(fetchMock, '/api/admin/prizes/p2', 'PATCH')
      expect(call).toBeTruthy()
      const body = JSON.parse((call![1] as RequestInit).body as string)
      expect(typeof body.sort_order).toBe('number')
      expect(body.sort_order).toBeLessThan(20)
    })
  })

  it('does not POST when label is empty', async () => {
    const fetchMock = mockFetchSequence([{ body: { prizes: FIXTURE } }])
    render(<PrizesEditor />)
    await waitFor(() => expect(screen.getByDisplayValue('Slinky')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /add prize/i }))

    // only the initial GET — no POST
    const posts = fetchMock.mock.calls.filter((c) => (c[1] as RequestInit | undefined)?.method === 'POST')
    expect(posts.length).toBe(0)
  })

  it('PATCHes sub field on blur', async () => {
    const fetchMock = mockFetchSequence([
      { body: { prizes: FIXTURE } }, // initial
      { body: { prize: { ...FIXTURE[0], sub: 'Updated sub' } } }, // PATCH
      { body: { prizes: FIXTURE } }, // reload
    ])
    render(<PrizesEditor />)
    await waitFor(() => expect(screen.getByDisplayValue('Slinky')).toBeInTheDocument())

    const subInput = screen.getByLabelText('sub-p1')
    fireEvent.change(subInput, { target: { value: 'Updated sub' } })
    fireEvent.blur(subInput)

    await waitFor(() => {
      const call = findCall(fetchMock, '/api/admin/prizes/p1', 'PATCH')
      expect(call).toBeTruthy()
      const body = JSON.parse((call![1] as RequestInit).body as string)
      expect(body.sub).toBe('Updated sub')
    })
  })
})
