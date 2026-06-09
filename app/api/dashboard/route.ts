import { NextResponse } from 'next/server';
import { fetchDashboardData } from '@/lib/erpnext';
import { computeDashboardStats } from '@/lib/compute';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchDashboardData();
    const stats = computeDashboardStats(data.invoices, data.payments, data.fetchedAt);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: String(error) },
      { status: 500 }
    );
  }
}
