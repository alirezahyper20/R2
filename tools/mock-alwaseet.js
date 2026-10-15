'use strict';
// Local fake of the Al-Waseet Merchant API for demos and testing — no real shipments are created.
// Run: node tools/mock-alwaseet.js   (listens on :4010)
// Then start the app with ALWASEET_BASE_URL=http://localhost:4010/v1/merchant
// Move an order along: GET http://localhost:4010/__status?id=<qr_id>&status=4   (4 = delivered, 8 = returned)
const http = require('node:http');
const PORT = Number(process.env.MOCK_PORT || 4010);

const USER = { username: process.env.MOCK_USER || 'demo', password: process.env.MOCK_PASS || 'demo123' };
const TOKEN = '@@mock-token-123';
const cities = [{ id: '1', city_name: 'بغداد' }, { id: '2', city_name: 'البصرة' }, { id: '3', city_name: 'اربيل' }, { id: '4', city_name: 'النجف' }];
const regions = {
  1: [{ id: '101', region_name: 'المنصور' }, { id: '102', region_name: 'الكرادة' }, { id: '103', region_name: 'شارع فلسطين' }],
  2: [{ id: '201', region_name: 'العشار' }, { id: '202', region_name: 'الجزائر' }],
  3: [{ id: '301', region_name: 'عنكاوا' }], 4: [{ id: '401', region_name: 'الكوفة' }],
};
const sizes = [{ id: '1', size: 'عادي' }, { id: '2', size: 'كبير' }];
const statuses = [
  { id: '1', status: 'فعال' }, { id: '2', status: 'تم الاستلام من قبل المندوب' }, { id: '3', status: 'قيد التوصيل' },
  { id: '4', status: 'تم التسليم للزبون' }, { id: '5', status: 'مؤجل' }, { id: '6', status: 'لا يرد' },
  { id: '7', status: 'راجع الى المخزن' }, { id: '8', status: 'تم الارجاع الى التاجر' }, { id: '9', status: 'ملغي' },
];
const orders = new Map();
const invoices = new Map();
let nextQr = 38799216;
const pad = n => String(n).padStart(2, '0');
const ts = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };

const ok = data => ({ status: true, errNum: 'S000', msg: 'ok', ...(data !== undefined ? { data } : {}) });
const fail = (msg, errNum = '999') => ({ status: false, errNum, msg });

async function form(req) {
  // parse multipart/form-data with the built-in Request API
  const chunks = []; for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  const r = new Request('http://x', { method: 'POST', headers: { 'content-type': req.headers['content-type'] }, body: Buffer.concat(chunks) });
  const fd = await r.formData();
  return Object.fromEntries(fd.entries());
}

function view(o) {
  const st = statuses.find(s => s.id === o.status_id);
  return {
    client_name: o.client_name, client_mobile: o.client_mobile, items_number: o.items_number, created_at: o.created_at,
    city_name: cities.find(c => c.id === String(o.city_id))?.city_name || '', region_name: (regions[o.city_id] || []).find(r => r.id === String(o.region_id))?.region_name || '',
    status_id: o.status_id, status: st.status, price: String(o.price), location: o.location, issue_notes: o.issue_notes || 'لا يوجد',
    merchant_notes: o.merchant_notes || '', client_mobile2: o.client_mobile2 || '', updated_at: o.updated_at, city_id: String(o.city_id),
    region_id: String(o.region_id), replacement: String(o.replacement || 0), type_name: o.type_name, id: String(o.qr_id),
    has_merchant_fin_record: 0, deliver_confirmed_fin: o.status_id === '4' ? 1 : 0, delivery_price: String(o.company_price),
    package_size: sizes.find(s => s.id === String(o.package_size))?.size || 'عادي', merchant_invoice_id: o.invoice_id || '-1',
  };
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const send = (obj, code = 200) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
  const ep = url.pathname.replace(/^\/v1\/merchant\//, '');
  const authed = () => url.searchParams.get('token') === TOKEN;
  try {
    if (url.pathname === '/__status') {
      const o = orders.get(url.searchParams.get('id')); if (!o) return send(fail('no order'));
      o.status_id = url.searchParams.get('status'); o.updated_at = ts();
      if (url.searchParams.get('note')) o.issue_notes = url.searchParams.get('note');
      return send(ok(view(o)));
    }
    if (url.pathname === '/__invoice') {          // bundle all delivered, un-invoiced orders into an invoice
      const id = String(invoices.size + 1);
      const list = [...orders.values()].filter(o => o.status_id === '4' && !o.invoice_id);
      list.forEach(o => (o.invoice_id = id));
      invoices.set(id, { id, merchant_price: String(list.reduce((s, o) => s + o.price - o.company_price, 0)), delivered_orders_count: String(list.length),
        replacement_delivered_orders_count: '0', status: 'مرسلة الى التاجر', merchant_id: '5', updated_at: ts() });
      return send(ok(invoices.get(id)));
    }
    switch (ep) {
      case 'login': {
        const f = await form(req);
        return send(f.username === USER.username && f.password === USER.password ? ok({ token: TOKEN }) : fail('اسم المستخدم او كلمة المرور غير صحيحة', '21'));
      }
      case 'citys': return send(ok(cities));
      case 'regions': return send(ok(regions[url.searchParams.get('city_id')] || []));
      case 'package-sizes': return send(ok(sizes));
    }
    if (!authed()) return send(fail('token غير صالح', '21'));
    switch (ep) {
      case 'statuses': return send(ok(statuses));
      case 'create-order': {
        const f = await form(req);
        for (const k of ['client_name', 'client_mobile', 'city_id', 'region_id', 'location', 'type_name', 'items_number', 'price', 'package_size', 'replacement'])
          if (f[k] == null || f[k] === '') return send(fail(`الحقل ${k} مطلوب`, '102'));
        if (!/^\+9647\d{9}$/.test(f.client_mobile)) return send(fail('رقم الهاتف غير صحيح', '103'));
        const qr = String(nextQr++);
        const company_price = String(f.city_id) === '1' ? 5000 : 6000;
        const o = { ...f, price: Number(f.price), qr_id: qr, status_id: '1', company_price, created_at: ts(), updated_at: ts() };
        orders.set(qr, o);
        return send(ok([{ ...f, qr_id: Number(qr), id: Number(qr), company_price, merchant_price: o.price - company_price, cash_fee: 0,
          qr_link: `http://localhost:${PORT}/print?id=${qr}` }]));
      }
      case 'edit-order': {
        const f = await form(req); const o = orders.get(String(f.qr_id));
        if (!o) return send(fail('الطلب غير موجود')); if (o.status_id !== '1') return send(fail('لا يمكن تعديل الطلب بعد استلامه'));
        Object.assign(o, f, { price: Number(f.price), updated_at: ts() }); return send(ok());
      }
      case 'merchant-orders': return send(ok([...orders.values()].map(view)));
      case 'get-orders-by-ids-bulk': {
        const f = await form(req); const ids = String(f.ids || '').split(',').slice(0, 25);
        return send(ok(ids.map(i => orders.get(i.trim())).filter(Boolean).map(view)));
      }
      case 'get_merchant_invoices': return send(ok([...invoices.values()]));
      case 'get_merchant_invoice_orders': {
        const id = url.searchParams.get('invoice_id'); const i = invoices.get(id); if (!i) return send(fail('الفاتورة غير موجودة'));
        return send(ok({ invoice: [i], orders: [...orders.values()].filter(o => o.invoice_id === id).map(view) }));
      }
      case 'receive_merchant_invoice': {
        const i = invoices.get(url.searchParams.get('invoice_id')); if (!i) return send(fail('الفاتورة غير موجودة'));
        i.status = 'تم الاستلام من قبل التاجر'; i.updated_at = ts(); return send(ok());
      }
    }
    send(fail('not found', '404'), 404);
  } catch (e) { send(fail(e.message), 500); }
}).listen(PORT, () => console.log(`Mock Al-Waseet API on http://localhost:${PORT}/v1/merchant  (login: ${USER.username} / ${USER.password})`));
