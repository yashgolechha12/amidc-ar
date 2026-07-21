import type { SalesInvoice, PaymentEntry } from './erpnext';

export interface AgingBuckets {
    b0_30: number;   // 0-30 days
  b31_60: number;  // 31-60 days
  b61_90: number;  // 61-90 days
  b90p: number;    // >90 days
}

export interface POGroup {
    poNo: string;
    outstanding: number;
    totalInvoiced: number;
    openInvoices: number;
    invoices: SalesInvoice[];
}

export interface LocationGroup {
    location: string;
    outstanding: number;
    totalInvoiced: number;
    openInvoices: number;
    poGroups: POGroup[];
}

export interface CustomerData {
    customer: string;
    outstanding: number;
    totalInvoiced: number;
    totalPaid: number;
    collectionRate: number;
    openInvoices: number;
    unallocated: number;
    aging: AgingBuckets;
    invoices: SalesInvoice[];
    locations: LocationGroup[];
}

export interface MonthlyData {
    month: string; // YYYY-MM
  label: string; // e.g. "Jan 2025"
  invoiced: number;
    collected: number;
    closingAR: number;
    collectionEfficiency: number;
    invoiceCount: number;
    dso: number;
}

export interface DashboardStats {
    totalOutstanding: number;
    dso: number;
    collectionRate: number;
    collectionRate3M: number;
    expectedInflow: number;
    unallocatedCredits: number;
    aging: AgingBuckets;
    overdueCount: number;
    unpaidCount: number;
    paidCount: number;
    partlyPaidCount: number;
    customers: CustomerData[];
    monthly: MonthlyData[];
    fetchedAt: string;
}


function getDaysBucket(daysOverdue: number): keyof AgingBuckets {
  if (daysOverdue <= 0) return 'b0_30'; // Due in future -> 0-30 bucket
if (daysOverdue <= 30) return 'b0_30';
  if (daysOverdue <= 60) return 'b31_60';
  if (daysOverdue <= 90) return 'b61_90';
  return 'b90p';
}

function getDaysOverdue(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - due.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getMonthKey(dateStr: string): string {
  return dateStr.substring(0, 7); // YYYY-MM
}

function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function computeDashboardStats(
  invoices: SalesInvoice[],
  payments: PaymentEntry[],
  fetchedAt: string
  ): DashboardStats {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

const activeInvoices = invoices.filter(inv =>
  inv.outstanding_amount > 0 && inv.status !== 'Cancelled'
                                       );

const totalOutstanding = activeInvoices.reduce((sum, inv) => sum + (inv.outstanding_amount || 0), 0);

const revenueLast90 = invoices
  .filter(inv => new Date(inv.posting_date) >= ninetyDaysAgo && inv.status !== 'Cancelled')
  .reduce((sum, inv) => sum + (inv.grand_total || 0), 0);

const dso = revenueLast90 > 0 ? Math.round(totalOutstanding / (revenueLast90 / 90)) : 0;

const totalInvoiced = invoices
  .filter(inv => inv.status !== 'Cancelled')
  .reduce((sum, inv) => sum + (inv.grand_total || 0), 0);
  const collectionRate = totalInvoiced > 0
  ? ((totalInvoiced - totalOutstanding) / totalInvoiced) * 100
    : 0;

const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  const invoiced3M = invoices
  .filter(inv => new Date(inv.posting_date) >= threeMonthsAgo && inv.status !== 'Cancelled')
  .reduce((sum, inv) => sum + (inv.grand_total || 0), 0);
  const collected3M = payments
  .filter(pe => new Date(pe.posting_date) >= threeMonthsAgo)
  .reduce((sum, pe) => sum + (pe.paid_amount || 0), 0);
  const collectionRate3M = invoiced3M > 0 ? (collected3M / invoiced3M) * 100 : 0;

const expectedInflow = activeInvoices
  .filter(inv => {
    const due = new Date(inv.due_date);
    return due >= currentMonthStart && due <= currentMonthEnd;
  })
  .reduce((sum, inv) => sum + (inv.outstanding_amount || 0), 0);

const unallocatedCredits = payments
  .filter(pe => (pe.unallocated_amount || 0) > 0)
  .reduce((sum, pe) => sum + (pe.unallocated_amount || 0), 0);

const aging: AgingBuckets = { b0_30: 0, b31_60: 0, b61_90: 0, b90p: 0 };
  activeInvoices.forEach(inv => {
    const daysOverdue = getDaysOverdue(inv.due_date);
    const bucket = getDaysBucket(daysOverdue);
    aging[bucket] += inv.outstanding_amount || 0;
  });

const overdueCount = invoices.filter(inv =>
  inv.outstanding_amount > 0 && getDaysOverdue(inv.due_date) > 0
                                     ).length;
  const unpaidCount = invoices.filter(inv =>
    inv.status === 'Unpaid' && inv.outstanding_amount > 0
                                      ).length;
  const paidCount = invoices.filter(inv => inv.status === 'Paid').length;
  const partlyPaidCount = invoices.filter(inv => inv.status === 'Partly Paid').length;

const customerMap = new Map<string, CustomerData>();

activeInvoices.forEach(inv => {
  if (!customerMap.has(inv.customer)) {
    customerMap.set(inv.customer, {
      customer: inv.customer,
      outstanding: 0,
      totalInvoiced: 0,
      totalPaid: 0,
      collectionRate: 0,
      openInvoices: 0,
      unallocated: 0,
      aging: { b0_30: 0, b31_60: 0, b61_90: 0, b90p: 0 },
      invoices: [],
      locations: [],
    });
  }
  const c = customerMap.get(inv.customer)!;
  c.outstanding += inv.outstanding_amount || 0;
  c.openInvoices++;
  const daysOverdue = getDaysOverdue(inv.due_date);
  const bucket = getDaysBucket(daysOverdue);
  c.aging[bucket] += inv.outstanding_amount || 0;
  c.invoices.push(inv);
});

invoices
  .filter(inv => inv.status !== 'Cancelled')
  .forEach(inv => {
    if (customerMap.has(inv.customer)) {
      const c = customerMap.get(inv.customer)!;
      c.totalInvoiced += inv.grand_total || 0;
    }
  });

payments
  .filter(pe => (pe.unallocated_amount || 0) > 0)
  .forEach(pe => {
    if (customerMap.has(pe.party)) {
      customerMap.get(pe.party)!.unallocated += pe.unallocated_amount;
    }
  });

customerMap.forEach(c => {
  c.totalPaid = c.totalInvoiced - c.outstanding;
  c.collectionRate = c.totalInvoiced > 0
  ? (c.totalPaid / c.totalInvoiced) * 100
    : 0;
});


customerMap.forEach(c => {
  const locationMap = new Map<string, LocationGroup>();
  c.invoices.forEach(inv => {
    const locKey = inv.custom_customer_location || 'Unspecified Location';
    if (!locationMap.has(locKey)) {
      locationMap.set(locKey, {
        location: locKey,
        outstanding: 0,
        totalInvoiced: 0,
        openInvoices: 0,
        poGroups: [],
      });
    }
    const loc = locationMap.get(locKey)!;
    loc.outstanding += inv.outstanding_amount || 0;
    loc.totalInvoiced += inv.grand_total || 0;
    loc.openInvoices++;

                     const poKey = inv.po_no || 'No PO Number';
    let po = loc.poGroups.find(p => p.poNo === poKey);
    if (!po) {
      po = { poNo: poKey, outstanding: 0, totalInvoiced: 0, openInvoices: 0, invoices: [] };
      loc.poGroups.push(po);
    }
    po.outstanding += inv.outstanding_amount || 0;
    po.totalInvoiced += inv.grand_total || 0;
    po.openInvoices++;
    po.invoices.push(inv);
  });

                    c.locations = Array.from(locationMap.values()).sort((a, b) => b.outstanding - a.outstanding);
  c.locations.forEach(loc => loc.poGroups.sort((a, b) => b.outstanding - a.outstanding));
});

const customers = Array.from(customerMap.values()).sort((a, b) => b.outstanding - a.outstanding);

const monthlyMap = new Map<string, { invoiced: number; collected: number; count: number }>();

for (let i = 11; i >= 0; i--) {
  const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  monthlyMap.set(key, { invoiced: 0, collected: 0, count: 0 });
}

invoices
  .filter(inv => inv.status !== 'Cancelled')
  .forEach(inv => {
    const key = getMonthKey(inv.posting_date);
    if (monthlyMap.has(key)) {
      const m = monthlyMap.get(key)!;
      m.invoiced += inv.grand_total || 0;
      m.count++;
    }
  });

payments.forEach(pe => {
  const key = getMonthKey(pe.posting_date);
  if (monthlyMap.has(key)) {
    monthlyMap.get(key)!.collected += pe.paid_amount || 0;
  }
});

let runningAR = 0;
  const monthly: MonthlyData[] = [];

monthlyMap.forEach((data, key) => {
  runningAR = runningAR + data.invoiced - data.collected;
  if (runningAR < 0) runningAR = 0;

                   const efficiency = data.invoiced > 0 ? (data.collected / data.invoiced) * 100 : 0;

                   const monthDSO = data.invoiced > 0 ? Math.round(runningAR / (data.invoiced / 30)) : 0;

                   monthly.push({
                     month: key,
                     label: getMonthLabel(key),
                     invoiced: data.invoiced,
                     collected: data.collected,
                     closingAR: runningAR,
                     collectionEfficiency: efficiency,
                     invoiceCount: data.count,
                     dso: monthDSO,
                   });
});

return {
  totalOutstanding,
  dso,
  collectionRate,
  collectionRate3M,
  expectedInflow,
  unallocatedCredits,
  aging,
  overdueCount,
  unpaidCount,
  paidCount,
  partlyPaidCount,
  customers,
  monthly,
  fetchedAt,
};
}
