'use client';
import { useState, useEffect, useMemo } from 'react';
import type { DashboardStats } from '@/lib/compute';
import { AgingBar } from '@/components/ui/AgingBar';
import { fmtCurrency } from '@/components/ui/formatters';

interface Props {
  stats: DashboardStats;
  initialFilter: string;
  onFilterUsed: () => void;
  onJumpToCustomer: (customer: string) => void;
}

type SortKey = 'outstanding' | 'b90p' | 'openInvoices' | 'name';

const FILTERS = [
  { key: 'all', label: 'All Customers', color: '#00b49a' },
  { key: 'critical', label: '🔴 Critically Overdue >90d', color: '#f87171' },
  { key: 'zero', label: '🚫 Zero-collection', color: '#fbbf24' },
  { key: 'unallocated', label: '💜 Unallocated Credits', color: '#a78bfa' },
];

export default function TabCustomerAging({ stats, initialFilter, onFilterUsed, onJumpToCustomer }: Props) {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['all']));
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('outstanding');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    if (initialFilter && initialFilter !== 'all') {
      setActiveFilters(new Set([initialFilter]));
      onFilterUsed();
    }
  }, [initialFilter, onFilterUsed]);

  const toggleFilter = (key: string) => {
    if (key === 'all') {
      setActiveFilters(new Set(['all']));
      return;
    }
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.delete('all');
      if (next.has(key)) {
        next.delete(key);
        if (next.size === 0) next.add('all');
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const clearAll = () => setActiveFilters(new Set(['all']));

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const filtered = useMemo(() => {
    let result = [...stats.customers];

    // Apply filters (AND logic)
    if (!activeFilters.has('all')) {
      if (activeFilters.has('critical')) {
        result = result.filter(c => c.aging.b90p > 0);
      }
      if (activeFilters.has('zero')) {
        result = result.filter(c => c.collectionRate === 0 && c.outstanding > 0);
      }
      if (activeFilters.has('unallocated')) {
        result = result.filter(c => c.unallocated > 0);
      }
    }

    // Search
    if (search) {
      result = result.filter(c => c.customer.toLowerCase().includes(search.toLowerCase()));
    }

    // Sort
    result.sort((a, b) => {
      let diff = 0;
      if (sortKey === 'outstanding') diff = b.outstanding - a.outstanding;
      else if (sortKey === 'b90p') diff = b.aging.b90p - a.aging.b90p;
      else if (sortKey === 'openInvoices') diff = b.openInvoices - a.openInvoices;
      else diff = a.customer.localeCompare(b.customer);
      return sortAsc ? -diff : diff;
    });

    return result;
  }, [stats, activeFilters, search, sortKey, sortAsc]);

  const SortIcon = ({ k }: { k: SortKey }) => sortKey === k ? (
    <span style={{color: '#00b49a'}}>{sortAsc ? ' ↑' : ' ↓'}</span>
  ) : null;

  return (
    <div className="space-y-4 pt-4">
      {/* Filter tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => toggleFilter(f.key)}
            className="p-3 rounded-xl text-left transition-all"
            style={{
              backgroundColor: activeFilters.has(f.key) ? `${f.color}22` : '#161d2b',
              border: `1px solid ${activeFilters.has(f.key) ? f.color + '66' : '#1e293b'}`,
            }}
          >
            <p className="text-xs font-medium" style={{color: activeFilters.has(f.key) ? f.color : '#94a3b8'}}>
              {f.label}
            </p>
            <p className="text-lg font-bold font-mono mt-1" style={{color: f.color}}>
              {f.key === 'all' && stats.customers.length}
              {f.key === 'critical' && stats.customers.filter(c => c.aging.b90p > 0).length}
              {f.key === 'zero' && stats.customers.filter(c => c.collectionRate === 0 && c.outstanding > 0).length}
              {f.key === 'unallocated' && stats.customers.filter(c => c.unallocated > 0).length}
            </p>
          </button>
        ))}
      </div>

      {/* Active filter chips */}
      {!activeFilters.has('all') && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs" style={{color: '#64748b'}}>Active filters:</span>
          {Array.from(activeFilters).map(f => (
            <span key={f} className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
              style={{backgroundColor: '#1e293b', color: '#94a3b8'}}>
              {FILTERS.find(fl => fl.key === f)?.label}
              <button onClick={() => toggleFilter(f)} style={{color: '#64748b'}}>×</button>
            </span>
          ))}
          <button onClick={clearAll} className="text-xs" style={{color: '#f87171'}}>Clear all</button>
        </div>
      )}

      {/* Search + Table */}
      <div className="rounded-xl" style={{backgroundColor: '#161d2b', border: '1px solid #1e293b'}}>
        <div className="p-4 border-b" style={{borderColor: '#1e293b'}}>
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-xs px-3 py-2 rounded-lg text-sm text-white outline-none"
            style={{backgroundColor: '#0b0f14', border: '1px solid #1e293b'}}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{borderBottom: '1px solid #1e293b'}}>
                <th className="text-left px-4 py-3 text-xs font-medium cursor-pointer"
                  style={{color: '#64748b'}} onClick={() => handleSort('name')}>
                  Customer <SortIcon k="name" />
                </th>
                <th className="text-right px-3 py-3 text-xs font-medium" style={{color: '#60a5fa'}}>0-30d</th>
                <th className="text-right px-3 py-3 text-xs font-medium" style={{color: '#fbbf24'}}>31-60d</th>
                <th className="text-right px-3 py-3 text-xs font-medium" style={{color: '#f97316'}}>61-90d</th>
                <th className="text-right px-3 py-3 text-xs font-medium" style={{color: '#f87171'}}>&gt;90d <SortIcon k="b90p" /></th>
                <th className="text-right px-3 py-3 text-xs font-medium cursor-pointer"
                  style={{color: '#94a3b8'}} onClick={() => handleSort('outstanding')}>
                  Outstanding <SortIcon k="outstanding" />
                </th>
                <th className="text-right px-3 py-3 text-xs font-medium" style={{color: '#a78bfa'}}>Unallocated</th>
                <th className="text-right px-3 py-3 text-xs font-medium cursor-pointer"
                  style={{color: '#94a3b8'}} onClick={() => handleSort('openInvoices')}>
                  Invoices <SortIcon k="openInvoices" />
                </th>
                <th className="text-center px-3 py-3 text-xs font-medium" style={{color: '#64748b'}}>Mix</th>
                <th className="px-4 py-3 text-xs font-medium" style={{color: '#64748b'}}>View</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.customer} className="hover:bg-slate-800 transition-colors"
                  style={{borderBottom: '1px solid #0b0f14'}}>
                  <td className="px-4 py-3 text-xs font-medium text-white max-w-[180px] truncate">{c.customer}</td>
                  <td className="px-3 py-3 text-right text-xs font-mono" style={{color: '#60a5fa'}}>
                    {c.aging.b0_30 > 0 ? fmtCurrency(c.aging.b0_30, true) : '-'}
                  </td>
                  <td className="px-3 py-3 text-right text-xs font-mono" style={{color: '#fbbf24'}}>
                    {c.aging.b31_60 > 0 ? fmtCurrency(c.aging.b31_60, true) : '-'}
                  </td>
                  <td className="px-3 py-3 text-right text-xs font-mono" style={{color: '#f97316'}}>
                    {c.aging.b61_90 > 0 ? fmtCurrency(c.aging.b61_90, true) : '-'}
                  </td>
                  <td className="px-3 py-3 text-right text-xs font-mono" style={{color: '#f87171'}}>
                    {c.aging.b90p > 0 ? fmtCurrency(c.aging.b90p, true) : '-'}
                  </td>
                  <td className="px-3 py-3 text-right text-xs font-mono font-semibold" style={{color: '#e2e8f0'}}>
                    {fmtCurrency(c.outstanding, true)}
                  </td>
                  <td className="px-3 py-3 text-right text-xs font-mono" style={{color: '#a78bfa'}}>
                    {c.unallocated > 0 ? fmtCurrency(c.unallocated, true) : '-'}
                  </td>
                  <td className="px-3 py-3 text-right text-xs font-mono" style={{color: '#94a3b8'}}>{c.openInvoices}</td>
                  <td className="px-3 py-3 w-24">
                    <AgingBar
                      b0_30={c.aging.b0_30} b31_60={c.aging.b31_60}
                      b61_90={c.aging.b61_90} b90p={c.aging.b90p}
                      total={c.outstanding} compact
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onJumpToCustomer(c.customer)}
                      className="text-xs px-2 py-1 rounded"
                      style={{color: '#00b49a', border: '1px solid #00b49a33'}}
                    >→</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-sm" style={{color: '#64748b'}}>
                    No customers match the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
