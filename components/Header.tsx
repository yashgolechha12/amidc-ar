'use client';
import { useRouter } from 'next/navigation';

const TABS = [
  'Overview',
  'Customer Ageing',
  'Customer Drill-down',
  'Collections Queue',
  'Monthly MIS',
];

interface HeaderProps {
  loading: boolean;
  fetchedAt: Date | null;
  onRefresh: () => void;
  activeTab: number;
  onTabChange: (tab: number) => void;
  tabCounts: (number | null)[];
}

export default function Header({ loading, fetchedAt, onRefresh, activeTab, onTabChange, tabCounts }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{backgroundColor: '#161d2b', borderColor: '#1e293b', height: '64px'}}>
      <div className="max-w-screen-2xl mx-auto h-full px-4 md:px-6 flex items-center gap-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{background: 'linear-gradient(135deg, #00b49a, #0284c7)'}}>
            AT
          </div>
          <div className="hidden sm:block">
            <p className="font-semibold text-white text-sm leading-tight">AMIDC Automation</p>
            <p className="text-xs leading-tight" style={{color: '#64748b'}}>Accounts Receivable</p>
          </div>
        </div>

        {/* Center: Tab navigation */}
        <nav className="flex-1 flex items-center justify-center gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((tab, i) => (
            <button
              key={i}
              onClick={() => onTabChange(i)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
              style={{
                backgroundColor: activeTab === i ? 'rgba(0,180,154,0.15)' : 'transparent',
                color: activeTab === i ? '#00b49a' : '#94a3b8',
                border: activeTab === i ? '1px solid rgba(0,180,154,0.3)' : '1px solid transparent',
              }}
            >
              {tab}
              {tabCounts[i] !== null && tabCounts[i] !== undefined && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-mono"
                  style={{
                    backgroundColor: activeTab === i ? 'rgba(0,180,154,0.2)' : 'rgba(100,116,139,0.2)',
                    color: activeTab === i ? '#00b49a' : '#64748b',
                    fontSize: '10px',
                  }}>
                  {tabCounts[i]}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Right: Live indicator + actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Live indicator */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: loading ? '#fbbf24' : '#00b49a',
                boxShadow: loading ? '0 0 6px #fbbf24' : '0 0 6px #00b49a',
              }}></div>
            {fetchedAt && !loading && (
              <div className="text-right">
                <p className="text-xs font-mono" style={{color: '#64748b', fontSize: '10px'}}>
                  {formatDate(fetchedAt)}
                </p>
                <p className="text-xs font-mono" style={{color: '#94a3b8', fontSize: '10px'}}>
                  {formatTime(fetchedAt)}
                </p>
              </div>
            )}
            {loading && (
              <span className="text-xs" style={{color: '#fbbf24', fontSize: '10px'}}>Loading...</span>
            )}
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              backgroundColor: 'rgba(0,180,154,0.1)',
              color: '#00b49a',
              border: '1px solid rgba(0,180,154,0.2)',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <svg className={`w-3 h-3 ${loading ? 'spinner' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              backgroundColor: 'rgba(248,113,113,0.1)',
              color: '#f87171',
              border: '1px solid rgba(248,113,113,0.2)',
            }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
