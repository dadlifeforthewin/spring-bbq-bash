import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import PhotoViewfinder, { PhotoViewfinderHandle } from '@/components/station/PhotoViewfinder'

describe('PhotoViewfinder', () => {
  let getUserMediaMock: ReturnType<typeof vi.fn>
  const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream

  beforeEach(() => {
    getUserMediaMock = vi.fn().mockResolvedValue(fakeStream)
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: getUserMediaMock },
    })
    // jsdom lacks HTMLMediaElement.play
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    })
    // jsdom canvas.getContext returns null — return a minimal stub for drawImage
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: vi.fn().mockReturnValue({ drawImage: vi.fn() }),
    })
    // jsdom canvas.toBlob isn't implemented
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
      configurable: true,
      value: function (cb: (blob: Blob | null) => void) {
        cb(new Blob(['fake-jpeg-bytes'], { type: 'image/jpeg' }))
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('requests camera with the requested facingMode', async () => {
    render(<PhotoViewfinder facingMode="user" />)
    await waitFor(() => expect(getUserMediaMock).toHaveBeenCalled())
    expect(getUserMediaMock).toHaveBeenCalledWith(
      expect.objectContaining({ video: expect.objectContaining({ facingMode: 'user' }), audio: false }),
    )
  })

  it('capture() returns a JPEG blob and fires onCapture', async () => {
    const onCapture = vi.fn()
    const ref = createRef<PhotoViewfinderHandle>()
    render(<PhotoViewfinder ref={ref} onCapture={onCapture} />)
    await waitFor(() => expect(ref.current).not.toBeNull())
    // Wait a tick for camera ready flag
    await waitFor(() => expect(getUserMediaMock).toHaveBeenCalled())
    // Force "ready" by triggering a render cycle — capture reads videoWidth/Height fallbacks
    const blob = await ref.current!.capture()
    expect(blob).toBeInstanceOf(Blob)
    expect(blob!.type).toBe('image/jpeg')
    expect(onCapture).toHaveBeenCalledWith(expect.any(Blob))
  })
})
