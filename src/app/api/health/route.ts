export const dynamic = 'force-dynamic';

// Frontend process readiness. Backend availability is monitored separately.
export function GET() {
  return Response.json(
    { status: 'ready' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
