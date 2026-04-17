const stub = () =>
  Response.json(
    { ok: false, error: "deprecated — see /api/register + /api/checkin (v2)" },
    { status: 410 }
  );

export async function GET() { return stub(); }
export async function POST() { return stub(); }
export async function PATCH() { return stub(); }
export async function DELETE() { return stub(); }
