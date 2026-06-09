interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  color: string;
  onClick?: () => void;
}

export function KpiCard({ label, value, sub, color, onClick }: KpiCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl flex flex-col gap-1 ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
      style={{
        backgroundColor: '#161d2b',
        border: `1px solid ${color}33`,
      }}
    >
      <p className="text-xs font-medium" style={{color: '#64748b'}}>{label}</p>
      <p className="text-2xl font-bold font-mono" style={{color}}>{value}</p>
      {sub && <p className="text-xs" style={{color: '#64748b'}}>{sub}</p>}
    </div>
  );
}
