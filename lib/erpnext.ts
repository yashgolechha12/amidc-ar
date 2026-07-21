// ERPNext API helper — server-side only
const ERPNEXT_URL = (process.env.ERPNEXT_URL || 'https://amidc.frappe.cloud').replace(/\/$/,'');
const ERPNEXT_TOKEN = process.env.ERPNEXT_TOKEN || '';
const EXCLUDED = ['Ati Motors Inc.', 'ATI MOTORS ROBOTS S DE RL DE CV'];

export interface SalesInvoice {
    name: string; customer: string; posting_date: string; due_date: string;
    grand_total: number; outstanding_amount: number; status: string;
    custom_customer_location: string; po_no: string;
}
export interface PaymentEntry {
    name: string; party: string; posting_date: string;
    paid_amount: number; unallocated_amount: number; payment_type: string;
}
export interface DashboardData {
    invoices: SalesInvoice[]; payments: PaymentEntry[]; fetchedAt: string;
}

async function erpGet(path: string): Promise<{data: unknown[]}> {
    const res = await fetch(ERPNEXT_URL + path, {
          headers: { Authorization: 'token ' + ERPNEXT_TOKEN, Accept: 'application/json' },
          cache: 'no-store',
    });
    if (!res.ok) {
          const b = await res.text().catch(() => '');
          throw new Error('ERPNext ' + res.status + ' ' + res.statusText + ' — ' + b.slice(0,300));
    }
    return res.json() as Promise<{data: unknown[]}>;
}

async function fetchAll<T>(
    doctype: string, fields: string[],
    filters: Array<[string, string, unknown]> = [], page = 200
  ): Promise<T[]> {
    const all: T[] = [];
    let start = 0;
    while (true) {
          const qs = 'fields=' + encodeURIComponent(JSON.stringify(fields))
            + (filters.length ? '&filters=' + encodeURIComponent(JSON.stringify(filters)) : '')
            + '&limit_start=' + start + '&limit_page_length=' + page + '&order_by=name+asc';
          const { data } = await erpGet('/api/resource/' + encodeURIComponent(doctype) + '?' + qs);
          const rows = (data || []) as T[];
          all.push(...rows);
          if (rows.length < page) break;
          start += page;
    }
    return all;
}

export async function fetchDashboardData(): Promise<DashboardData> {
    const [inv, pay] = await Promise.all([
          fetchAll<SalesInvoice>('Sales Invoice',
                                       ['name','customer','posting_date','due_date','grand_total','outstanding_amount','status','custom_customer_location','po_no'],
                                       [['docstatus','=',1]]),
          fetchAll<PaymentEntry>('Payment Entry',
                                       ['name','party','posting_date','paid_amount','unallocated_amount','payment_type'],
                                       [['docstatus','=',1],['payment_type','=','Receive']]),
        ]);
    return {
          invoices: inv.filter(inv => !EXCLUDED.includes(inv.customer)),
          payments: pay.filter(pay => !EXCLUDED.includes(pay.party)),
          fetchedAt: new Date().toISOString(),
    };
}
