"use client";
import { useEffect, useRef, useState } from "react";

// Thin wrapper around html5-qrcode that emits decoded text.
// We import dynamically so the library never ships in the server bundle.
//
// Camera permission is browser-controlled (per-origin) — there's no app
// switch to "default approve." On iOS Safari, the OS shows two choices the
// FIRST time a site requests camera: "Allow Once" or "Allow on Every Visit".
// Volunteers who pick "Allow Once" get re-prompted next session. The tip
// banner below appears once per device until granted, telling them which to
// pick. After that, html5-qrcode skips the prompt because the browser has
// the persistent grant.

const TIP_DISMISSED_KEY = 'sbbq_camera_tip_seen'

type PermState = 'unknown' | 'granted' | 'prompt' | 'denied' | 'error'

export default function QRScanner({ onScan }: { onScan: (text: string) => void }) {
  const elRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);
  const handlerRef = useRef(onScan);
  handlerRef.current = onScan;
  const [perm, setPerm] = useState<PermState>('unknown');
  const [tipDismissed, setTipDismissed] = useState(false);

  // Read the stored "tip seen" flag and check current camera permission via
  // the Permissions API where supported (Chromium + Firefox; Safari iOS
  // partially supports it from 16+). When the API isn't available we leave
  // perm as 'unknown' and just let the prompt happen naturally.
  useEffect(() => {
    try {
      setTipDismissed(localStorage.getItem(TIP_DISMISSED_KEY) === '1')
    } catch {}

    if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        // 'camera' isn't in the standard PermissionName union but is the
        // de-facto string used by all browsers that support it.
        const status = await navigator.permissions.query({ name: 'camera' as PermissionName })
        if (cancelled) return
        setPerm(status.state as PermState)
        status.onchange = () => setPerm(status.state as PermState)
      } catch {
        if (!cancelled) setPerm('error')
      }
    })()
    return () => { cancelled = true }
  }, [])

  // When permission is already granted, mark the tip as seen so it never
  // shows again on this device.
  useEffect(() => {
    if (perm === 'granted' && !tipDismissed) {
      try { localStorage.setItem(TIP_DISMISSED_KEY, '1') } catch {}
      setTipDismissed(true)
    }
  }, [perm, tipDismissed])

  useEffect(() => {
    let stopped = false;
    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (stopped || !elRef.current) return;
      const id = "qr-reader-" + Math.random().toString(36).slice(2, 8);
      elRef.current.id = id;
      const scanner = new Html5Qrcode(id, { verbose: false } as any);
      scannerRef.current = scanner;
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decoded: string) => handlerRef.current(decoded),
          () => {}
        );
      } catch (e) {
        console.error("Failed to start camera", e);
      }
    })();
    return () => {
      stopped = true;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current?.clear?.();
        });
      }
    };
  }, []);

  // Show the iOS permission tip ONLY when:
  //   - the user has not seen + dismissed it before
  //   - permission is not already granted
  // This keeps the camera viewfinder uncluttered for repeat users.
  const showTip = !tipDismissed && perm !== 'granted'

  return (
    <div className="flex flex-col gap-2 w-full max-w-sm mx-auto">
      {showTip && (
        <div className="rounded-xl border border-neon-cyan/50 bg-neon-cyan/10 px-3 py-2 text-[11px] leading-snug text-paper">
          <div className="flex items-start gap-2">
            <span aria-hidden className="text-base leading-none">📷</span>
            <div className="flex-1 min-w-0">
              <strong className="text-neon-cyan">Camera access:</strong>{' '}
              When iOS asks, pick <strong>Allow on Every Visit</strong> so you don&apos;t get re-prompted at every station.
            </div>
            <button
              type="button"
              aria-label="Dismiss tip"
              onClick={() => {
                try { localStorage.setItem(TIP_DISMISSED_KEY, '1') } catch {}
                setTipDismissed(true)
              }}
              className="shrink-0 text-mist hover:text-paper text-base leading-none -mr-1"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <div ref={elRef} className="rounded-xl overflow-hidden bg-black aspect-square w-full" />
    </div>
  );
}
