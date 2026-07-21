'use client';
import { useState, useEffect, useMemo } from 'react';
import type { DashboardStats } from '@/lib/compute';
import { fmtCurrency, fmtPct } from '@/components/ui/formatters';
import { AgingBar } from '@/components/ui/AgingBar';

interface Props {
  stats: DashboardStats;
  initialCustomer: string;
}

function getDaysOverdue(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

function getDaysPending(postingDate: string): number {
  const today = new Date();
  const posted = new Date(postingDate);
  return Math.floor((today.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));
}

export default function TabDrilldown({ stats, initialCustomer }: Props) {
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomer || '');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedPO, setSelectedPO] = useState('');

  useEffect(() => {
    if (initialCustomer) setSelectedCustomer(initialCustomer);
  }, [initialCustomer]);

  useEffect(() => {
    setSelectedLocation('');
    setSelectedPO('');
  }, [selectedCustomer]);

  const customer = useMemo(
    () => stats.customers.find(c => c.customer === selectedCustomer),
    [stats, selectedCustomer]
  );

  const location = useMemo(
    () => customer?.locations.find(l => l.location === selectedLocation),
    [customer, selectedLocation]
  );

  const poGroup = useMemo(
    () => location?.poGroups.find(p => p.poNo === selectedPO),
    [location, selectedPO]
  );

  const agingTotal = customer
    ? customer.aging.b0_30 + customer.aging.b31_60 + customer.aging.b61_90 + customer.aging.b90p
    : 0;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      'Paid': { bg: '#34d39922', color: '#34d399' },
      'Unpaid': { bg: '#fbbf2422', color: '#fbbf24' },
      'Overdue': { bg: '#f8717122', color: '#f87171' },
      'Partly Paid': { bg: '#60a5fa22', color: '#60a5fa' },
    };
    const s = styles[status] || { bg: '#64748b22', color: '#64748b' };
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
        style={{ backgroundColor: s.bg, color: s.color }}>
        {status}
      </span>
    );
  };

  const getDaysBadge = (daysOverdue: number) => {
    if (daysOverdue > 90) return <span className="font-mono text-xs" style={{ color: '#f87171' }}>+{daysOverdue}d</span>;
    if (daysOverdue > 30) return <span className="font-mono text-xs" style={{ color: '#fbbf24' }}>+{daysOverdue}d</span>;
    if (daysOverdue > 0) return <span className="font-mono text-xs" style={{ color: '#f97316' }}>+{daysOverdue}d</span>;
    return <span className="font-mono text-xs" style={{ color: '#34d399' }}>{daysOverdue}d</span>;
  };

  return (
    <div className="space-y-4 pt-4">
      {/* Customer selector */}
      <div className="flex items-center gap-3">
        <select
          value={selectedCustomer}
          onChange={e => setSelectedCustomer(e.target.value)}
          className="px-4 py-2 rounded-lg text-sm text-white outline-none max-w-lg w-full"
          style={{ backgroundColor: '#161d2b', border: '1px solid #1e293b' }}
        >
          <option value="">— Select a customer —</option>
          {stats.customers.map(c => (
            <option key={c.customer} value={c.customer}>{c.customer}</option>
          ))}
        </select>
      </div>

      {!customer && (
        <div className="py-16 text-center" style={{ color: '#64748b' }}>
          Select a customer to view their details
        </div>
      )}

      {customer && (
        <>
          {/* Customer banner */}
          <div className="p-5 rounded-xl" style={{ backgroundColor: '#161d2b', border: '1px solid #1e293b' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{customer.customer}</h2>
                {customer.unallocated > 0 && (
                  <div className="mt-2 px-3 py-1.5 rounded-lg inline-flex items-center gap-2"
                    style={{ backgroundColor: '#a78bfa22', border: '1px solid #a78bfa44' }}>
                    <span style={{ color: '#a78bfa' }}>💜</span>
                    <span className="text-xs" style={{ color: '#a78bfa' }}>
                      Unallocated credit: {fmtCurrency(customer.unallocated)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 4 summary tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#0b0f14', border: '1px solid #f8717133' }}>
                <p className="text-xs mb-1" style={{ color: '#64748b' }}>Outstanding</p>
                <p className="text-xl font-bold font-mono" style={{ color: '#f87171' }}>
                  {fmtCurrency(customer.outstanding, true)}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#0b0f14', border: '1px solid #00b49a33' }}>
                <p className="text-xs mb-1" style={{ color: '#64748b' }}>Collection Rate</p>
                <p className="text-xl font-bold font-mono" style={{ color: '#00b49a' }}>
                  {fmtPct(customer.collectionRate)}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#0b0f14', border: '1px solid #60a5fa33' }}>
                <p className="text-xs mb-1" style={{ color: '#64748b' }}>Open Invoices</p>
                <p className="text-xl font-bold font-mono" style={{ color: '#60a5fa' }}>
                  {customer.openInvoices}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#0b0f14', border: '1px solid #fbbf2433' }}>
                <p className="text-xs mb-1" style={{ color: '#64748b' }}>Total Invoiced</p>
                <p className="text-xl font-bold font-mono" style={{ color: '#fbbf24' }}>
                  {fmtCurrency(customer.totalInvoiced, true)}
                </p>
              </div>
            </div>

            {/* Aging breakdown */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { label: '0-30d', val: customer.aging.b0_30, color: '#60a5fa' },
                { label: '31-60d', val: customer.aging.b31_60, color: '#fbbf24' },
                { label: '61-90d', val: customer.aging.b61_90, color: '#f97316' },
                { label: '>90d', val: customer.aging.b90p, color: '#f87171' },
              ].map(({ label, val, color }) => (
                <div key={label} className="p-2 rounded-lg text-center"
                  style={{ backgroundColor: '#0b0f14', border: `1px solid ${color}33` }}>
                  <p className="text-xs mb-1" style={{ color: '#64748b' }}>{label}</p>
                  <p className="text-sm font-bold font-mono" style={{ color }}>{fmtCurrency(val, true)}</p>
                </div>
              ))}
            </div>

            <AgingBar
              b0_30={customer.aging.b0_30} b31_60={customer.aging.b31_60}
              b61_90={customer.aging.b61_90} b90p={customer.aging.b90p}
              total={agingTotal}
            />
          </div>

          {/* Customer Location selector */}
          <div className="flex items-center gap-3">
            <select
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
              className="px-4 py-2 rounded-lg text-sm text-white outline-none max-w-lg w-full"
              style={{ backgroundColor: '#161d2b', border: '1px solid #1e293b' }}
            >
              <option value="">— Select a customer location —</option>
              {customer.locations.map(l => (
                <option key={l.location} value={l.location}>
                  {l.location} ({fmtCurrency(l.outstanding, true)} outstanding)
                </option>
              ))}
            </select>
          </div>

          {!location && (
            <div className="py-10 text-center" style={{ color: '#64748b' }}>
              Select a customer location to drill down further
            </div>
          )}

          {location && (
            <>
              {/* Customer PO Number selector */}
              <div className="flex items-center gap-3">
                <select
                  value={selectedPO}
                  onChange={e => setSelectedPO(e.target.value)}
                  className="px-4 py-2 rounded-lg text-sm text-white outline-none max-w-lg w-full"
                  style={{ backgroundColor: '#161d2b', border: '1px solid #1e293b' }}
                >
                  <option value="">— Select a customer PO number —</option>
                  {location.poGroups.map(p => (
                    <option key={p.poNo} value={p.poNo}>
                      {p.poNo} ({fmtCurrency(p.outstanding, true)} outstanding)
                    </option>
                  ))}
                </select>
              </div>

              {!poGroup && (
                <div className="py-10 text-center" style={{ color: '#64748b' }}>
                  Select a customer PO number to view invoices
                </div>
              )}

              {poGroup && (
                <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#161d2b', border: '1px solid #1e293b' }}>
                  <div className="px-5 py-3 border-b" style={{ borderColor: '#1e293b' }}>
                    <h3 className="font-semibold text-white">Invoice Details</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: '1px solid #1e293b' }}>
                          <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: '#64748b' }}>Invoice #</th>
                          <th className="text-left px-3 py-3 text-xs font-medium" style={{ color: '#64748b' }}>Date</th>
                          <th className="text-left px-3 py-3 text-xs font-medium" style={{ color: '#64748b' }}>Due Date</th>
                          <th className="text-right px-3 py-3 text-xs font-medium" style={{ color: '#64748b' }}>Amount</th>
                          <th className="text-right px-3 py-3 text-xs font-medium" style={{ color: '#64748b' }}>Received</th>
                          <th className="text-right px-3 py-3 text-xs font-medium" style={{ color: '#64748b' }}>Outstanding</th>
                          <th className="text-right px-3 py-3 text-xs font-medium" style={{ color: '#64748b' }}>Days Pending</th>
                          <th className="text-right px-3 py-3 text-xs font-medium" style={{ color: '#64748b' }}>Overdue</th>
                          <th className="text-center px-3 py-3 text-xs font-medium" style={{ color: '#64748b' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {poGroup.invoices.map(inv => {
                          const daysOverdue = getDaysOverdue(inv.due_date);
                          const daysPending = getDaysPending(inv.posting_date);
                          const received = (inv.grand_total || 0) - (inv.outstanding_amount || 0);
                          return (
                            <tr key={inv.name} className="hover:bg-slate-800 transition-colors"
                              style={{ borderBottom: '1px solid #0b0f14' }}>
                              <td className="px-4 py-3 text-xs font-mono" style={{ color: '#00b49a' }}>{inv.name}</td>
                              <td className="px-3 py-3 text-xs" style={{ color: '#94a3b8' }}>{inv.posting_date}</td>
                              <td className="px-3 py-3 text-xs" style={{ color: '#94a3b8' }}>{inv.due_date}</td>
                              <td className="px-3 py-3 text-right text-xs font-mono" style={{ color: '#e2e8f0' }}>
                                {fmtCurrency(inv.grand_total)}
                              </td>
                              <td className="px-3 py-3 text-right text-xs font-mono" style={{ color: '#34d399' }}>
                                {received > 0 ? fmtCurrency(received) : '-'}
                              </td>
                              <td className="px-3 py-3 text-right text-xs font-mono" style={{ color: '#f87171' }}>
                                {inv.outstanding_amount > 0 ? fmtCurrency(inv.outstanding_amount) : '-'}
                              </td>
                              <td className="px-3 py-3 text-right text-xs font-mono" style={{ color: '#64748b' }}>
                                {daysPending}d
                              </td>
                              <td className="px-3 py-3 text-right">{getDaysBadge(daysOverdue)}</td>
                              <td className="px-3 py-3 text-center">{getStatusBadge(inv.status)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
