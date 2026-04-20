import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import PrizeWheelStation from '@/components/station/PrizeWheelStation'

// Silence the next/navigation router imports if the component reaches for them.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

type Prize = {
  id: string
  label: string
  sub: string | null
  sort_order: number
  active: boolean
  created_at: string
}

const PRIZES: Prize[] = [
  { id: 'p1', label: 'Glow bracelet', sub: 'Classic',     sort_order: 10, active: true, created_at: '2026-04-01T00:00:00Z' },
  { id: 'p2', label: 'Slinky',        sub: null,           sort_order: 20, active: true, created_at: '2026-04-01T00:00:00Z' },
  { id: 'p3', label: 'Candy bag',     sub: 'Kid-friendly', sort_order: 30, active: true, created_at: '2026-04-01T00:00:00Z' },
]

const CHILD = {
  id: 'child-1',
  first_name: 'Maya',
  last_name: 'Carter',
  photo_consent_app: true,
  prize_wheel_used_at: null,
  checked_in_at: '2026-04-25T17:00:00Z',
  checked_out_at: null,
}

const CHILD_REDEEMED = {
  ...CHILD,
  prize_wheel_used_at: '2026-04-25T17:30:00Z',
}

type FetchArgs = [input: RequestInfo | URL, init?: RequestInit]

function mockFetchRouter(
  handlers: {
    prizes?: () => { status?: number; body: unknown }
    byQr?: (qr: string) => { status?: number; body: unknown }
    lookup?: (childId: string) => { status?: number; body: unknown }
    redeem?: (body: unknown) => { status?: number; body: unknown }
  },
) {
  const calls: Array<{ url: string; method: string; body?: unknown }> = []
  const fetchMock = vi.fn(async (...args: FetchArgs) => {
    const url = typeof args[0] === 'string' ? args[0] : args[0].toString()
    const init = args[1] ?? {}
    const method = (init.method ?? 'GET').toUpperCase()
    const bodyStr = typeof init.body === 'string' ? init.body : undefined
    const bodyObj = bodyStr ? JSON.parse(bodyStr) : undefined
    calls.push({ url, method, body: bodyObj })

    // /api/stations/prize-wheel/prizes  (GET)
    if (url === '/api/stations/prize-wheel/prizes' && method === 'GET') {
      const r = handlers.prizes?.() ?? { body: { prizes: PRIZES } }
      return {
        ok: (r.status ?? 200) >= 200 && (r.status ?? 200) < 300,
        status: r.status ?? 200,
        json: async () => r.body,
      } as Response
    }

    // /api/children/by-qr/<qr>  (GET)
    if (url.startsWith('/api/children/by-qr/') && method === 'GET') {
      const qr = decodeURIComponent(url.split('/api/children/by-qr/')[1])
      const r = handlers.byQr?.(qr) ?? { body: { child: CHILD } }
      return {
        ok: (r.status ?? 200) >= 200 && (r.status ?? 200) < 300,
        status: r.status ?? 200,
        json: async () => r.body,
      } as Response
    }

    // /api/stations/prize-wheel/lookup?child_id=<id>  (GET)
    if (url.startsWith('/api/stations/prize-wheel/lookup') && method === 'GET') {
      const u = new URL(url, 'http://x')
      const childId = u.searchParams.get('child_id') ?? ''
      const r = handlers.lookup?.(childId) ?? {
        body: { child: CHILD, redemption: null, prize_label: null },
      }
      return {
        ok: (r.status ?? 200) >= 200 && (r.status ?? 200) < 300,
        status: r.status ?? 200,
        json: async () => r.body,
      } as Response
    }

    // /api/stations/prize-wheel/redeem  (POST)
    if (url === '/api/stations/prize-wheel/redeem' && method === 'POST') {
      const r = handlers.redeem?.(bodyObj) ?? {
        body: { ok: true, prize: { id: 'p1', label: 'Glow bracelet' }, updated: false },
      }
      return {
        ok: (r.status ?? 200) >= 200 && (r.status ?? 200) < 300,
        status: r.status ?? 200,
        json: async () => r.body,
      } as Response
    }

    throw new Error(`unmocked fetch: ${method} ${url}`)
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return { fetchMock, calls }
}

async function scanAndLoadGrid(qr = 'QR-1') {
  const input = screen.getByLabelText(/qr code/i) as HTMLInputElement
  fireEvent.change(input, { target: { value: qr } })
  fireEvent.submit(input.closest('form')!)
  // chip grid should appear
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /glow bracelet/i })).toBeInTheDocument()
  })
}

describe('PrizeWheelStation', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the scanner in idle state', async () => {
    mockFetchRouter({})
    render(<PrizeWheelStation />)
    // Title and scanner input visible
    expect(screen.getByText(/prize wheel/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/qr code/i)).toBeInTheDocument()
  })

  it('on scan -> fetches lookup -> renders chip grid when no redemption', async () => {
    mockFetchRouter({})
    render(<PrizeWheelStation />)
    await scanAndLoadGrid()
    // All three active prizes render as buttons
    expect(screen.getByRole('button', { name: /glow bracelet/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /slinky/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /candy bag/i })).toBeInTheDocument()
  })

  it('tap chip -> POSTs redeem with correct body -> transitions to affirming', async () => {
    const { calls } = mockFetchRouter({})
    render(<PrizeWheelStation />)
    await scanAndLoadGrid()

    fireEvent.click(screen.getByRole('button', { name: /slinky/i }))

    await waitFor(() => {
      const post = calls.find((c) => c.url === '/api/stations/prize-wheel/redeem' && c.method === 'POST')
      expect(post).toBeTruthy()
      expect((post!.body as Record<string, unknown>).child_id).toBe('child-1')
      expect((post!.body as Record<string, unknown>).prize_id).toBe('p2')
    })

    // Affirmation card shows LOGGED
    await waitFor(() => {
      expect(screen.getByTestId('prize-affirmation')).toBeInTheDocument()
      expect(screen.getByText(/logged/i)).toBeInTheDocument()
    })
  })

  it('affirmation auto-returns to idle after 2s', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockFetchRouter({
      // tighten redeem response so we can match the specific prize
      redeem: () => ({ body: { ok: true, prize: { id: 'p2', label: 'Slinky' }, updated: false } }),
    })
    render(<PrizeWheelStation />)

    // Use real timers briefly for async lookup + fetch promises; then swap.
    const input = screen.getByLabelText(/qr code/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'QR-1' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /slinky/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /slinky/i }))

    await waitFor(() => {
      expect(screen.getByTestId('prize-affirmation')).toBeInTheDocument()
    })

    // Advance the 2s affirmation timer
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    await waitFor(() => {
      expect(screen.queryByTestId('prize-affirmation')).not.toBeInTheDocument()
    })
  })

  it('rescan with existing redemption -> renders ALREADY REDEEMED card with label + Change link', async () => {
    mockFetchRouter({
      byQr: () => ({ body: { child: CHILD_REDEEMED } }),
      lookup: () => ({
        body: {
          child: CHILD_REDEEMED,
          redemption: { id: 'r1', prize_id: 'p1', volunteer_name: null, updated_at: '2026-04-25T17:30:00Z' },
          prize_label: 'Glow bracelet',
        },
      }),
    })
    render(<PrizeWheelStation />)

    const input = screen.getByLabelText(/qr code/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'QR-1' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => {
      expect(screen.getByText(/already redeemed/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/glow bracelet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /change prize/i })).toBeInTheDocument()
  })

  it('Change click -> returns to chip grid in update_mode with the current prize marked selected', async () => {
    mockFetchRouter({
      byQr: () => ({ body: { child: CHILD_REDEEMED } }),
      lookup: () => ({
        body: {
          child: CHILD_REDEEMED,
          redemption: { id: 'r1', prize_id: 'p1', volunteer_name: null, updated_at: '2026-04-25T17:30:00Z' },
          prize_label: 'Glow bracelet',
        },
      }),
    })
    render(<PrizeWheelStation />)

    const input = screen.getByLabelText(/qr code/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'QR-1' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => expect(screen.getByRole('button', { name: /change prize/i })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /change prize/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /glow bracelet/i })).toBeInTheDocument()
    })
    // The currently-selected prize gets a "selected" visual marker (aria-pressed=true).
    const selectedChip = screen.getByRole('button', { name: /glow bracelet/i })
    expect(selectedChip).toHaveAttribute('aria-pressed', 'true')
    // The other chips are not selected.
    expect(screen.getByRole('button', { name: /slinky/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('empty catalog renders SignPanel with admin hint', async () => {
    mockFetchRouter({
      prizes: () => ({ body: { prizes: [] } }),
    })
    render(<PrizeWheelStation />)
    await waitFor(() => {
      expect(screen.getByText(/no prizes configured/i)).toBeInTheDocument()
      expect(screen.getByText(/\/admin\/prizes/i)).toBeInTheDocument()
    })
  })

  it('scan returning non-checked-in child -> shows blocking error', async () => {
    mockFetchRouter({
      byQr: () => ({ body: { child: { ...CHILD, checked_in_at: null } } }),
      lookup: () => ({
        status: 409,
        body: { error: 'not checked in' },
      }),
    })
    render(<PrizeWheelStation />)

    const input = screen.getByLabelText(/qr code/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'QR-1' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => {
      expect(screen.getByText(/not checked in/i)).toBeInTheDocument()
    })
    // And a "Scan again" reset button.
    expect(screen.getByRole('button', { name: /scan again/i })).toBeInTheDocument()
  })
})
