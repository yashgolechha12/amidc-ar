const ERPNEXT_URL = process.env.ERPNEXT_URL || 'https://amidc.frappe.cloud';
const ERPNEXT_TOKEN = process.env.ERPNEXT_TOKEN || '';
const EXCLUDED_CUSTOMERS = ['Ati Motors Inc.', 'ATI MOTORS ROBOTS S DE RL DE CV'];

async function erpFetch(endpoint) {
  const url = ERPNEXT_URL + endpoint;
  const res = await fetch(url, {
    headers: { 'Authorization': 'token ' + ERPNEXT_TOKEN, 'Content-Type': 'application/json' },
    next: { revalidate: 0 }
  });
  if (!res.ok) throw new Error('ERPNext API error: ' + res.status);
  return res.json();
}

async function fetchAllPaginated(doctype, fields, filters = [], limit = 200) {
  const results = [];
  let start = 0;
  while (true) {
    const params = new URLSearchParams();
    params.append('doctype', doctype);
    params.append('fields', JSON.stringify(fields));
    if (filters.length > 0) params.append('filters', JSON.stringify(filters));
    params.append('limit_start', start);
    params.append('limit_page_length', limit);
    params.append('order_by', 'name asc');
    const data = await erpFetch('/api/resource/' + doctype + '?' + params);
    const records = data.data || [];
    results.push(...records);
    if (records.length < limit) break;
    start += limit;
  }
  return results;
}

export async function fetchDashboardData() {
  const invoices = await fetchAllPaginated('Sales Invoice', ['name','customer','posting_date','due_date','grand_total','outstanding_amount','status'], [['docstatus','=',1]]);
  const payments = await fetchAllPaginated('Payment Entry', ['name','party','posting_date','paid_amount','unallocated_amount','payment_type'], [['docstatus','=',1],['payment_type','=','Receive']]);
  return {
    invoices: invoices.filter(i => !EXCLUDED_CUSTOMERS.includes(i.customer)),
    payments: payments.filter(p => !EXCLUDED_CUSTOMERS.includes(p.party)),
    fetchedAt: new Date().toISOString()
  };
}