export function fmtCurrency(val: number, compact = false): string {
  if (compact) {
    if (val >= 10000000) return '₹' + (val / 10000000).toFixed(2) + 'Cr';
    if (val >= 100000) return '₹' + (val / 100000).toFixed(2) + 'L';
    if (val >= 1000) return '₹' + (val / 1000).toFixed(1) + 'K';
    return '₹' + val.toFixed(0);
  }
  return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);
}

export function fmtPct(val: number): string {
  return val.toFixed(1) + '%';
}

export function fmtNumber(val: number): string {
  return new Intl.NumberFormat('en-IN').format(Math.round(val));
}
