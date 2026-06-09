import { NextResponse } from 'next/server';
import { fetchDashboardData } from '@/lib/erpnext';
import { computeDashboardStats } from '@/lib/compute';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const raw = await fetchDashboardData();
    const stats = computeDashboardStats(raw.invoices, raw.payments, raw.fetchedAt);
    return NextResponse.json(stats);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[dashboard/route] Error:', msg);
    return NextResponse.json({ error: 'Failed to load data', details: msg }, { status: 500 });
  }
}