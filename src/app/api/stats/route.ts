export async function GET() {
  return Response.json(
    { ok: false, error: "deprecated — see /api/register + /api/checkin (v2)" },
    { status: 410 }
  );
}
