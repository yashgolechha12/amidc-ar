// ERPNext API helper - server-side only
const ERPNEXT_URL = process.env.ERPNEXT_URL || 'https://amidc.frappe.cloud';
const ERPNEXT_TOKEN = process.env.ERPNEXT_TOKEN || '';

const EXCLUDED_CUSTOMERS = ['Ati Motors Inc.', 'ATI MOTORS ROBOTS S DE RL DE CV'];

async function erpFetch(endpoint: string): Promise<unknown> {
  const url = `${ERPNEXT_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `token ${ERPNEXT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 0 }, // Always fresh
  });
  if (!res.ok) {
    throw new Error(`ERPNext API error: ${res.status} ${res.statusText} for ${endpoint}`);
  }
  return res.json();
}

async function fetchAllPaginated<T>(
  doctype: string,
  fields: string[],
  filters: Array<unknown> = [],
  limit = 200
): Promise<T[]> {
  const results: T[] = [];
  let start = 0;
  
  while (true) {
    const params = new URLSearchParams({
      doctype,
      fields: JSON.stringify(fields),
      filters: JSON.stringify(filters),
      limit_start: String(start),
      limit_page_length: String(limit),
      order_by: 'name asc',
    });
    
    const data = await erpFetch(`/api/resource/${doctype}?${params}`) as { data: T[] };
    const records = data.data || [];
    results.push(...records);
    
    if (records.length < limit) break;
    start += limit;
  }
  
  return results;
}

export interface SalesInvoice {
  name: string;
  customer: string;
  posting_date: string;
  due_date: string;
  grand_total: number;
  outstanding_amount: number;
  status: string;
}

export interface PaymentEntry {
  name: string;
  party: string;
  posting_date: string;
  paid_amount: number;
  unallocated_amount: number;
  payment_type: string;
}

export interface DashboardData {
  invoices: SalesInvoice[];
  payments: PaymentEntry[];
  fetchedAt: string;
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const invoiceFields = [
    'name', 'customer', 'posting_date', 'due_date',
    'grand_total', 'outstanding_amount', 'status'
  ];
  
  const invoiceFilters = [
    ['docstatus', '=', 1],
    ['customer', 'not in', EXCLUDED_CUSTOMERS],
  ];
  
  const paymentFields = [
    'name', 'party', 'posting_date', 'paid_amount',
    'unallocated_amount', 'payment_type'
  ];
  
  const paymentFilters = [
    ['docstatus', '=', 1],
    ['payment_type', '=', 'Receive'],
    ['party_type', '=', 'Customer'],
    ['party', 'not in', EXCLUDED_CUSTOMERS],
  ];
  
  const [invoices, payments] = await Promise.all([
    fetchAllPaginated<SalesInvoice>('Sales Invoice', invoiceFields, invoiceFilters),
    fetchAllPaginated<PaymentEntry>('Payment Entry', paymentFields, paymentFilters),
  ]);
  
  return {
    invoices,
    payments,
    fetchedAt: new Date().toISOString(),
  };
}
