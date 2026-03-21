export function formatINR(num: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function compactINR(n: number): string {
  const a = Math.abs(n);
  const s = n < 0 ? '-' : '';
  if (a >= 1e7) return s + '₹' + (a / 1e7).toFixed(2) + ' Cr';
  if (a >= 1e5) return s + '₹' + (a / 1e5).toFixed(2) + ' L';
  return s + '₹' + new Intl.NumberFormat('en-IN').format(Math.round(a));
}

export function pct(n: number, decimals = 2): string {
  return (n * 100).toFixed(decimals) + '%';
}

export function shortFundName(name: string): string {
  return name
    .replace(/ - (Regular|Direct) Plan/i, '')
    .replace(/ - Growth/i, '')
    .replace(/ Fund$/i, '')
    .replace(/Prudential /i, '')
    .trim();
}
