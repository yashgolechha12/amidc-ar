'use client';
import { useState, useMemo } from 'react';
import type { DashboardStats, CustomerData } from '@/lib/compute';
import type { SalesInvoice } from '@/lib/erpnext';
import { fmtCurrency } from '@/components/ui/formatters';

interface Props {
  stats: DashboardStats;
}

interface CollectionInvoice extends SalesInvoice {
  customerData: CustomerData;
  daysOverdue: number;
}

function getDaysOverdue(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

const TIERS = [
  { key: 'overdue', label: '🔴 Overdue', desc: 'Past due date', color: '#f87171', bgColor: '#f8717111' },
  { key: 'due7', label: '🟡 Due in 7 Days', desc: 'Due within 7 days', color: '#fbbf24', bgColor: '#fbbf2411' },
  { key: 'due30', label: '🟢 Due in 8-30 Days', desc: 'Due in 8-30 days', color: '#60a5fa', bgColor: '#60a5fa11' },
];

export default function TabCollections({ stats }: Props) {
  const [activeTier, setActiveTier] = useState<string | null>(null);

  const allInvoices = useMemo<CollectionInvoice[]>(() => {
    const result: CollectionInvoice[] = [];
    stats.customers.forEach(c => {
      c.invoices.forEach(inv => {
        if (inv.outstanding_amount > 0) {
          result.push({
            ...inv,
            customerData: c,
            daysOverdue: getDaysOverdue(inv.due_date),
          });
        }
      });
    });
    return result;
  }, [stats]);

  const tiers = useMemo(() => ({
    overdue: allInvoices.filter(inv => inv.daysOverdue > 0),
    due7: allInvoices.filter(inv => inv.daysOverdue <= 0 && inv.daysOverdue >= -7),
    due30: allInvoices.filter(inv => inv.daysOverdue < -7 && inv.daysOverdue >= -30),
  }), [allInvoices]);

  const tierCounts = {
    overdue: tiers.overdue.length,
    due7: tiers.due7.length,
    due30: tiers.due30.length,
  };

  const tierAmounts = {
    overdue: tiers.overdue.reduce((s, i) => s + i.outstanding_amount, 0),
    due7: tiers.due7.reduce((s, i) => s + i.outstanding_amount, 0),
    due30: tiers.due30.reduce((s, i) => s + i.outstanding_amount, 0),
  };

  const renderTable = (items: CollectionInvoice[], tierKey: string) => {
    const tier = TIERS.find(t => t.key === tierKey)!;
    const sorted = [...items].sort((a, b) => b.daysOverdue - a.daysOverdue);

    return (
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#161d2b', border: `1px solid ${tier.color}33` }}>
        <div className="px-5 py-3 border-b flex items-center justify-between"
          style={{ borderColor: tier.color + '22', backgroundColor: tier.bgColor }}>
          <h3 className="font-semibold text-sm" style={{ color: tier.color }}>{tier.label} — {tier.desc}</h3>
          <span className="text-xs font-mono" style={{ color: tier.color }}>
            {items.length} invoices · {fmtCurrency(tierAmounts[tierKey as keyof typeof tierAmounts], true)}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b' }}>
                <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#64748b' }}>Invoice #</th>
                <th className="text-left px-3 py-3 text-xs font-medium" style={{ color: '#64748b' }}>Customer</th>
                <th className="text-left px-3 py-3 text-xs font-medium" style={{ color: '#64748b' }}>Due Date</th>
                <th className="text-right px-3 py-3 text-xs font-medium" style={{ color: '#64748b' }}>Outstanding</th>
                <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: '#64748b' }}>
                  {tierKey === 'overdue' ? 'Days Overdue' : 'Days Remaining'}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 50).map(inv => (
                <tr key={inv.name} className="hover:bg-slate-800 transition-colors"
                  style={{ borderBottom: '1px solid #0b0f14' }}>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: '#00b49a' }}>{inv.name}</td>
                  <td className="px-3 py-3 text-xs text-white max-w-[180px] truncate">{inv.customer}</td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#94a3b8' }}>{inv.due_date}</td>
                  <td className="px-3 py-3 text-right text-xs font-mono" style={{ color: '#e2e8f0' }}>
                    {fmtCurrency(inv.outstanding_amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-mono font-semibold" style={{ color: tier.color }}>
                      {tierKey === 'overdue'
                        ? `+${inv.daysOverdue}d`
                        : `${Math.abs(inv.daysOverdue)}d`}
                    </span>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: '#64748b' }}>
                    No invoices in this tier
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const visibleTiers = activeTier ? [activeTier] : TIERS.map(t => t.key);

  return (
    <div className="space-y-4 pt-4">
      {/* Tier tiles */}
      <div className="grid grid-cols-3 gap-3">
        {TIERS.map(tier => (
          <button
            key={tier.key}
            onClick={() => setActiveTier(activeTier === tier.key ? null : tier.key)}
            className="p-4 rounded-xl text-left transition-all"
            style={{
              backgroundColor: activeTier === tier.key ? tier.bgColor : '#161d2b',
              border: `1px solid ${activeTier === tier.key ? tier.color + '66' : '#1e293b'}`,
            }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: tier.color }}>{tier.label}</p>
            <p className="text-2xl font-bold font-mono" style={{ color: tier.color }}>
              {tierCounts[tier.key as keyof typeof tierCounts]}
            </p>
            <p className="text-xs mt-1" style={{ color: '#64748b' }}>
              {fmtCurrency(tierAmounts[tier.key as keyof typeof tierAmounts], true)}
            </p>
          </button>
        ))}
      </div>

      {/* Active tier chips */}
      {activeTier && (
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: '#64748b' }}>Showing:</span>
          <span className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: '#1e293b', color: '#94a3b8' }}>
            {TIERS.find(t => t.key === activeTier)?.label}
          </span>
          <button onClick={() => setActiveTier(null)} className="text-xs" style={{ color: '#f87171' }}>
            Clear filter
          </button>
        </div>
      )}

      {/* Tables */}
      {visibleTiers.map(tierKey => (
        <div key={tierKey}>
          {renderTable(tiers[tierKey as keyof typeof tiers], tierKey)}
        </div>
      ))}
    </div>
  );
}
