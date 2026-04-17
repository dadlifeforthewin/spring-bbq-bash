'use client'
import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react'

export type PhotoViewfinderHandle = {
  capture: () => Promise<Blob | null>
}

type Props = {
  onCapture?: (blob: Blob) => void
  facingMode?: 'user' | 'environment'
  jpegQuality?: number
}

const PhotoViewfinder = forwardRef<PhotoViewfinderHandle, Props>(function PhotoViewfinder(
  { onCapture, facingMode = 'environment', jpegQuality = 0.85 },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError('Camera not available in this browser.')
          return
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        setReady(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not access camera')
      }
    }
    start()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [facingMode])

  const capture = async (): Promise<Blob | null> => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return null
    const width = video.videoWidth || 640
    const height = video.videoHeight || 480
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', jpegQuality),
    )
    if (blob && onCapture) onCapture(blob)
    return blob
  }

  useImperativeHandle(ref, () => ({ capture }), [])

  return (
    <div className="space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          data-testid="photo-viewfinder-video"
          className="h-full w-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
            Starting camera…
          </div>
        )}
      </div>
      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
    </div>
  )
})

export default PhotoViewfinder
