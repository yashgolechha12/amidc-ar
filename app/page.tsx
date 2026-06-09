'use client';
import { useState, useEffect, useCallback } from 'react';
import type { DashboardStats } from '@/lib/compute';
import Header from '@/components/Header';
import TabOverview from '@/components/tabs/TabOverview';
import TabCustomerAging from '@/components/tabs/TabCustomerAging';
import TabDrilldown from '@/components/tabs/TabDrilldown';
import TabCollections from '@/components/tabs/TabCollections';
import TabMIS from '@/components/tabs/TabMIS';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  
  // State for cross-tab navigation
  const [drilldownCustomer, setDrilldownCustomer] = useState<string>('');
  const [agingFilter, setAgingFilter] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard', { cache: 'no-store' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.details || errData.error || 'Failed to fetch data');
      }
      const data: DashboardStats = await res.json();
      setStats(data);
      setFetchedAt(new Date());
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleJumpToCustomer = (customer: string) => {
    setDrilldownCustomer(customer);
    setActiveTab(2);
  };

  const handleJumpToAging = (filter: string) => {
    setAgingFilter(filter);
    setActiveTab(1);
  };

  const tabCounts = stats ? [
    null, // Overview - no count
    stats.customers.length,
    null,
    stats.overdueCount + stats.customers.filter(c => {
      const today = new Date();
      return c.invoices.some(inv => {
        const due = new Date(inv.due_date);
        const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= -30 && diff <= 0;
      });
    }).length,
    stats.monthly.length,
  ] : [null, null, null, null, null];

  return (
    <div className="min-h-screen" style={{backgroundColor: '#0b0f14'}}>
      <Header
        loading={loading}
        fetchedAt={fetchedAt}
        onRefresh={fetchData}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabCounts={tabCounts}
      />
      
      <main className="pt-20 px-4 md:px-6 pb-8 max-w-screen-2xl mx-auto">
        {loading && !stats && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-teal-500 border-t-transparent spinner"
              style={{borderColor: '#00b49a', borderTopColor: 'transparent'}}></div>
            <p style={{color: '#64748b'}}>Loading dashboard data...</p>
          </div>
        )}
        
        {error && !stats && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="text-4xl">⚠️</div>
            <p className="text-lg font-semibold" style={{color: '#f87171'}}>Failed to load data</p>
            <p className="text-sm max-w-md text-center" style={{color: '#64748b'}}>{error}</p>
            <button
              onClick={fetchData}
              className="px-6 py-2 rounded-lg font-medium text-white"
              style={{backgroundColor: '#00b49a'}}
            >
              Retry
            </button>
          </div>
        )}
        
        {stats && (
          <>
            {activeTab === 0 && (
              <TabOverview
                stats={stats}
                loading={loading}
                onJumpToCustomer={handleJumpToCustomer}
                onJumpToAging={handleJumpToAging}
              />
            )}
            {activeTab === 1 && (
              <TabCustomerAging
                stats={stats}
                initialFilter={agingFilter}
                onFilterUsed={() => setAgingFilter('')}
                onJumpToCustomer={handleJumpToCustomer}
              />
            )}
            {activeTab === 2 && (
              <TabDrilldown
                stats={stats}
                initialCustomer={drilldownCustomer}
              />
            )}
            {activeTab === 3 && (
              <TabCollections
                stats={stats}
              />
            )}
            {activeTab === 4 && (
              <TabMIS
                stats={stats}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
