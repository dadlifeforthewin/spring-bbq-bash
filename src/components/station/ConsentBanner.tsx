export default function ConsentBanner({ photoConsentApp }: { photoConsentApp: boolean }) {
  return photoConsentApp ? (
    <div
      data-testid="consent-banner"
      className="w-full bg-green-600 py-3 text-center text-lg font-bold text-white"
    >
      ✅ PHOTOS OK
    </div>
  ) : (
    <div
      data-testid="consent-banner"
      className="w-full bg-red-600 py-3 text-center text-lg font-bold text-white"
    >
      🚫 NO PHOTOS — DO NOT INCLUDE
    </div>
  )
}
