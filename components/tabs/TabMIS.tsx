'use client';
import { useState } from 'react';
import type { DashboardStats } from '@/lib/compute';
import { fmtCurrency, fmtPct } from '@/components/ui/formatters';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line
} from 'recharts';

interface Props {
  stats: DashboardStats;
}

export default function TabMIS({ stats }: Props) {
  const [effToggle, setEffToggle] = useState<'monthly' | '3m'>('monthly');
  const [highlightCol, setHighlightCol] = useState<string | null>(null);
  const monthly = stats.monthly;

  // Compute 3M rolling efficiency
  const withRolling = monthly.map((m, i) => {
    const window3 = monthly.slice(Math.max(0, i - 2), i + 1);
    const invoiced3m = window3.reduce((s, x) => s + x.invoiced, 0);
    const collected3m = window3.reduce((s, x) => s + x.collected, 0);
    const eff3m = invoiced3m > 0 ? (collected3m / invoiced3m) * 100 : 0;
    return { ...m, eff3m };
  });

  const getEffColor = (eff: number) => {
    if (eff >= 70) return '#34d399';
    if (eff >= 40) return '#fbbf24';
    return '#f87171';
  };

  const totalInvoiced = monthly.reduce((s, m) => s + m.invoiced, 0);
  const totalCollected = monthly.reduce((s, m) => s + m.collected, 0);
  const closingAR = monthly.length > 0 ? monthly[monthly.length - 1].closingAR : 0;
  const avgDSO = monthly.length > 0 ? Math.round(monthly.reduce((s, m) => s + m.dso, 0) / monthly.length) : 0;

  const chartData = withRolling.map(m => ({
    name: m.label,
    DSO: m.dso,
    Efficiency: effToggle === 'monthly' ? parseFloat(m.collectionEfficiency.toFixed(1)) : parseFloat(m.eff3m.toFixed(1)),
  }));

  return (
    <div className="space-y-4 pt-4">
      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setHighlightCol(highlightCol === 'invoiced' ? null : 'invoiced')}
          className="p-4 rounded-xl text-left transition-all"
          style={{
            backgroundColor: highlightCol === 'invoiced' ? '#60a5fa22' : '#161d2b',
            border: `1px solid ${highlightCol === 'invoiced' ? '#60a5fa66' : '#1e293b'}`,
          }}
        >
          <p className="text-xs" style={{color: '#64748b'}}>Total Invoiced</p>
          <p className="text-2xl font-bold font-mono mt-1" style={{color: '#60a5fa'}}>{fmtCurrency(totalInvoiced, true)}</p>
        </button>
        <button
          onClick={() => setHighlightCol(highlightCol === 'collected' ? null : 'collected')}
          className="p-4 rounded-xl text-left transition-all"
          style={{
            backgroundColor: highlightCol === 'collected' ? '#00b49a22' : '#161d2b',
            border: `1px solid ${highlightCol === 'collected' ? '#00b49a66' : '#1e293b'}`,
          }}
        >
          <p className="text-xs" style={{color: '#64748b'}}>Total Collected</p>
          <p className="text-2xl font-bold font-mono mt-1" style={{color: '#00b49a'}}>{fmtCurrency(totalCollected, true)}</p>
        </button>
        <button
          onClick={() => setHighlightCol(highlightCol === 'ar' ? null : 'ar')}
          className="p-4 rounded-xl text-left transition-all"
          style={{
            backgroundColor: highlightCol === 'ar' ? '#f8717122' : '#161d2b',
            border: `1px solid ${highlightCol === 'ar' ? '#f8717166' : '#1e293b'}`,
          }}
        >
          <p className="text-xs" style={{color: '#64748b'}}>Closing AR</p>
          <p className="text-2xl font-bold font-mono mt-1" style={{color: '#f87171'}}>{fmtCurrency(closingAR, true)}</p>
        </button>
        <button
          onClick={() => setHighlightCol(highlightCol === 'eff' ? null : 'eff')}
          className="p-4 rounded-xl text-left transition-all"
          style={{
            backgroundColor: highlightCol === 'eff' ? '#fbbf2422' : '#161d2b',
            border: `1px solid ${highlightCol === 'eff' ? '#fbbf2466' : '#1e293b'}`,
          }}
        >
          <p className="text-xs" style={{color: '#64748b'}}>Avg DSO</p>
          <p className="text-2xl font-bold font-mono mt-1" style={{color: '#fbbf24'}}>{avgDSO}d</p>
        </button>
      </div>

      {/* Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{color: '#64748b'}}>Collection Efficiency:</span>
        {(['monthly', '3m'] as const).map(k => (
          <button
            key={k}
            onClick={() => setEffToggle(k)}
            className="text-xs px-3 py-1 rounded-lg"
            style={{
              backgroundColor: effToggle === k ? '#00b49a22' : 'transparent',
              color: effToggle === k ? '#00b49a' : '#64748b',
              border: `1px solid ${effToggle === k ? '#00b49a44' : '#1e293b'}`,
            }}
          >
            {k === 'monthly' ? 'Monthly' : '3M Rolling'}
          </button>
        ))}
      </div>

      {/* MIS Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#161d2b', border: '1px solid #1e293b' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b' }}>
                <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#64748b' }}>Month</th>
                <th className={`text-right px-3 py-3 text-xs font-medium`}
                  style={{ color: highlightCol === 'invoiced' ? '#60a5fa' : '#64748b' }}>Invoiced</th>
                <th className="text-right px-3 py-3 text-xs font-medium"
                  style={{ color: highlightCol === 'collected' ? '#00b49a' : '#64748b' }}>Collected</th>
                <th className="text-right px-3 py-3 text-xs font-medium"
                  style={{ color: highlightCol === 'ar' ? '#f87171' : '#64748b' }}>Closing AR</th>
                <th className="text-right px-3 py-3 text-xs font-medium"
                  style={{ color: highlightCol === 'eff' ? '#fbbf24' : '#64748b' }}>
                  {effToggle === 'monthly' ? 'Efficiency' : '3M Efficiency'}
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: '#64748b' }}>Invoices</th>
              </tr>
            </thead>
            <tbody>
              {withRolling.map(m => {
                const eff = effToggle === 'monthly' ? m.collectionEfficiency : m.eff3m;
                return (
                  <tr key={m.month} className="hover:bg-slate-800 transition-colors"
                    style={{ borderBottom: '1px solid #0b0f14' }}>
                    <td className="px-4 py-3 text-xs font-mono font-medium" style={{ color: '#94a3b8' }}>{m.label}</td>
                    <td className="px-3 py-3 text-right text-xs font-mono"
                      style={{ color: highlightCol === 'invoiced' ? '#60a5fa' : '#e2e8f0', fontWeight: highlightCol === 'invoiced' ? 600 : 400 }}>
                      {fmtCurrency(m.invoiced, true)}
                    </td>
                    <td className="px-3 py-3 text-right text-xs font-mono"
                      style={{ color: highlightCol === 'collected' ? '#00b49a' : '#e2e8f0', fontWeight: highlightCol === 'collected' ? 600 : 400 }}>
                      {fmtCurrency(m.collected, true)}
                    </td>
                    <td className="px-3 py-3 text-right text-xs font-mono"
                      style={{ color: highlightCol === 'ar' ? '#f87171' : '#e2e8f0', fontWeight: highlightCol === 'ar' ? 600 : 400 }}>
                      {fmtCurrency(m.closingAR, true)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: getEffColor(eff) + '22', color: getEffColor(eff) }}>
                        {fmtPct(eff)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono" style={{ color: '#64748b' }}>{m.invoiceCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mini charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* DSO trend */}
        <div className="p-5 rounded-xl" style={{ backgroundColor: '#161d2b', border: '1px solid #1e293b' }}>
          <h3 className="font-semibold text-white mb-4">DSO Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line type="monotone" dataKey="DSO" stroke="#fbbf24" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Collection efficiency trend */}
        <div className="p-5 rounded-xl" style={{ backgroundColor: '#161d2b', border: '1px solid #1e293b' }}>
          <h3 className="font-semibold text-white mb-1">Collection Efficiency Trend</h3>
          <div className="flex gap-2 mb-3">
            {(['monthly', '3m'] as const).map(k => (
              <button
                key={k}
                onClick={() => setEffToggle(k)}
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  backgroundColor: effToggle === k ? '#00b49a22' : 'transparent',
                  color: effToggle === k ? '#00b49a' : '#64748b',
                  border: `1px solid ${effToggle === k ? '#00b49a44' : 'transparent'}`,
                }}
              >
                {k === 'monthly' ? 'Monthly' : '3M Rolling'}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(v: number) => `${v.toFixed(1)}%`}
              />
              <Line type="monotone" dataKey="Efficiency" stroke="#00b49a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
