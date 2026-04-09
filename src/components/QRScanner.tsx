"use client";
import { useEffect, useRef } from "react";

// Thin wrapper around html5-qrcode that emits decoded text.
// We import dynamically so the library never ships in the server bundle.
export default function QRScanner({ onScan }: { onScan: (text: string) => void }) {
  const elRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);
  const handlerRef = useRef(onScan);
  handlerRef.current = onScan;

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

  return <div ref={elRef} className="rounded-xl overflow-hidden bg-black aspect-square w-full max-w-sm mx-auto" />;
}
