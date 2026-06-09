interface AgingBarProps {
  b0_30: number;
  b31_60: number;
  b61_90: number;
  b90p: number;
  total: number;
  compact?: boolean;
}

export function AgingBar({ b0_30, b31_60, b61_90, b90p, total, compact = false }: AgingBarProps) {
  if (total === 0) return <div className="w-full h-2 rounded-full" style={{backgroundColor: '#1e293b'}}></div>;
  
  const pcts = {
    b0_30: (b0_30 / total) * 100,
    b31_60: (b31_60 / total) * 100,
    b61_90: (b61_90 / total) * 100,
    b90p: (b90p / total) * 100,
  };
  
  const height = compact ? 'h-2' : 'h-3';

  return (
    <div className={`w-full ${height} flex rounded-full overflow-hidden`}>
      {pcts.b0_30 > 0 && (
        <div style={{width: `${pcts.b0_30}%`, backgroundColor: '#60a5fa'}} title={`0-30d: ${pcts.b0_30.toFixed(1)}%`}></div>
      )}
      {pcts.b31_60 > 0 && (
        <div style={{width: `${pcts.b31_60}%`, backgroundColor: '#fbbf24'}} title={`31-60d: ${pcts.b31_60.toFixed(1)}%`}></div>
      )}
      {pcts.b61_90 > 0 && (
        <div style={{width: `${pcts.b61_90}%`, backgroundColor: '#f97316'}} title={`61-90d: ${pcts.b61_90.toFixed(1)}%`}></div>
      )}
      {pcts.b90p > 0 && (
        <div style={{width: `${pcts.b90p}%`, backgroundColor: '#f87171'}} title={`>90d: ${pcts.b90p.toFixed(1)}%`}></div>
      )}
    </div>
  );
}
