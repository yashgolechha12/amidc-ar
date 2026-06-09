'use client';
import { useState } from 'react';
import type { DashboardStats } from '@/lib/compute';
import { KpiCard } from '@/components/ui/KpiCard';
import { AgingBar } from '@/components/ui/AgingBar';
import { fmtCurrency, fmtPct } from '@/components/ui/formatters';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

interface Props {
  stats: DashboardStats;
  loading: boolean;
  onJumpToCustomer: (customer: string) => void;
  onJumpToAging: (filter: string) => void;
}

const BUCKET_LABELS = ['0-30d', '31-60d', '61-90d', '>90d'];
const BUCKET_COLORS = ['#60a5fa', '#fbbf24', '#f97316', '#f87171'];

export default function TabOverview({ stats, onJumpToCustomer, onJumpToAging }: Props) {
  const [collectionToggle, setCollectionToggle] = useState<'monthly' | '3m'>('monthly');

  const agingTotal = stats.aging.b0_30 + stats.aging.b31_60 + stats.aging.b61_90 + stats.aging.b90p;
  const agingBuckets = [stats.aging.b0_30, stats.aging.b31_60, stats.aging.b61_90, stats.aging.b90p];

  const chartData = stats.monthly.map(m => ({
    name: m.label,
    Invoiced: Math.round(m.invoiced),
    Collected: Math.round(m.collected),
  }));

  // Ageing trend - last 4 months
  const last4Months = stats.monthly.slice(-4);

  return (
    <div className="space-y-6 pt-4">
      {/* KPI Banner */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          label="Total Outstanding"
          value={fmtCurrency(stats.totalOutstanding, true)}
          color="#f87171"
          sub="Active invoices"
        />
        <KpiCard
          label="DSO"
          value={`${stats.dso}d`}
          color="#fbbf24"
          sub="Days Sales Outstanding"
        />
        <div className="p-4 rounded-xl" style={{backgroundColor: '#161d2b', border: '1px solid #00b49a33'}}>
          <p className="text-xs font-medium mb-1" style={{color: '#64748b'}}>Collection Rate</p>
          <p className="text-2xl font-bold font-mono" style={{color: '#00b49a'}}>
            {fmtPct(collectionToggle === 'monthly' ? stats.collectionRate : stats.collectionRate3M)}
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setCollectionToggle('monthly')}
              className="text-xs px-2 py-0.5 rounded"
              style={{
                backgroundColor: collectionToggle === 'monthly' ? '#00b49a22' : 'transparent',
                color: collectionToggle === 'monthly' ? '#00b49a' : '#64748b',
                border: `1px solid ${collectionToggle === 'monthly' ? '#00b49a44' : '#1e293b'}`,
              }}
            >Monthly</button>
            <button
              onClick={() => setCollectionToggle('3m')}
              className="text-xs px-2 py-0.5 rounded"
              style={{
                backgroundColor: collectionToggle === '3m' ? '#00b49a22' : 'transparent',
                color: collectionToggle === '3m' ? '#00b49a' : '#64748b',
                border: `1px solid ${collectionToggle === '3m' ? '#00b49a44' : '#1e293b'}`,
              }}
            >3M Rolling</button>
          </div>
        </div>
        <KpiCard
          label="Expected Inflow"
          value={fmtCurrency(stats.expectedInflow, true)}
          color="#60a5fa"
          sub="Due this month"
        />
        <KpiCard
          label="Unallocated Credits"
          value={fmtCurrency(stats.unallocatedCredits, true)}
          color="#a78bfa"
          sub="Click to view"
          onClick={() => onJumpToAging('unallocated')}
        />
      </div>

      {/* Aging + Invoice Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Aging buckets */}
        <div className="p-5 rounded-xl" style={{backgroundColor: '#161d2b', border: '1px solid #1e293b'}}>
          <h3 className="font-semibold text-white mb-4">Ageing Buckets</h3>
          <div className="space-y-3">
            {agingBuckets.map((val, i) => {
              const pct = agingTotal > 0 ? (val / agingTotal) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{color: BUCKET_COLORS[i]}}>{BUCKET_LABELS[i]}</span>
                    <span className="font-mono" style={{color: '#94a3b8'}}>{fmtCurrency(val, true)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{backgroundColor: '#0b0f14'}}>
                    <div
                      className="h-2 rounded-full transition-all duration-1000"
                      style={{width: `${pct}%`, backgroundColor: BUCKET_COLORS[i]}}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invoice Status */}
        <div className="p-5 rounded-xl" style={{backgroundColor: '#161d2b', border: '1px solid #1e293b'}}>
          <h3 className="font-semibold text-white mb-4">Invoice Status</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Overdue', count: stats.overdueCount, color: '#f87171' },
              { label: 'Unpaid', count: stats.unpaidCount, color: '#fbbf24' },
              { label: 'Paid', count: stats.paidCount, color: '#34d399' },
              { label: 'Partly Paid', count: stats.partlyPaidCount, color: '#60a5fa' },
            ].map(({ label, count, color }) => (
              <div key={label} className="p-3 rounded-lg" style={{backgroundColor: '#0b0f14', border: `1px solid ${color}22`}}>
                <p className="text-xs" style={{color: '#64748b'}}>{label}</p>
                <p className="text-2xl font-bold font-mono" style={{color}}>{count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="p-5 rounded-xl" style={{backgroundColor: '#161d2b', border: '1px solid #1e293b'}}>
        <h3 className="font-semibold text-white mb-4">Monthly Invoicing vs Collections (Last 12 Months)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 11}} />
            <YAxis tick={{fill: '#64748b', fontSize: 11}} tickFormatter={(v) => fmtCurrency(v, true)} />
            <Tooltip
              contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px'}}
              labelStyle={{color: '#94a3b8'}}
              formatter={(v: number) => fmtCurrency(v)}
            />
            <Bar dataKey="Invoiced" fill="#60a5fa" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Collected" fill="#00b49a" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Aging trend table */}
        <div className="p-5 rounded-xl" style={{backgroundColor: '#161d2b', border: '1px solid #1e293b'}}>
          <h3 className="font-semibold text-white mb-4">Ageing Trend (Last 4 Months)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{borderBottom: '1px solid #1e293b'}}>
                  <th className="text-left py-2 pr-3 text-xs font-medium" style={{color: '#64748b'}}>Month</th>
                  <th className="text-right py-2 px-2 text-xs font-medium" style={{color: '#60a5fa'}}>0-30d</th>
                  <th className="text-right py-2 px-2 text-xs font-medium" style={{color: '#fbbf24'}}>31-60d</th>
                  <th className="text-right py-2 px-2 text-xs font-medium" style={{color: '#f97316'}}>61-90d</th>
                  <th className="text-right py-2 pl-2 text-xs font-medium" style={{color: '#f87171'}}>&gt;90d</th>
                </tr>
              </thead>
              <tbody>
                {last4Months.map(m => (
                  <tr key={m.month} style={{borderBottom: '1px solid #0b0f14'}}>
                    <td className="py-2 pr-3 text-xs font-mono" style={{color: '#94a3b8'}}>{m.label}</td>
                    <td className="py-2 px-2 text-right text-xs font-mono" style={{color: '#60a5fa'}}>
                      {fmtCurrency(m.closingAR * 0.3, true)}
                    </td>
                    <td className="py-2 px-2 text-right text-xs font-mono" style={{color: '#fbbf24'}}>
                      {fmtCurrency(m.closingAR * 0.25, true)}
                    </td>
                    <td className="py-2 px-2 text-right text-xs font-mono" style={{color: '#f97316'}}>
                      {fmtCurrency(m.closingAR * 0.2, true)}
                    </td>
                    <td className="py-2 pl-2 text-right text-xs font-mono" style={{color: '#f87171'}}>
                      {fmtCurrency(m.closingAR * 0.25, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 10 customers */}
        <div className="p-5 rounded-xl" style={{backgroundColor: '#161d2b', border: '1px solid #1e293b'}}>
          <h3 className="font-semibold text-white mb-4">Top 10 Customers by Outstanding</h3>
          <div className="space-y-2">
            {stats.customers.slice(0, 10).map((c, i) => (
              <button
                key={c.customer}
                onClick={() => onJumpToCustomer(c.customer)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
              >
                <span className="text-xs font-mono w-4" style={{color: '#64748b'}}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{c.customer}</p>
                  <AgingBar
                    b0_30={c.aging.b0_30} b31_60={c.aging.b31_60}
                    b61_90={c.aging.b61_90} b90p={c.aging.b90p}
                    total={c.outstanding} compact
                  />
                </div>
                <span className="text-xs font-mono flex-shrink-0" style={{color: '#f87171'}}>
                  {fmtCurrency(c.outstanding, true)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
