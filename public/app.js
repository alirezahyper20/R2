'use strict';
/* Horn Store Manager — single-page front end (no build step, no libraries). */

// ============================ i18n ============================
const T = {
  ar: {
    app: 'إدارة متجر الهورنات', dashboard: 'الرئيسية', orders: 'الطلبات', products: 'المخزون', purchases: 'المشتريات',
    expenses: 'المصاريف', invoices: 'فواتير الوسيط', settings: 'الإعدادات', more: 'المزيد', logout: 'تسجيل الخروج', lang: 'English',
    login: 'تسجيل الدخول', setup_code: 'رمز الإعداد', aw_enter_first: 'أدخل اسم المستخدم وكلمة المرور الخاصة بالوسيط أولاً', aw_perm_help: 'تسجيل الدخول نجح لكن الوسيط رفض بعض الصلاحيات. تأكد أنك تستخدم حساب التاجر الرئيسي (وليس حساب موظف)، أو اطلب من الوسيط تفعيل الربط البرمجي (API) لحسابك.', username: 'اسم المستخدم', password: 'كلمة المرور', setup_title: 'إعداد الحساب لأول مرة',
    setup_sub: 'أنشئ حساب المدير لمتجرك', business_name: 'اسم المتجر', display_name: 'الاسم', create_account: 'إنشاء الحساب',
    login_sub: 'أدخل بياناتك للمتابعة',
    today: 'اليوم', d7: '7 أيام', this_month: 'هذا الشهر', last_month: 'الشهر الماضي', custom: 'مخصص', from: 'من', to: 'إلى', apply: 'تطبيق',
    revenue: 'الإيرادات', gross_profit: 'الربح الإجمالي', total_expenses: 'المصاريف', net_profit: 'صافي الربح', cogs: 'كلفة البضاعة المباعة',
    margin: 'الهامش', delivered_orders: 'طلبات مسلّمة', return_rate: 'نسبة الإرجاع', avg_order: 'متوسط الطلب', with_alwaseet: 'أموالك لدى الوسيط',
    inventory_value: 'قيمة المخزون', with_couriers: 'بضاعة مع المندوبين', units: 'قطعة', orders_n: 'طلب',
    daily_chart: 'الإيرادات وصافي الربح يومياً', pl: 'قائمة الأرباح والخسائر', expense_breakdown: 'توزيع المصاريف',
    low_stock: 'تنبيه: مخزون منخفض', top_products: 'الأكثر مبيعاً', open_orders: 'طلبات مفتوحة', no_data: 'لا توجد بيانات بعد',
    missing_cost_warn: '{n} طلب مسلّم بدون منتجات مرتبطة — الربح غير مكتمل.', fix_now: 'اربطها الآن',
    aw_not_set: 'لم يتم ربط حساب الوسيط بعد.', connect_now: 'اربطه من الإعدادات',
    cat_ads: 'إعلانات', cat_rent: 'إيجار', cat_salaries: 'رواتب', cat_bills: 'فواتير وخدمات', cat_packaging: 'تغليف', cat_returns: 'رسوم إرجاع',
    cat_delivery: 'أجور توصيل الوسيط', cat_other: 'أخرى', cat_write_offs: 'تالف/نقص مخزون',
    st_pending: 'عند التاجر', st_in_transit: 'قيد التوصيل', st_delivered: 'تم التسليم', st_returning: 'راجع', st_returned: 'مرتجع', st_cancelled: 'ملغي',
    all: 'الكل', search: 'بحث بالاسم، الهاتف، رقم الوصل…', new_order: 'طلب جديد', needs_products: 'بدون منتجات',
    customer: 'الزبون', phone: 'الهاتف', phone2: 'هاتف ثانٍ', city: 'المحافظة', region: 'المنطقة', location: 'أقرب نقطة دالة',
    items: 'المنتجات', product: 'المنتج', qty: 'العدد', unit_price: 'سعر القطعة', add_line: 'إضافة منتج', customer_delivery: 'أجور التوصيل على الزبون',
    total_price: 'المبلغ الكلي على الزبون', override_price: 'تعديل المبلغ يدوياً', package_size: 'حجم الطرد', notes: 'ملاحظات للمندوب',
    replacement: 'طلب استبدال', send_now: 'إرسال إلى الوسيط مباشرة', save: 'حفظ', cancel: 'إلغاء', close: 'إغلاق', create: 'إنشاء',
    select: 'اختر…', loading: 'جارِ التحميل…', status: 'الحالة', date: 'التاريخ', amount: 'المبلغ', actions: 'إجراءات',
    qr: 'رقم الوصل', delivery_fee: 'أجور الوسيط', print_label: 'طباعة الوصل', send_to_aw: 'إرسال للوسيط', edit: 'تعديل',
    cancel_order: 'إلغاء الطلب', delete: 'حذف', refresh_status: 'تحديث الحالة', link_products: 'ربط المنتجات', set_state: 'تغيير الحالة يدوياً',
    aw_status: 'حالة الوسيط', issue_notes: 'ملاحظة المندوب', source_aw: 'من تطبيق الوسيط', created: 'تاريخ الإنشاء', delivered_at: 'تاريخ التسليم',
    not_sent: 'لم يُرسل للوسيط', order_profit: 'ربح الطلب', confirm_cancel: 'إلغاء الطلب وإرجاع البضاعة للمخزون؟ إذا كان مُرسلاً للوسيط ألغِه في تطبيقهم أيضاً.',
    confirm_delete: 'حذف هذا الطلب نهائياً؟',
    sku: 'الرمز (SKU)', name_ar: 'الاسم بالعربي', name_en: 'الاسم بالإنكليزي', sale_price: 'سعر البيع', avg_cost: 'متوسط الكلفة', stock: 'المخزون',
    value: 'القيمة', low_stock_at: 'تنبيه عند', new_product: 'منتج جديد', opening_qty: 'الكمية الافتتاحية', opening_cost: 'كلفة القطعة',
    adjust_stock: 'تعديل المخزون', delta: 'التغيير (+ إضافة / − نقص)', reason: 'السبب', movements: 'حركة المخزون', unit_cost: 'كلفة القطعة',
    mv_purchase: 'شراء', mv_sale: 'بيع', mv_restock: 'إرجاع للمخزون', mv_adjust: 'تعديل', mv_opening: 'رصيد افتتاحي', inactive: 'غير فعّال', active: 'فعّال',
    new_purchase: 'شراء بضاعة', supplier: 'المورّد', total: 'المجموع', purchase_note: 'المشتريات تزيد المخزون وتحدّث متوسط الكلفة. لا تُحسب مصروفاً — الكلفة تُحسب عند بيع البضاعة.',
    new_expense: 'مصروف جديد', category: 'الفئة', note: 'ملاحظة', auto: 'تلقائي', confirm_delete_generic: 'هل أنت متأكد من الحذف؟',
    invoice: 'فاتورة', invoice_amount: 'المبلغ المستحق', delivered_count: 'طلبات مسلّمة', received: 'تم الاستلام', receive: 'تأكيد الاستلام',
    confirm_receive: 'تأكيد استلام مبلغ هذه الفاتورة من الوسيط؟', sync_now: 'مزامنة الآن', last_sync: 'آخر مزامنة', never: 'لم تتم',
    aw_account: 'حساب الوسيط', aw_user: 'اسم مستخدم الوسيط', aw_pass: 'كلمة مرور الوسيط', aw_pass_set: 'محفوظة — اتركها فارغة للإبقاء',
    test_conn: 'اختبار الاتصال', conn_ok: 'تم الاتصال بنجاح ✓', import_since: 'استيراد طلبات الوسيط المنشأة من تاريخ',
    sync_minutes: 'المزامنة التلقائية كل (دقيقة)', return_fee: 'رسوم الإرجاع للطلب (د.ع)', default_delivery: 'أجور التوصيل الافتراضية على الزبون',
    default_size: 'حجم الطرد الافتراضي', status_map: 'تصنيف حالات الوسيط', status_map_sub: 'كيف تؤثر كل حالة على المخزون والأرباح. يتم التصنيف تلقائياً ويمكنك تعديله.',
    users: 'المستخدمون', new_user: 'مستخدم جديد', role: 'الصلاحية', admin: 'مدير', staff: 'موظف', change_password: 'تغيير كلمة المرور',
    current_password: 'كلمة المرور الحالية', new_password: 'كلمة المرور الجديدة', export: 'تصدير (CSV)', saved: 'تم الحفظ', general: 'عام',
    sync_done: 'تمت المزامنة: {u} محدّث، {i} مستورد، {c} تغيّرت حالته', sync_log: 'سجل المزامنة', env_managed: 'تُدار من متغيرات البيئة على الخادم',
    order_created: 'تم إنشاء الطلب', order_sent: 'تم الإرسال للوسيط', aw_failed: 'حُفظ الطلب لكن فشل الإرسال للوسيط: ',
    not_enough_stock: 'المخزون غير كافٍ: ', allow_negative: 'إنشاء رغم نقص المخزون', staff_note: 'حسابك موظف — التقارير المالية للمدير فقط.',
    period_pl: 'للفترة', receivable_sub: '{n} طلب مسلّم لم تُستلم فاتورته', units_sold: 'قطع مباعة', page: 'صفحة', prev: 'السابق', next: 'التالي',
    gross_profit_short: 'ربح إجمالي', expenses_sub: 'شاملة أجور التوصيل', revenue_sub: 'من الطلبات المسلّمة', welcome: 'أهلاً',
  },
  en: {
    app: 'Horn Store Manager', dashboard: 'Dashboard', orders: 'Orders', products: 'Inventory', purchases: 'Purchases',
    expenses: 'Expenses', invoices: 'Al-Waseet invoices', settings: 'Settings', more: 'More', logout: 'Log out', lang: 'العربية',
    login: 'Log in', setup_code: 'Setup code', aw_enter_first: 'Enter your Al-Waseet username and password first', aw_perm_help: 'Login worked but Al-Waseet refused some access. Make sure this is the main merchant account (not a staff/merchant-user account), or ask Al-Waseet to enable API integration for your account.', username: 'Username', password: 'Password', setup_title: 'First-time setup',
    setup_sub: 'Create the admin account for your store', business_name: 'Store name', display_name: 'Your name', create_account: 'Create account',
    login_sub: 'Enter your details to continue',
    today: 'Today', d7: '7 days', this_month: 'This month', last_month: 'Last month', custom: 'Custom', from: 'From', to: 'To', apply: 'Apply',
    revenue: 'Revenue', gross_profit: 'Gross profit', total_expenses: 'Expenses', net_profit: 'Net profit', cogs: 'Cost of goods sold',
    margin: 'margin', delivered_orders: 'Delivered orders', return_rate: 'Return rate', avg_order: 'Avg. order', with_alwaseet: 'Money with Al-Waseet',
    inventory_value: 'Inventory value', with_couriers: 'Stock with couriers', units: 'units', orders_n: 'orders',
    daily_chart: 'Daily revenue & net profit', pl: 'Profit & loss', expense_breakdown: 'Expense breakdown',
    low_stock: 'Low stock alert', top_products: 'Best sellers', open_orders: 'Open orders', no_data: 'No data yet',
    missing_cost_warn: '{n} delivered orders have no products linked — profit is incomplete.', fix_now: 'Link them now',
    aw_not_set: 'Your Al-Waseet account is not connected yet.', connect_now: 'Connect it in Settings',
    cat_ads: 'Ads', cat_rent: 'Rent', cat_salaries: 'Salaries', cat_bills: 'Bills & utilities', cat_packaging: 'Packaging', cat_returns: 'Return fees',
    cat_delivery: 'Al-Waseet delivery fees', cat_other: 'Other', cat_write_offs: 'Stock write-offs',
    st_pending: 'At merchant', st_in_transit: 'In transit', st_delivered: 'Delivered', st_returning: 'Returning', st_returned: 'Returned', st_cancelled: 'Cancelled',
    all: 'All', search: 'Search name, phone, receipt no…', new_order: 'New order', needs_products: 'No products',
    customer: 'Customer', phone: 'Phone', phone2: 'Second phone', city: 'Province', region: 'Area', location: 'Nearest landmark',
    items: 'Products', product: 'Product', qty: 'Qty', unit_price: 'Unit price', add_line: 'Add product', customer_delivery: 'Delivery charge to customer',
    total_price: 'Total charged to customer', override_price: 'Set total manually', package_size: 'Package size', notes: 'Notes for driver',
    replacement: 'Replacement order', send_now: 'Send to Al-Waseet now', save: 'Save', cancel: 'Cancel', close: 'Close', create: 'Create',
    select: 'Select…', loading: 'Loading…', status: 'Status', date: 'Date', amount: 'Amount', actions: 'Actions',
    qr: 'Receipt no.', delivery_fee: 'Al-Waseet fee', print_label: 'Print label', send_to_aw: 'Send to Al-Waseet', edit: 'Edit',
    cancel_order: 'Cancel order', delete: 'Delete', refresh_status: 'Refresh status', link_products: 'Link products', set_state: 'Set state manually',
    aw_status: 'Al-Waseet status', issue_notes: 'Driver note', source_aw: 'From Al-Waseet app', created: 'Created', delivered_at: 'Delivered',
    not_sent: 'Not sent to Al-Waseet', order_profit: 'Order profit', confirm_cancel: 'Cancel this order and return items to stock? If it was sent to Al-Waseet, cancel it in their app too.',
    confirm_delete: 'Delete this order permanently?',
    sku: 'SKU', name_ar: 'Arabic name', name_en: 'English name', sale_price: 'Sale price', avg_cost: 'Avg. cost', stock: 'Stock',
    value: 'Value', low_stock_at: 'Alert at', new_product: 'New product', opening_qty: 'Opening quantity', opening_cost: 'Unit cost',
    adjust_stock: 'Adjust stock', delta: 'Change (+ add / − remove)', reason: 'Reason', movements: 'Stock movements', unit_cost: 'Unit cost',
    mv_purchase: 'Purchase', mv_sale: 'Sale', mv_restock: 'Back to stock', mv_adjust: 'Adjustment', mv_opening: 'Opening', inactive: 'Inactive', active: 'Active',
    new_purchase: 'Buy stock', supplier: 'Supplier', total: 'Total', purchase_note: 'Purchases add stock and update the average cost. They are not an expense — cost is counted when the goods sell.',
    new_expense: 'New expense', category: 'Category', note: 'Note', auto: 'auto', confirm_delete_generic: 'Are you sure you want to delete this?',
    invoice: 'Invoice', invoice_amount: 'Amount due', delivered_count: 'Delivered orders', received: 'Received', receive: 'Confirm receipt',
    confirm_receive: 'Confirm you received this invoice payment from Al-Waseet?', sync_now: 'Sync now', last_sync: 'Last sync', never: 'never',
    aw_account: 'Al-Waseet account', aw_user: 'Al-Waseet username', aw_pass: 'Al-Waseet password', aw_pass_set: 'Saved — leave empty to keep',
    test_conn: 'Test connection', conn_ok: 'Connected successfully ✓', import_since: 'Import Al-Waseet orders created since',
    sync_minutes: 'Auto-sync every (minutes)', return_fee: 'Return fee per order (IQD)', default_delivery: 'Default delivery charge to customer',
    default_size: 'Default package size', status_map: 'Al-Waseet status mapping', status_map_sub: 'How each status affects stock and profit. Classified automatically; you can change it.',
    users: 'Users', new_user: 'New user', role: 'Role', admin: 'Admin', staff: 'Staff', change_password: 'Change password',
    current_password: 'Current password', new_password: 'New password', export: 'Export (CSV)', saved: 'Saved', general: 'General',
    sync_done: 'Synced: {u} updated, {i} imported, {c} status changes', sync_log: 'Sync log', env_managed: 'Managed by server environment variables',
    order_created: 'Order created', order_sent: 'Sent to Al-Waseet', aw_failed: 'Order saved but Al-Waseet rejected it: ',
    not_enough_stock: 'Not enough stock: ', allow_negative: 'Create anyway', staff_note: 'Staff account — financial reports are admin-only.',
    period_pl: 'for period', receivable_sub: '{n} delivered orders not yet paid out', units_sold: 'Units sold', page: 'Page', prev: 'Previous', next: 'Next',
    gross_profit_short: 'Gross profit', expenses_sub: 'incl. delivery fees', revenue_sub: 'from delivered orders', welcome: 'Welcome',
  },
};
const S = { lang: lsGet('lang') || 'ar', user: null, me: null, settings: {}, products: [], period: lsGet('period') || 'this_month', from: '', to: '' };
const t = (k, vars) => { let s = (T[S.lang] && T[S.lang][k]) || T.en[k] || k; if (vars) for (const [a, b] of Object.entries(vars)) s = s.replace(`{${a}}`, b); return s; };
function lsGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch {} }

// ============================ helpers ============================
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const money = n => `<span class="num">${nf.format(Math.round(n || 0))}</span> <span class="muted small">${S.lang === 'ar' ? 'د.ع' : 'IQD'}</span>`;
const moneyTxt = n => nf.format(Math.round(n || 0));
const pct = n => `<span class="num">${(n * 100).toFixed(1)}%</span>`;
const shortDate = s => s ? `<span class="num">${esc(String(s).slice(0, 16))}</span>` : '<span class="muted">—</span>';
const pname = p => (S.lang === 'en' && p.name_en) ? p.name_en : (p.name_ar || p.name_en || '');
const isAdmin = () => S.user && S.user.role === 'admin';
const badge = st => `<span class="badge st-${esc(st)}">${t('st_' + st)}</span>`;
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

async function api(method, path, body) {
  const res = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' });
  let data = null; try { data = await res.json(); } catch {}
  if (res.status === 401 && S.user && !path.startsWith('/api/login')) { S.user = null; renderAuth(); }
  if (!res.ok) { const e = new Error(data?.error || `HTTP ${res.status}`); e.status = res.status; e.details = data?.details; throw e; }
  return data;
}
let toastTimer;
function toast(msg, err = false) {
  const el = $('#toast'); el.textContent = msg; el.className = 'show' + (err ? ' err' : '');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (el.className = ''), err ? 5000 : 2600);
}
async function guard(btn, fn) {
  if (btn) btn.disabled = true;
  try { return await fn(); } catch (e) { toast(e.message, true); } finally { if (btn) btn.disabled = false; }
}

// ============================ icons ============================
const I = {
  dashboard: '<path d="M3 13h8V3H3zm0 8h8v-6H3zm10 0h8V11h-8zm0-18v6h8V3z"/>',
  orders: '<path d="M20 7h-4V5l-2-2h-4L8 5v2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 5h4v2h-4zm10 14H4V9h16z"/>',
  products: '<path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44a.99.99 0 0 1-1.14 0l-7.9-4.44A1 1 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44a.99.99 0 0 1 1.14 0l7.9 4.44c.32.17.53.5.53.88zM12 4.15 6.04 7.5 12 10.85l5.96-3.35zM5 15.91l6 3.38v-6.71L5 9.21zm14 0v-6.7l-6 3.37v6.71z"/>',
  purchases: '<path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2M1 2v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2"/>',
  expenses: '<path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4"/>',
  invoices: '<path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8zm4 18H6V4h7v5h5zM8 15h8v2H8zm0-4h8v2H8z"/>',
  settings: '<path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.48.48 0 0 0-.12-.61zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2"/>',
  more: '<path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2"/>',
  plus: '<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/>',
  sync: '<path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8m0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4z"/>',
  x: '<path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>',
  globe: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.93 8M12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96M4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 0 1 5.08 16m2.95-8H5.08a7.99 7.99 0 0 1 4.33-3.56A15.65 15.65 0 0 0 8.03 8M12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96M14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2m.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56M16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2z"/>',
  trash: '<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z"/>',
  warn: '<path d="M1 21h22L12 2zm12-3h-2v-2h2zm0-4h-2v-4h2z"/>',
};
const icon = (n, cls = '') => `<svg viewBox="0 0 24 24" fill="currentColor" class="${cls}" aria-hidden="true">${I[n] || ''}</svg>`;

// ============================ boot / auth ============================
function applyLang() {
  document.documentElement.lang = S.lang;
  document.documentElement.dir = S.lang === 'ar' ? 'rtl' : 'ltr';
  document.title = (S.me?.business_name ? S.me.business_name + ' · ' : '') + t('app');
}
async function boot() {
  applyLang();
  try {
    const me = await api('GET', '/api/me');
    S.me = me; S.user = me.user; applyLang();
    try { S.settings = await api('GET', '/api/settings'); } catch {}
    renderShell(); route();
  } catch (e) {
    if (!S.user) renderAuth();
  }
}
async function renderAuth() {
  applyLang();
  let st = { needs_setup: false, business_name: '' };
  try { st = await (await fetch('/api/state')).json(); } catch {}
  const setup = st.needs_setup;
  $('#app').innerHTML = `<div class="auth"><form class="card form" id="auth-form" autocomplete="on">
      <div style="display:flex;justify-content:space-between;align-items:center"><img src="/icon.svg" width="42" height="42" alt="">
      <button type="button" class="btn ghost sm" id="lang-auth">${icon('globe')} ${t('lang')}</button></div>
      <div><h1>${setup ? t('setup_title') : esc(st.business_name || t('app'))}</h1><p>${setup ? t('setup_sub') : t('login_sub')}</p></div>
      ${setup ? `<label class="field">${t('business_name')}<input name="business_name" required value="${esc(st.business_name || '')}"></label>
                 <label class="field">${t('display_name')}<input name="display_name"></label>` : ''}
      ${setup && st.setup_code_required ? `<label class="field">${t('setup_code')}<input name="setup_code" required autocomplete="off" dir="ltr"></label>` : ''}
      <label class="field">${t('username')}<input name="username" required autocomplete="username" autocapitalize="off"></label>
      <label class="field">${t('password')}<input name="password" type="password" required minlength="${setup ? 8 : 1}" autocomplete="${setup ? 'new-password' : 'current-password'}"></label>
      <button class="btn primary" type="submit">${setup ? t('create_account') : t('login')}</button>
    </form></div>`;
  $('#lang-auth').onclick = () => { S.lang = S.lang === 'ar' ? 'en' : 'ar'; lsSet('lang', S.lang); renderAuth(); };
  $('#auth-form').onsubmit = e => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    guard(e.submitter, async () => { await api('POST', setup ? '/api/setup' : '/api/login', body); await boot(); });
  };
}

// ============================ shell & routing ============================
function navItems() {
  return isAdmin() ? ['dashboard', 'orders', 'products', 'purchases', 'expenses', 'invoices', 'settings'] : ['orders', 'products', 'settings'];
}
function renderShell() {
  const items = navItems();
  const bottom = isAdmin() ? ['dashboard', 'orders', 'products', 'expenses', 'more'] : ['orders', 'products', 'settings'];
  const bn = S.me?.business_name || t('app');
  $('#app').innerHTML = `
    <div class="mobile-head"><div class="brand"><img src="/icon.svg" alt=""><span>${esc(bn)}</span></div>
      <button class="icon-btn" id="m-lang" title="${t('lang')}">${icon('globe')}</button></div>
    <div class="shell">
      <aside class="side"><div class="brand"><img src="/icon.svg" alt=""><span>${esc(bn)}</span></div>
        ${items.map(k => `<button class="nav-btn" data-nav="${k}">${icon(k)}<span>${t(k)}</span></button>`).join('')}
        <div class="spacer"></div>
        <button class="nav-btn" id="lang-btn">${icon('globe')}<span>${t('lang')}</span></button>
        <button class="nav-btn" id="logout-btn">${icon('x')}<span>${t('logout')}</span></button>
        <div class="small" style="padding:8px 12px;opacity:.6">${esc(S.user.display_name || S.user.username)} · ${t(S.user.role)}</div>
      </aside>
      <main class="main" id="page"></main>
    </div>
    <nav class="bottom-nav" style="grid-template-columns:repeat(${bottom.length},1fr)">
      ${bottom.map(k => `<button data-nav="${k}">${icon(k)}<span>${t(k)}</span></button>`).join('')}
    </nav>`;
  $$('[data-nav]').forEach(b => b.onclick = () => b.dataset.nav === 'more' ? openMore() : (location.hash = '#/' + b.dataset.nav));
  const toggle = () => { S.lang = S.lang === 'ar' ? 'en' : 'ar'; lsSet('lang', S.lang); applyLang(); renderShell(); route(); };
  $('#lang-btn').onclick = toggle; $('#m-lang').onclick = toggle;
  $('#logout-btn').onclick = logout;
}
async function logout() { try { await api('POST', '/api/logout'); } catch {} S.user = null; location.hash = ''; renderAuth(); }
function openMore() {
  const m = modal(t('more'), `<div class="grid">
    ${['purchases', 'invoices', 'settings'].map(k => `<button class="btn" data-go="${k}" style="justify-content:flex-start">${icon(k)} ${t(k)}</button>`).join('')}
    <button class="btn" data-go="lang" style="justify-content:flex-start">${icon('globe')} ${t('lang')}</button>
    <button class="btn danger" data-go="logout" style="justify-content:flex-start">${icon('x')} ${t('logout')}</button></div>`);
  $$('[data-go]', m).forEach(b => b.onclick = () => {
    closeModal(m);
    if (b.dataset.go === 'logout') return logout();
    if (b.dataset.go === 'lang') { S.lang = S.lang === 'ar' ? 'en' : 'ar'; lsSet('lang', S.lang); applyLang(); renderShell(); return route(); }
    location.hash = '#/' + b.dataset.go;
  });
}
const PAGES = {};
function route() {
  if (!S.user) return;
  const [name, qs] = (location.hash.replace(/^#\/?/, '') || (isAdmin() ? 'dashboard' : 'orders')).split('?');
  const page = navItems().includes(name) ? name : (isAdmin() ? 'dashboard' : 'orders');
  $$('[data-nav]').forEach(b => b.classList.toggle('active', b.dataset.nav === page));
  const el = $('#page'); if (!el) return;
  el.innerHTML = `<div class="muted">${t('loading')}</div>`;
  window.scrollTo(0, 0);
  PAGES[page](el, new URLSearchParams(qs || '')).catch(e => { el.innerHTML = `<div class="alert bad">${esc(e.message)}</div>`; });
}
window.addEventListener('hashchange', route);

// ============================ modal ============================
function modal(title, body, foot = '', opts = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'overlay';
  wrap.innerHTML = `<div class="modal ${opts.wide ? 'wide' : ''}" role="dialog" aria-modal="true">
    <div class="modal-head"><h3>${title}</h3><button class="icon-btn" data-close aria-label="${t('close')}">${icon('x')}</button></div>
    <div class="modal-body">${body}</div>${foot ? `<div class="modal-foot">${foot}</div>` : ''}</div>`;
  wrap.addEventListener('click', e => { if (e.target === wrap || e.target.closest('[data-close]')) closeModal(wrap); });
  document.addEventListener('keydown', function onKey(e) { if (e.key === 'Escape') { closeModal(wrap); document.removeEventListener('keydown', onKey); } });
  $('#modal-root').appendChild(wrap);
  return wrap;
}
const closeModal = m => m && m.remove();

// ============================ period selector ============================
function periodRange(p) {
  const now = new Date(), d = new Date(now);
  if (p === 'today') return [ymd(now), ymd(now)];
  if (p === 'd7') { d.setDate(d.getDate() - 6); return [ymd(d), ymd(now)]; }
  if (p === 'last_month') { const a = new Date(now.getFullYear(), now.getMonth() - 1, 1), b = new Date(now.getFullYear(), now.getMonth(), 0); return [ymd(a), ymd(b)]; }
  if (p === 'custom' && S.from && S.to) return [S.from, S.to];
  return [ymd(new Date(now.getFullYear(), now.getMonth(), 1)), ymd(now)];
}
function periodBar(onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'toolbar';
  const draw = () => {
    wrap.innerHTML = `<div class="chips">${['today', 'd7', 'this_month', 'last_month', 'custom'].map(p => `<button class="chip ${S.period === p ? 'active' : ''}" data-p="${p}">${t(p)}</button>`).join('')}</div>
      ${S.period === 'custom' ? `<input type="date" id="pf" value="${S.from || periodRange('this_month')[0]}" style="width:auto"><input type="date" id="pt" value="${S.to || ymd(new Date())}" style="width:auto"><button class="btn sm" id="papply">${t('apply')}</button>` : ''}`;
    $$('[data-p]', wrap).forEach(b => b.onclick = () => { S.period = b.dataset.p; lsSet('period', S.period); draw(); if (S.period !== 'custom') onChange(); });
    const ap = $('#papply', wrap); if (ap) ap.onclick = () => { S.from = $('#pf', wrap).value; S.to = $('#pt', wrap).value; onChange(); };
  };
  draw();
  return wrap;
}

// ============================ chart (SVG) ============================
function dailyChart(el, daily) {
  const W = Math.max(300, el.clientWidth || 600), H = 240, P = { l: 52, r: 10, t: 12, b: 26 };
  if (!daily.length) { el.innerHTML = `<div class="empty">${t('no_data')}</div>`; return; }
  const vals = daily.flatMap(d => [d.revenue, d.net]);
  let max = Math.max(0, ...vals), min = Math.min(0, ...vals);
  if (max === min) max = min + 1;
  const niceStep = (range) => { const raw = range / 4, mag = 10 ** Math.floor(Math.log10(raw)); return [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) || raw; };
  const step = niceStep(max - min);
  max = Math.ceil(max / step) * step; min = Math.floor(min / step) * step;
  const y = v => P.t + (H - P.t - P.b) * (1 - (v - min) / (max - min));
  const n = daily.length, bw = (W - P.l - P.r) / n;
  const x = i => P.l + bw * i + bw / 2;
  const short = v => Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : Math.abs(v) >= 1e3 ? Math.round(v / 1e3) + 'K' : String(v);
  let g = '';
  for (let v = min; v <= max + 1e-9; v += step) g += `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" ${v === 0 ? 'stroke-width="1.5"' : 'stroke-dasharray="3 3"'}/><text x="${P.l - 6}" y="${y(v) + 4}" text-anchor="end">${short(v)}</text>`;
  const barW = Math.max(2, Math.min(28, bw * 0.62));
  const bars = daily.map((d, i) => `<rect x="${x(i) - barW / 2}" y="${y(Math.max(0, d.revenue))}" width="${barW}" height="${Math.max(0, y(0) - y(d.revenue))}" rx="2.5" fill="var(--accent)" opacity=".85"><title>${d.date}: ${moneyTxt(d.revenue)}</title></rect>`).join('');
  const path = daily.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.net).toFixed(1)}`).join(' ');
  const dots = n <= 45 ? daily.map((d, i) => `<circle cx="${x(i)}" cy="${y(d.net)}" r="3" fill="${d.net >= 0 ? 'var(--good)' : 'var(--bad)'}"><title>${d.date}: ${moneyTxt(d.net)}</title></circle>`).join('') : '';
  const every = Math.ceil(n / Math.floor((W - P.l) / 46));
  const labels = daily.map((d, i) => i % every === 0 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${d.date.slice(5)}</text>` : '').join('');
  el.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="direction:ltr">${g}${bars}<path d="${path}" fill="none" stroke="var(--good)" stroke-width="2"/>${dots}${labels}</svg>`;
}

// ============================ DASHBOARD ============================
PAGES.dashboard = async (el) => {
  el.innerHTML = `<div class="topbar"><h1>${t('dashboard')}</h1>
      <button class="btn" id="sync-btn">${icon('sync')} ${t('sync_now')}</button>
      <button class="btn primary" id="new-order">${icon('plus')} ${t('new_order')}</button></div>
    <div id="pbar"></div><div id="dash"><div class="muted">${t('loading')}</div></div>`;
  $('#new-order').onclick = () => orderForm();
  $('#sync-btn').onclick = e => doSync(e.currentTarget, () => load());
  const load = async () => {
    const [from, to] = periodRange(S.period);
    const s = await api('GET', `/api/reports/summary?from=${from}&to=${to}`);
    const box = $('#dash'); if (!box) return;
    const e = s.expenses_by_category;
    const expRows = Object.entries(e).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    const maxExp = Math.max(1, ...expRows.map(r => r[1]));
    box.innerHTML = `
      ${!S.me.aw_configured ? `<div class="alert warn" style="margin-bottom:12px">${icon('warn')}<div>${t('aw_not_set')} <a href="#/settings">${t('connect_now')}</a></div></div>` : ''}
      ${s.missing_cost.n ? `<div class="alert warn" style="margin-bottom:12px">${icon('warn')}<div>${t('missing_cost_warn', { n: s.missing_cost.n })} <a href="#/orders?needs_items=1">${t('fix_now')}</a></div></div>` : ''}
      <div class="kpis">
        <div class="kpi hero"><div class="label">${t('revenue')}</div><div class="value">${money(s.revenue)}</div><div class="sub">${t('revenue_sub')}</div></div>
        <div class="kpi"><div class="label">${t('gross_profit')}</div><div class="value">${money(s.gross_profit)}</div><div class="sub">${pct(s.gross_margin)} ${t('margin')}</div></div>
        <div class="kpi"><div class="label">${t('total_expenses')}</div><div class="value">${money(s.expenses)}</div><div class="sub">${t('expenses_sub')}</div></div>
        <div class="kpi ${s.net_profit >= 0 ? 'net-pos' : 'net-neg'}"><div class="label">${t('net_profit')}</div><div class="value">${money(s.net_profit)}</div><div class="sub">${pct(s.net_margin)} ${t('margin')}</div></div>
      </div>
      <div class="kpis secondary" style="margin-top:12px">
        <div class="kpi"><div class="label">${t('delivered_orders')}</div><div class="value num">${nf.format(s.delivered_orders)}</div><div class="sub">${nf.format(s.units_sold)} ${t('units')}</div></div>
        <div class="kpi"><div class="label">${t('return_rate')}</div><div class="value ${s.return_rate > .2 ? 'bad' : ''}">${pct(s.return_rate)}</div><div class="sub">${nf.format(s.returned_orders)} ${t('st_returned')}</div></div>
        <div class="kpi"><div class="label">${t('avg_order')}</div><div class="value">${money(s.avg_order_value)}</div></div>
        <div class="kpi"><div class="label">${t('with_alwaseet')}</div><div class="value">${money(s.receivable.amount)}</div><div class="sub">${t('receivable_sub', { n: s.receivable.n })}</div></div>
        <div class="kpi"><div class="label">${t('inventory_value')}</div><div class="value">${money(s.inventory.value)}</div><div class="sub">${nf.format(s.inventory.units)} ${t('units')}</div></div>
        <div class="kpi"><div class="label">${t('with_couriers')}</div><div class="value">${money(s.inventory.with_couriers_value)}</div><div class="sub">${nf.format(s.inventory.with_couriers_units)} ${t('units')}</div></div>
      </div>
      <div class="two-col" style="margin-top:14px">
        <div class="card"><h2>${t('daily_chart')}<span class="legend"><span><i style="background:var(--accent)"></i>${t('revenue')}</span><span><i style="background:var(--good)"></i>${t('net_profit')}</span></span></h2><div id="chart"></div></div>
        <div class="card"><h2>${t('pl')} <span class="muted small num">${s.from} → ${s.to}</span></h2>
          <table class="pl"><tbody>
            <tr><td>${t('revenue')}</td><td>${money(s.revenue)}</td></tr>
            <tr class="indent"><td>− ${t('cogs')}</td><td>${money(s.cogs)}</td></tr>
            <tr class="total"><td>${t('gross_profit')}</td><td>${money(s.gross_profit)}</td></tr>
            ${expRows.map(([k, v]) => `<tr class="indent"><td>− ${t('cat_' + k)}</td><td>${money(v)}</td></tr>`).join('')}
            <tr class="total"><td>${t('net_profit')}</td><td class="${s.net_profit >= 0 ? 'good' : 'bad'}">${money(s.net_profit)}</td></tr>
          </tbody></table></div>
      </div>
      <div class="two-col" style="margin-top:14px">
        <div class="card"><h2>${t('expense_breakdown')}</h2>
          ${expRows.length ? `<div class="bars">${expRows.map(([k, v]) => `<div class="bar-row"><span>${t('cat_' + k)}</span><div class="bar-track"><div class="bar-fill" style="width:${(v / maxExp * 100).toFixed(1)}%"></div></div><span>${money(v)}</span></div>`).join('')}</div>` : `<div class="empty">${t('no_data')}</div>`}
        </div>
        <div class="card"><h2>${t('open_orders')}</h2>
          <dl class="kv"><dt>${badge('pending')}</dt><dd class="num">${s.open_orders.pending}</dd><dt>${badge('in_transit')}</dt><dd class="num">${s.open_orders.in_transit}</dd><dt>${badge('returning')}</dt><dd class="num">${s.open_orders.returning}</dd></dl>
          ${s.inventory.low_stock.length ? `<div class="section-title">${t('low_stock')}</div>${s.inventory.low_stock.map(p => `<div style="display:flex;justify-content:space-between;padding:4px 0"><span>${esc(pname(p))}</span><b class="num ${p.stock_qty <= 0 ? 'bad' : ''}">${p.stock_qty}</b></div>`).join('')}` : ''}
        </div>
      </div>
      ${s.top_products.length ? `<div class="card" style="margin-top:14px"><h2>${t('top_products')}</h2><div class="table-wrap"><table><thead><tr><th>${t('product')}</th><th class="end">${t('units_sold')}</th><th class="end">${t('revenue')}</th><th class="end">${t('gross_profit_short')}</th></tr></thead><tbody>
        ${s.top_products.map(p => `<tr><td>${esc(pname(p))}</td><td class="end num">${p.units}</td><td class="end">${money(p.sales)}</td><td class="end">${money(p.profit)}</td></tr>`).join('')}</tbody></table></div></div>` : ''}`;
    lastDaily = s.daily; lastW = $('#chart').clientWidth; dailyChart($('#chart'), s.daily);
  };
  $('#pbar').replaceWith(periodBar(load));
  await load();
};
let resizeT, lastDaily = null, lastW = 0;
window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => {
  const c = $('#chart'); if (c && lastDaily && Math.abs(c.clientWidth - lastW) > 20) { lastW = c.clientWidth; dailyChart(c, lastDaily); } }, 250); });

async function doSync(btn, after) {
  await guard(btn, async () => {
    const r = await api('POST', '/api/aw/sync');
    S.me.aw_last_sync = new Date().toISOString();
    toast(t('sync_done', { u: r.updated, i: r.imported, c: r.changed }) + (r.errors.length ? ' ⚠ ' + r.errors[0] : ''), !!r.errors.length);
    after && after();
  });
}

// ============================ ORDERS ============================
const ostate = { state: '', q: '', page: 1, needs_items: false };
PAGES.orders = async (el, qs) => {
  if (qs.get('needs_items')) { ostate.needs_items = true; ostate.state = ''; }
  el.innerHTML = `<div class="topbar"><h1>${t('orders')}</h1>
      ${isAdmin() ? `<button class="btn" id="sync-btn">${icon('sync')} ${t('sync_now')}</button>` : ''}
      <button class="btn primary" id="new-order">${icon('plus')} ${t('new_order')}</button></div>
    <div class="toolbar"><input class="search" id="q" type="search" placeholder="${t('search')}" value="${esc(ostate.q)}"></div>
    <div class="toolbar chips" id="st-chips"></div>
    <div id="olist"></div>`;
  $('#new-order').onclick = () => orderForm(null, load);
  if ($('#sync-btn')) $('#sync-btn').onclick = e => doSync(e.currentTarget, load);
  const chips = () => {
    $('#st-chips').innerHTML = [['', t('all')], ...['pending', 'in_transit', 'delivered', 'returning', 'returned', 'cancelled'].map(s => [s, t('st_' + s)])]
      .map(([v, l]) => `<button class="chip ${!ostate.needs_items && ostate.state === v ? 'active' : ''}" data-s="${v}">${l}</button>`).join('') +
      `<button class="chip ${ostate.needs_items ? 'active' : ''}" data-ni="1">${icon('warn').replace('<svg', '<svg width="13" height="13" style="vertical-align:-2px"')} ${t('needs_products')}</button>`;
    $$('[data-s]', $('#st-chips')).forEach(b => b.onclick = () => { ostate.state = b.dataset.s; ostate.needs_items = false; ostate.page = 1; chips(); load(); });
    $('[data-ni]', $('#st-chips')).onclick = () => { ostate.needs_items = !ostate.needs_items; ostate.page = 1; chips(); load(); };
  };
  let qt; $('#q').oninput = e => { clearTimeout(qt); qt = setTimeout(() => { ostate.q = e.target.value.trim(); ostate.page = 1; load(); }, 300); };
  const load = async () => {
    const p = new URLSearchParams({ page: ostate.page, limit: 50 });
    if (ostate.state) p.set('state', ostate.state); if (ostate.q) p.set('q', ostate.q); if (ostate.needs_items) p.set('needs_items', '1');
    const { total, rows } = await api('GET', '/api/orders?' + p);
    const box = $('#olist'); if (!box) return;
    if (!rows.length) { box.innerHTML = `<div class="card empty">${t('no_data')}</div>`; return; }
    const pages = Math.ceil(total / 50);
    box.innerHTML = `
      <div class="card desktop-only"><div class="table-wrap"><table><thead><tr><th>#</th><th>${t('qr')}</th><th>${t('customer')}</th><th>${t('city')}</th><th>${t('items')}</th><th class="end">${t('total_price')}</th><th>${t('status')}</th><th>${t('created')}</th></tr></thead><tbody>
        ${rows.map(o => `<tr class="click" data-id="${o.id}"><td class="num muted">${o.id}</td><td class="num">${esc(o.qr_id || '—')}</td>
          <td><div>${esc(o.client_name)}</div><div class="small muted num">${esc(o.client_mobile)}</div></td>
          <td>${esc(o.city_name)}<div class="small muted">${esc(o.region_name)}</div></td>
          <td>${esc(o.type_name)} ${!o.item_lines ? `<span class="badge st-returning">${t('needs_products')}</span>` : ''}</td>
          <td class="end">${money(o.price)}</td><td>${badge(o.state)}${o.status_text ? `<div class="small muted">${esc(o.status_text)}</div>` : ''}</td><td class="small">${shortDate(o.created_at)}</td></tr>`).join('')}
      </tbody></table></div></div>
      <div class="rows mobile-only">${rows.map(o => `<div class="row-card" data-id="${o.id}">
          <div class="top"><span class="title">${esc(o.client_name)}</span>${badge(o.state)}</div>
          <div class="top small"><span class="muted">${esc(o.city_name)} · ${esc(o.region_name)}</span><b>${money(o.price)}</b></div>
          <div class="top small"><span class="muted">${esc(o.type_name)}</span><span class="muted num">${esc(o.qr_id || '#' + o.id)}</span></div>
          ${!o.item_lines ? `<div><span class="badge st-returning">${t('needs_products')}</span></div>` : ''}
        </div>`).join('')}</div>
      ${pages > 1 ? `<div class="toolbar" style="justify-content:center;margin-top:12px"><button class="btn sm" id="prev" ${ostate.page <= 1 ? 'disabled' : ''}>${t('prev')}</button><span class="small muted">${t('page')} ${ostate.page} / ${pages}</span><button class="btn sm" id="next" ${ostate.page >= pages ? 'disabled' : ''}>${t('next')}</button></div>` : ''}`;
    $$('[data-id]', box).forEach(r => r.onclick = () => orderDetail(+r.dataset.id, load));
    if ($('#prev')) { $('#prev').onclick = () => { ostate.page--; load(); }; $('#next').onclick = () => { ostate.page++; load(); }; }
  };
  chips(); await load();
};

async function loadProducts() { S.products = await api('GET', '/api/products'); return S.products; }

function linesEditor(container, lines, onChange) {
  const draw = () => {
    container.innerHTML = `<div class="lines">${lines.map((l, i) => `<div class="line" data-i="${i}">
        <select data-f="product_id" required><option value="">${t('select')}</option>${S.products.map(p => `<option value="${p.id}" ${p.id == l.product_id ? 'selected' : ''}>${esc(pname(p))} (${p.stock_qty})</option>`).join('')}</select>
        <input data-f="qty" type="number" min="1" value="${l.qty}" inputmode="numeric" aria-label="${t('qty')}">
        <input data-f="unit_price" type="number" min="0" step="250" value="${l.unit_price}" inputmode="numeric" aria-label="${t('unit_price')}">
        <button type="button" class="icon-btn" data-rm aria-label="${t('delete')}">${icon('trash')}</button></div>`).join('')}</div>
      <button type="button" class="btn sm" data-add style="margin-top:8px">${icon('plus')} ${t('add_line')}</button>`;
    $$('.line', container).forEach(row => {
      const i = +row.dataset.i;
      $$('[data-f]', row).forEach(inp => inp.onchange = inp.oninput = () => {
        const f = inp.dataset.f; lines[i][f] = inp.value;
        if (f === 'product_id') { const p = S.products.find(p => p.id == inp.value); if (p) { lines[i].unit_price = p.sale_price; $('[data-f=unit_price]', row).value = p.sale_price; } }
        onChange && onChange();
      });
      $('[data-rm]', row).onclick = () => { lines.splice(i, 1); if (!lines.length) lines.push({ product_id: '', qty: 1, unit_price: 0 }); draw(); onChange && onChange(); };
    });
    $('[data-add]', container).onclick = () => { lines.push({ product_id: '', qty: 1, unit_price: 0 }); draw(); onChange && onChange(); };
  };
  draw();
}
const cleanLines = lines => lines.filter(l => l.product_id && +l.qty > 0).map(l => ({ product_id: +l.product_id, qty: +l.qty, unit_price: +l.unit_price || 0 }));

async function orderForm(existing = null, after) {
  await loadProducts();
  const set = S.settings || {};
  const o = existing || {};
  const lines = existing && existing.items?.length ? existing.items.map(i => ({ product_id: i.product_id, qty: i.qty, unit_price: i.unit_price })) : [{ product_id: '', qty: 1, unit_price: 0 }];
  const local = existing ? (existing.client_mobile || '').replace(/^\+964/, '0') : '';
  const m = modal(existing ? t('edit') + ' #' + (o.qr_id || o.id) : t('new_order'), `<form class="form" id="of">
      <div class="row"><label class="field">${t('customer')}<input name="client_name" required value="${esc(o.client_name || '')}"></label>
        <label class="field">${t('phone')}<input name="client_mobile" type="tel" required placeholder="07XXXXXXXXX" value="${esc(local)}" inputmode="tel"></label></div>
      <div class="row"><label class="field">${t('city')}<select name="city_id" required><option value="">${t('loading')}</option></select></label>
        <label class="field">${t('region')}<select name="region_id" required><option value="">—</option></select></label></div>
      <label class="field">${t('location')}<input name="location" required value="${esc(o.location || '')}"></label>
      <label class="field">${t('phone2')}<input name="client_mobile2" type="tel" placeholder="07XXXXXXXXX" value="${esc((o.client_mobile2 || '').replace(/^\+964/, '0'))}" inputmode="tel"></label>
      <div><div class="section-title" style="margin-top:4px">${t('items')}</div><div id="lines"></div></div>
      <div class="row"><label class="field">${t('customer_delivery')}<input name="customer_delivery" type="number" min="0" step="250" value="${existing ? Math.max(0, o.price - (o.items || []).reduce((s, i) => s + i.qty * i.unit_price, 0)) : (set.customer_delivery || 0)}" inputmode="numeric"></label>
        <label class="field">${t('package_size')}<select name="package_size" required><option value="">${t('loading')}</option></select></label></div>
      <label class="check"><input type="checkbox" id="ovr"> ${t('override_price')}</label>
      <label class="field hidden" id="price-field">${t('total_price')}<input name="price" type="number" min="0" step="250" inputmode="numeric"></label>
      <div class="total-bar"><span>${t('total_price')}</span><span id="total">0</span></div>
      <label class="field">${t('notes')}<textarea name="merchant_notes">${esc(o.merchant_notes || '')}</textarea></label>
      <label class="check"><input type="checkbox" name="replacement" ${o.replacement ? 'checked' : ''}> ${t('replacement')}</label>
      ${!existing ? `<label class="check"><input type="checkbox" name="send" ${S.me.aw_configured ? 'checked' : 'disabled'}> ${t('send_now')}</label>` : ''}
      <div id="of-err"></div>
    </form>`, `<button class="btn" data-close>${t('cancel')}</button><button class="btn primary" id="of-save">${existing ? t('save') : t('create')}</button>`);
  const f = $('#of', m);
  const calc = () => {
    const sub = cleanLines(lines).reduce((s, l) => s + l.qty * l.unit_price, 0);
    const total = $('#ovr', m).checked && f.price.value !== '' ? +f.price.value : sub + (+f.customer_delivery.value || 0);
    $('#total', m).innerHTML = money(total);
  };
  linesEditor($('#lines', m), lines, calc);
  f.customer_delivery.oninput = calc; f.price.oninput = calc;
  $('#ovr', m).onchange = e => { $('#price-field', m).classList.toggle('hidden', !e.target.checked); calc(); };
  calc();

  // Al-Waseet reference data
  const fillSelect = (sel, list, idKey, nameKey, val) => { sel.innerHTML = `<option value="">${t('select')}</option>` + list.map(x => `<option value="${esc(x[idKey])}" ${String(x[idKey]) === String(val) ? 'selected' : ''}>${esc(x[nameKey])}</option>`).join(''); };
  const loadRegions = async (cid, val) => {
    if (!cid) { f.region_id.innerHTML = '<option value="">—</option>'; return; }
    f.region_id.innerHTML = `<option>${t('loading')}</option>`;
    try { fillSelect(f.region_id, await api('GET', '/api/aw/regions?city_id=' + cid), 'id', 'region_name', val); } catch (e) { f.region_id.innerHTML = `<option value="">⚠ ${esc(e.message)}</option>`; }
  };
  api('GET', '/api/aw/cities').then(list => { fillSelect(f.city_id, list, 'id', 'city_name', o.city_id); if (o.city_id) loadRegions(o.city_id, o.region_id); })
    .catch(e => f.city_id.innerHTML = `<option value="">⚠ ${esc(e.message)}</option>`);
  api('GET', '/api/aw/sizes').then(list => {
    fillSelect(f.package_size, list, 'id', 'size', o.package_size || set.default_package_size || (list[0] && list[0].id));
  }).catch(e => f.package_size.innerHTML = `<option value="">⚠ ${esc(e.message)}</option>`);
  f.city_id.onchange = () => loadRegions(f.city_id.value);

  const submit = async (allowNegative = false) => {
    if (!f.reportValidity()) return;
    const fd = new FormData(f);
    const body = {
      client_name: fd.get('client_name'), client_mobile: fd.get('client_mobile'), client_mobile2: fd.get('client_mobile2'),
      city_id: fd.get('city_id'), city_name: f.city_id.selectedOptions[0]?.text || '', region_id: fd.get('region_id'),
      region_name: f.region_id.selectedOptions[0]?.text || '', location: fd.get('location'), package_size: fd.get('package_size'),
      customer_delivery: +fd.get('customer_delivery') || 0, merchant_notes: fd.get('merchant_notes'), replacement: !!fd.get('replacement'),
      items: cleanLines(lines), allow_negative: allowNegative,
    };
    if ($('#ovr', m).checked && fd.get('price') !== '') body.price = +fd.get('price');
    if (!body.items.length) return toast(t('add_line'), true);
    try {
      if (existing) { await api('PUT', '/api/orders/' + existing.id, body); toast(t('saved')); closeModal(m); after && after(); return; }
      body.send = !!fd.get('send');
      const r = await api('POST', '/api/orders', body);
      closeModal(m);
      if (r.aw_error) toast(t('aw_failed') + r.aw_error, true); else toast(body.send ? t('order_sent') : t('order_created'));
      after && after();
      orderDetail(r.order.id, after);
    } catch (e) {
      if (e.status === 409 && e.details) {
        $('#of-err', m).innerHTML = `<div class="alert bad"><div>${t('not_enough_stock')}${e.details.map(d => `${esc(d.name)} (${d.have}/${d.need})`).join('، ')}
          <div style="margin-top:6px"><button type="button" class="btn sm" id="neg">${t('allow_negative')}</button></div></div></div>`;
        $('#neg', m).onclick = () => submit(true);
      } else toast(e.message, true);
    }
  };
  $('#of-save', m).onclick = e => guard(e.currentTarget, () => submit(false));
}

async function orderDetail(id, after) {
  const o = await api('GET', '/api/orders/' + id);
  const cost = o.items.reduce((s, i) => s + i.qty * (i.unit_cost || 0), 0);
  const profit = o.price - o.delivery_fee - cost;
  const sent = !!(o.aw_id || o.qr_id);
  const m = modal(`${t('orders')} · <span class="num">${esc(o.qr_id || '#' + o.id)}</span>`, `
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px">${badge(o.state)}
      ${o.status_text ? `<span class="small muted">${t('aw_status')}: ${esc(o.status_text)}</span>` : ''}
      ${!sent ? `<span class="badge st-returning">${t('not_sent')}</span>` : ''}${o.source === 'alwaseet' ? `<span class="badge st-in_transit">${t('source_aw')}</span>` : ''}</div>
    ${o.issue_notes && o.issue_notes !== 'لا يوجد' ? `<div class="alert warn" style="margin-bottom:12px">${t('issue_notes')}: ${esc(o.issue_notes)}</div>` : ''}
    <dl class="kv">
      <dt>${t('customer')}</dt><dd>${esc(o.client_name)}</dd>
      <dt>${t('phone')}</dt><dd><a class="num" href="tel:${esc(o.client_mobile)}">${esc(o.client_mobile)}</a>${o.client_mobile2 ? ` · <a class="num" href="tel:${esc(o.client_mobile2)}">${esc(o.client_mobile2)}</a>` : ''}</dd>
      <dt>${t('city')}</dt><dd>${esc(o.city_name)} — ${esc(o.region_name)}</dd>
      <dt>${t('location')}</dt><dd>${esc(o.location)}</dd>
      ${o.merchant_notes ? `<dt>${t('notes')}</dt><dd>${esc(o.merchant_notes)}</dd>` : ''}
      <dt>${t('created')}</dt><dd>${shortDate(o.created_at)}</dd>
      ${o.delivered_at ? `<dt>${t('delivered_at')}</dt><dd>${shortDate(o.delivered_at)}</dd>` : ''}
      ${o.invoice_id ? `<dt>${t('invoice')}</dt><dd class="num">#${esc(o.invoice_id)}</dd>` : ''}
    </dl>
    <div class="section-title">${t('items')}</div>
    ${o.items.length ? `<div class="table-wrap"><table><thead><tr><th>${t('product')}</th><th class="end">${t('qty')}</th><th class="end">${t('unit_price')}</th>${isAdmin() ? `<th class="end">${t('unit_cost')}</th>` : ''}</tr></thead><tbody>
      ${o.items.map(i => `<tr><td>${esc(pname(i))}</td><td class="end num">${i.qty}</td><td class="end">${money(i.unit_price)}</td>${isAdmin() ? `<td class="end">${money(i.unit_cost)}</td>` : ''}</tr>`).join('')}</tbody></table></div>`
      : `<div class="alert warn">${icon('warn')}<div>${esc(o.type_name)} × ${o.items_number} — ${t('missing_cost_warn', { n: 1 })}</div></div>`}
    <table class="pl" style="margin-top:12px"><tbody>
      <tr><td>${t('total_price')}</td><td>${money(o.price)}</td></tr>
      <tr class="indent"><td>− ${t('delivery_fee')}</td><td>${money(o.delivery_fee)}</td></tr>
      ${isAdmin() ? `<tr class="indent"><td>− ${t('cogs')}</td><td>${money(cost)}</td></tr><tr class="total"><td>${t('order_profit')}</td><td class="${profit >= 0 ? 'good' : 'bad'}">${money(profit)}</td></tr>` : ''}
    </tbody></table>
    ${isAdmin() ? `<details style="margin-top:14px"><summary class="small muted" style="cursor:pointer">${t('set_state')}</summary>
      <div class="toolbar" style="margin-top:8px"><select id="st-sel" style="width:auto">${['pending', 'in_transit', 'delivered', 'returning', 'returned', 'cancelled'].map(s => `<option value="${s}" ${s === o.state ? 'selected' : ''}>${t('st_' + s)}</option>`).join('')}</select><button class="btn sm" id="st-save">${t('save')}</button></div></details>` : ''}
  `, `
    ${o.qr_link ? `<a class="btn" href="${esc(o.qr_link)}" target="_blank" rel="noopener">${t('print_label')}</a>` : ''}
    ${!sent && !['returned', 'cancelled'].includes(o.state) ? `<button class="btn primary" data-a="send">${t('send_to_aw')}</button>` : ''}
    ${sent ? `<button class="btn" data-a="refresh">${icon('sync')} ${t('refresh_status')}</button>` : ''}
    ${o.state === 'pending' ? `<button class="btn" data-a="edit">${t('edit')}</button>` : ''}
    <button class="btn" data-a="items">${t('link_products')}</button>
    ${!['delivered', 'returned', 'cancelled'].includes(o.state) ? `<button class="btn danger" data-a="cancel">${t('cancel_order')}</button>` : ''}
    ${!sent ? `<button class="btn danger" data-a="delete">${t('delete')}</button>` : ''}`, { wide: true });
  const reopen = () => { closeModal(m); after && after(); orderDetail(id, after); };
  $$('[data-a]', m).forEach(b => b.onclick = () => guard(b, async () => {
    const a = b.dataset.a;
    if (a === 'send') { await api('POST', `/api/orders/${id}/send`); toast(t('order_sent')); reopen(); }
    if (a === 'refresh') { await api('POST', `/api/orders/${id}/refresh`); reopen(); }
    if (a === 'edit') { closeModal(m); orderForm(o, after); }
    if (a === 'items') { closeModal(m); linkProducts(o, after); }
    if (a === 'cancel' && confirm(t('confirm_cancel'))) { await api('POST', `/api/orders/${id}/cancel`); reopen(); }
    if (a === 'delete' && confirm(t('confirm_delete'))) { await api('DELETE', `/api/orders/${id}`); closeModal(m); after && after(); }
  }));
  if ($('#st-save', m)) $('#st-save', m).onclick = e => guard(e.currentTarget, async () => { await api('POST', `/api/orders/${id}/state`, { state: $('#st-sel', m).value }); reopen(); });
}

async function linkProducts(o, after) {
  await loadProducts();
  const lines = o.items.length ? o.items.map(i => ({ product_id: i.product_id, qty: i.qty, unit_price: i.unit_price })) : [{ product_id: '', qty: o.items_number || 1, unit_price: 0 }];
  const m = modal(`${t('link_products')} · ${esc(o.qr_id || '#' + o.id)}`, `<p class="muted small">${esc(o.type_name)} × ${o.items_number} — ${money(o.price)}</p><div id="lines"></div>`,
    `<button class="btn" data-close>${t('cancel')}</button><button class="btn primary" id="lp-save">${t('save')}</button>`);
  linesEditor($('#lines', m), lines);
  $('#lp-save', m).onclick = e => guard(e.currentTarget, async () => {
    await api('POST', `/api/orders/${o.id}/items`, { items: cleanLines(lines) });
    toast(t('saved')); closeModal(m); after && after(); orderDetail(o.id, after);
  });
}

// ============================ PRODUCTS / INVENTORY ============================
PAGES.products = async (el) => {
  el.innerHTML = `<div class="topbar"><h1>${t('products')}</h1>${isAdmin() ? `<a class="btn" href="/api/export/inventory.csv">${t('export')}</a><button class="btn primary" id="np">${icon('plus')} ${t('new_product')}</button>` : ''}</div><div id="plist"></div>`;
  if ($('#np')) $('#np').onclick = () => productForm(null, load);
  const load = async () => {
    const ps = await api('GET', '/api/products?all=1');
    const box = $('#plist'); if (!box) return;
    if (!ps.length) { box.innerHTML = `<div class="card empty">${t('no_data')}</div>`; return; }
    const total = ps.reduce((s, p) => s + (p.stock_qty > 0 ? p.stock_qty * (p.avg_cost || 0) : 0), 0);
    box.innerHTML = `${isAdmin() ? `<div class="kpis" style="grid-template-columns:repeat(2,minmax(0,1fr));max-width:520px;margin-bottom:14px">
        <div class="kpi"><div class="label">${t('inventory_value')}</div><div class="value">${money(total)}</div></div>
        <div class="kpi"><div class="label">${t('stock')}</div><div class="value num">${nf.format(ps.reduce((s, p) => s + Math.max(0, p.stock_qty), 0))}</div><div class="sub">${t('units')}</div></div></div>` : ''}
      <div class="card"><div class="table-wrap"><table><thead><tr><th>${t('product')}</th><th>${t('sku')}</th><th class="end">${t('sale_price')}</th>${isAdmin() ? `<th class="end">${t('avg_cost')}</th>` : ''}<th class="end">${t('stock')}</th>${isAdmin() ? `<th class="end">${t('value')}</th><th></th>` : ''}</tr></thead><tbody>
      ${ps.map(p => `<tr class="${isAdmin() ? 'click' : ''}" data-id="${p.id}" style="${p.active ? '' : 'opacity:.5'}"><td>${esc(pname(p))}${p.active ? '' : ` <span class="badge st-pending">${t('inactive')}</span>`}</td><td class="num muted">${esc(p.sku || '')}</td>
        <td class="end">${money(p.sale_price)}</td>${isAdmin() ? `<td class="end">${money(p.avg_cost)}</td>` : ''}
        <td class="end"><b class="num ${p.stock_qty <= 0 ? 'bad' : p.stock_qty <= p.low_stock ? '' : ''}" style="${p.stock_qty > 0 && p.stock_qty <= p.low_stock ? 'color:var(--warn)' : ''}">${p.stock_qty}</b></td>
        ${isAdmin() ? `<td class="end">${money(Math.max(0, p.stock_qty) * p.avg_cost)}</td><td class="end"><button class="btn sm" data-adj="${p.id}">± ${t('stock')}</button></td>` : ''}</tr>`).join('')}
      </tbody></table></div></div>`;
    if (isAdmin()) {
      $$('tr[data-id]', box).forEach(r => r.onclick = e => { if (!e.target.closest('[data-adj]')) productForm(ps.find(p => p.id == r.dataset.id), load); });
      $$('[data-adj]', box).forEach(b => b.onclick = () => adjustForm(ps.find(p => p.id == b.dataset.adj), load));
    }
  };
  await load();
};

async function productForm(p, after) {
  const m = modal(p ? esc(pname(p)) : t('new_product'), `<form class="form" id="pf">
    <div class="row"><label class="field">${t('name_ar')}<input name="name_ar" required value="${esc(p?.name_ar || '')}"></label>
      <label class="field">${t('name_en')}<input name="name_en" value="${esc(p?.name_en || '')}" dir="ltr"></label></div>
    <div class="row"><label class="field">${t('sku')}<input name="sku" value="${esc(p?.sku || '')}" dir="ltr"></label>
      <label class="field">${t('sale_price')}<input name="sale_price" type="number" min="0" step="250" required value="${p?.sale_price ?? ''}" inputmode="numeric"></label></div>
    <div class="row"><label class="field">${t('low_stock_at')}<input name="low_stock" type="number" min="0" value="${p?.low_stock ?? 5}" inputmode="numeric"></label>
      ${p ? `<label class="field">${t('status')}<select name="active"><option value="1" ${p.active ? 'selected' : ''}>${t('active')}</option><option value="0" ${!p.active ? 'selected' : ''}>${t('inactive')}</option></select></label>` : '<div></div>'}</div>
    ${!p ? `<div class="row"><label class="field">${t('opening_qty')}<input name="opening_qty" type="number" min="0" value="0" inputmode="numeric"></label>
      <label class="field">${t('opening_cost')}<input name="opening_cost" type="number" min="0" step="250" value="0" inputmode="numeric"></label></div>` : ''}
    ${p ? `<div class="section-title">${t('movements')}</div><div id="mv" class="small muted">${t('loading')}</div>` : ''}
  </form>`, `<button class="btn" data-close>${t('cancel')}</button><button class="btn primary" id="ps">${t('save')}</button>`, { wide: !!p });
  if (p) api('GET', `/api/products/${p.id}/movements`).then(mv => {
    $('#mv', m).innerHTML = mv.length ? `<div class="table-wrap"><table><thead><tr><th>${t('date')}</th><th>${t('category')}</th><th class="end">${t('qty')}</th><th class="end">${t('unit_cost')}</th><th>${t('note')}</th></tr></thead><tbody>
      ${mv.map(x => `<tr><td class="small">${shortDate(x.created_at)}</td><td>${t('mv_' + x.type)}${x.qr_id ? ` <span class="num muted">#${esc(x.qr_id)}</span>` : ''}</td><td class="end num ${x.qty < 0 ? 'bad' : 'good'}">${x.qty > 0 ? '+' : ''}${x.qty}</td><td class="end">${money(x.unit_cost)}</td><td class="small">${esc(x.note || '')}</td></tr>`).join('')}</tbody></table></div>` : t('no_data');
  });
  $('#ps', m).onclick = e => guard(e.currentTarget, async () => {
    const f = $('#pf', m); if (!f.reportValidity()) return;
    const body = Object.fromEntries(new FormData(f));
    if (body.active != null) body.active = body.active === '1';
    await api(p ? 'PUT' : 'POST', p ? `/api/products/${p.id}` : '/api/products', body);
    toast(t('saved')); closeModal(m); after && after();
  });
}

function adjustForm(p, after) {
  const m = modal(`${t('adjust_stock')} · ${esc(pname(p))}`, `<form class="form" id="af">
    <p class="muted small" style="margin:0">${t('stock')}: <b class="num">${p.stock_qty}</b> · ${t('avg_cost')}: ${money(p.avg_cost)}</p>
    <label class="field">${t('delta')}<input name="delta" type="number" required inputmode="numeric" placeholder="+10 / -2"></label>
    <label class="field">${t('unit_cost')} (+)<input name="unit_cost" type="number" min="0" step="250" placeholder="${Math.round(p.avg_cost)}" inputmode="numeric"></label>
    <label class="field">${t('reason')}<input name="note"></label></form>`,
    `<button class="btn" data-close>${t('cancel')}</button><button class="btn primary" id="as">${t('save')}</button>`);
  $('#as', m).onclick = e => guard(e.currentTarget, async () => {
    const f = $('#af', m); if (!f.reportValidity()) return;
    await api('POST', `/api/products/${p.id}/adjust`, Object.fromEntries(new FormData(f)));
    toast(t('saved')); closeModal(m); after && after();
  });
}

// ============================ PURCHASES ============================
PAGES.purchases = async (el) => {
  el.innerHTML = `<div class="topbar"><h1>${t('purchases')}</h1><button class="btn primary" id="npu">${icon('plus')} ${t('new_purchase')}</button></div>
    <div class="alert info" style="margin-bottom:12px">${t('purchase_note')}</div><div id="pulist"></div>`;
  $('#npu').onclick = () => purchaseForm(load);
  const load = async () => {
    const rows = await api('GET', '/api/purchases');
    const box = $('#pulist'); if (!box) return;
    box.innerHTML = rows.length ? `<div class="card"><div class="table-wrap"><table><thead><tr><th>${t('date')}</th><th>${t('supplier')}</th><th>${t('items')}</th><th class="end">${t('total')}</th><th></th></tr></thead><tbody>
      ${rows.map(r => `<tr><td class="num">${esc(r.date)}</td><td>${esc(r.supplier || '—')}</td><td class="small">${r.items.map(i => `${esc(pname(i))} × <span class="num">${i.qty}</span> @ ${moneyTxt(i.unit_cost)}`).join('<br>')}</td><td class="end">${money(r.total)}</td>
        <td class="end"><button class="icon-btn" data-del="${r.id}" aria-label="${t('delete')}">${icon('trash')}</button></td></tr>`).join('')}</tbody></table></div></div>` : `<div class="card empty">${t('no_data')}</div>`;
    $$('[data-del]', box).forEach(b => b.onclick = () => confirm(t('confirm_delete_generic')) && guard(b, async () => { await api('DELETE', '/api/purchases/' + b.dataset.del); load(); }));
  };
  await load();
};
async function purchaseForm(after) {
  await loadProducts();
  const lines = [{ product_id: '', qty: 1, unit_price: 0 }];
  const m = modal(t('new_purchase'), `<form class="form" id="puf">
    <div class="row"><label class="field">${t('supplier')}<input name="supplier"></label><label class="field">${t('date')}<input name="date" type="date" value="${ymd(new Date())}"></label></div>
    <div><div class="section-title" style="margin-top:4px">${t('items')} — ${t('qty')} / ${t('unit_cost')}</div><div id="lines"></div></div>
    <div class="total-bar"><span>${t('total')}</span><span id="pt">0</span></div>
    <label class="field">${t('note')}<input name="note"></label></form>`,
    `<button class="btn" data-close>${t('cancel')}</button><button class="btn primary" id="pus">${t('save')}</button>`);
  const calc = () => { $('#pt', m).innerHTML = money(cleanLines(lines).reduce((s, l) => s + l.qty * l.unit_price, 0)); };
  linesEditor($('#lines', m), lines, calc);
  // in purchases the price column is the unit cost; prefill with the current average cost instead of sale price
  $('#lines', m).addEventListener('change', e => {
    if (e.target.dataset.f === 'product_id') { const p = S.products.find(p => p.id == e.target.value); const row = e.target.closest('.line'); const i = +row.dataset.i;
      lines[i].unit_price = Math.round(p?.avg_cost || 0); $('[data-f=unit_price]', row).value = lines[i].unit_price; calc(); }
  });
  $('#pus', m).onclick = e => guard(e.currentTarget, async () => {
    const fd = Object.fromEntries(new FormData($('#puf', m)));
    const items = cleanLines(lines).map(l => ({ product_id: l.product_id, qty: l.qty, unit_cost: l.unit_price }));
    if (!items.length) return toast(t('add_line'), true);
    await api('POST', '/api/purchases', { ...fd, items });
    toast(t('saved')); closeModal(m); after && after();
  });
}

// ============================ EXPENSES ============================
const CATS = ['ads', 'rent', 'salaries', 'bills', 'packaging', 'returns', 'delivery', 'other'];
PAGES.expenses = async (el) => {
  el.innerHTML = `<div class="topbar"><h1>${t('expenses')}</h1><a class="btn" id="exp-csv" href="#">${t('export')}</a><button class="btn primary" id="ne">${icon('plus')} ${t('new_expense')}</button></div><div id="pbar"></div><div id="elist"></div>`;
  $('#ne').onclick = () => expenseForm(null, load);
  const load = async () => {
    const [from, to] = periodRange(S.period);
    $('#exp-csv').href = `/api/export/expenses.csv?from=${from}&to=${to}`;
    const rows = await api('GET', `/api/expenses?from=${from}&to=${to}`);
    const box = $('#elist'); if (!box) return;
    const byCat = {}; rows.forEach(r => byCat[r.category] = (byCat[r.category] || 0) + r.amount);
    const total = rows.reduce((s, r) => s + r.amount, 0);
    box.innerHTML = `<div class="kpis secondary" style="margin-bottom:14px">
        <div class="kpi hero"><div class="label">${t('total')}</div><div class="value">${money(total)}</div></div>
        ${Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `<div class="kpi"><div class="label">${t('cat_' + k)}</div><div class="value">${money(v)}</div></div>`).join('')}</div>
      <p class="small muted">ⓘ ${t('cat_delivery')}: ${S.lang === 'ar' ? 'تُحسب تلقائياً من طلبات الوسيط المسلّمة وتظهر في الرئيسية.' : 'calculated automatically from delivered Al-Waseet orders; shown on the dashboard.'}</p>
      ${rows.length ? `<div class="card"><div class="table-wrap"><table><thead><tr><th>${t('date')}</th><th>${t('category')}</th><th>${t('note')}</th><th class="end">${t('amount')}</th></tr></thead><tbody>
      ${rows.map(r => `<tr class="click" data-id="${r.id}"><td class="num">${esc(r.date)}</td><td>${t('cat_' + r.category)} ${r.auto ? `<span class="badge st-pending">${t('auto')}</span>` : ''}</td><td class="small">${esc(r.note || '')}${r.qr_id ? ` <span class="num muted">#${esc(r.qr_id)}</span>` : ''}</td><td class="end">${money(r.amount)}</td></tr>`).join('')}
      </tbody></table></div></div>` : `<div class="card empty">${t('no_data')}</div>`}`;
    $$('tr[data-id]', box).forEach(r => r.onclick = () => expenseForm(rows.find(x => x.id == r.dataset.id), load));
  };
  $('#pbar').replaceWith(periodBar(load));
  await load();
};
function expenseForm(x, after) {
  const m = modal(x ? t('edit') : t('new_expense'), `<form class="form" id="ef">
    <div class="row"><label class="field">${t('category')}<select name="category" required>${CATS.map(c => `<option value="${c}" ${x?.category === c ? 'selected' : ''}>${t('cat_' + c)}</option>`).join('')}</select></label>
      <label class="field">${t('date')}<input name="date" type="date" required value="${x?.date || ymd(new Date())}"></label></div>
    <label class="field">${t('amount')}<input name="amount" type="number" min="1" step="250" required value="${x?.amount ?? ''}" inputmode="numeric"></label>
    <label class="field">${t('note')}<input name="note" value="${esc(x?.note || '')}"></label></form>`,
    `${x ? `<button class="btn danger" id="ed">${t('delete')}</button>` : ''}<button class="btn" data-close>${t('cancel')}</button><button class="btn primary" id="es">${t('save')}</button>`);
  $('#es', m).onclick = e => guard(e.currentTarget, async () => {
    const f = $('#ef', m); if (!f.reportValidity()) return;
    await api(x ? 'PUT' : 'POST', x ? '/api/expenses/' + x.id : '/api/expenses', Object.fromEntries(new FormData(f)));
    toast(t('saved')); closeModal(m); after && after();
  });
  if (x) $('#ed', m).onclick = e => confirm(t('confirm_delete_generic')) && guard(e.currentTarget, async () => { await api('DELETE', '/api/expenses/' + x.id); closeModal(m); after && after(); });
}

// ============================ INVOICES ============================
PAGES.invoices = async (el) => {
  el.innerHTML = `<div class="topbar"><h1>${t('invoices')}</h1><button class="btn" id="sync-btn">${icon('sync')} ${t('sync_now')}</button></div><div id="ilist"></div>`;
  $('#sync-btn').onclick = e => doSync(e.currentTarget, load);
  const load = async () => {
    const rows = await api('GET', '/api/invoices');
    const box = $('#ilist'); if (!box) return;
    box.innerHTML = rows.length ? `<div class="card"><div class="table-wrap"><table><thead><tr><th>#</th><th class="end">${t('invoice_amount')}</th><th class="end">${t('delivered_count')}</th><th>${t('status')}</th><th>${t('date')}</th><th></th></tr></thead><tbody>
      ${rows.map(i => `<tr class="click" data-id="${esc(i.id)}"><td class="num">${esc(i.id)}</td><td class="end">${money(i.merchant_price)}</td><td class="end num">${i.delivered_count}</td>
        <td>${i.received ? `<span class="badge st-delivered">${t('received')}</span>` : `<span class="badge st-returning">${esc(i.status || '')}</span>`}</td><td class="small">${shortDate(i.aw_updated_at)}</td>
        <td class="end">${!i.received ? `<button class="btn sm primary" data-rcv="${esc(i.id)}">${t('receive')}</button>` : ''}</td></tr>`).join('')}</tbody></table></div></div>` : `<div class="card empty">${t('no_data')}</div>`;
    $$('[data-rcv]', box).forEach(b => b.onclick = e => { e.stopPropagation(); confirm(t('confirm_receive')) && guard(b, async () => { await api('POST', `/api/invoices/${b.dataset.rcv}/receive`); toast(t('saved')); load(); }); });
    $$('tr[data-id]', box).forEach(r => r.onclick = async () => {
      const i = await api('GET', '/api/invoices/' + r.dataset.id);
      modal(`${t('invoice')} #${esc(i.id)}`, `<dl class="kv"><dt>${t('invoice_amount')}</dt><dd>${money(i.merchant_price)}</dd><dt>${t('status')}</dt><dd>${esc(i.status)}</dd></dl>
        <div class="section-title">${t('orders')}</div>${i.orders.length ? `<div class="table-wrap"><table><thead><tr><th>${t('qr')}</th><th>${t('customer')}</th><th class="end">${t('total_price')}</th><th class="end">${t('delivery_fee')}</th></tr></thead><tbody>
        ${i.orders.map(o => `<tr><td class="num">${esc(o.qr_id)}</td><td>${esc(o.client_name)}</td><td class="end">${money(o.price)}</td><td class="end">${money(o.delivery_fee)}</td></tr>`).join('')}</tbody></table></div>` : `<div class="empty">${t('no_data')}</div>`}`, '', { wide: true });
    });
  };
  await load();
};

// ============================ SETTINGS ============================
PAGES.settings = async (el) => {
  if (!isAdmin()) {
    el.innerHTML = `<div class="topbar"><h1>${t('settings')}</h1></div><div class="alert info" style="margin-bottom:14px">${t('staff_note')}</div>${passwordCard()}`;
    bindPassword(el); return;
  }
  const [s, map, users, log] = await Promise.all([api('GET', '/api/settings'), api('GET', '/api/status-map'), api('GET', '/api/users'), api('GET', '/api/aw/log')]);
  S.settings = s;
  let sizes = []; try { sizes = await api('GET', '/api/aw/sizes'); } catch {}
  const [from, to] = periodRange(S.period);
  el.innerHTML = `<div class="topbar"><h1>${t('settings')}</h1></div>
  <div class="grid" style="max-width:860px">
    <div class="card"><h2>${t('aw_account')} <span class="small muted">${t('last_sync')}: <span class="num">${esc(s.aw_last_sync || t('never'))}</span></span></h2>
      <form class="form" id="awf">
        ${s.aw_from_env ? `<div class="alert info">${t('env_managed')}</div>` : `
        <div class="row"><label class="field">${t('aw_user')}<input name="aw_username" value="${esc(s.aw_username)}" autocomplete="off" dir="ltr"></label>
          <label class="field">${t('aw_pass')}<input name="aw_password" type="password" autocomplete="new-password" placeholder="${s.aw_password_set ? t('aw_pass_set') : ''}" dir="ltr"></label></div>`}
        <div class="row"><label class="field">${t('import_since')}<input name="aw_import_since" type="date" value="${esc(s.aw_import_since)}"></label>
          <label class="field">${t('sync_minutes')}<input name="sync_minutes" type="number" min="2" value="${esc(s.sync_minutes)}" inputmode="numeric"></label></div>
        <div class="toolbar"><button type="button" class="btn" id="aw-test">${t('test_conn')}</button><button type="button" class="btn" id="aw-sync">${icon('sync')} ${t('sync_now')}</button><button class="btn primary" type="submit">${t('save')}</button></div>
        <div class="small muted num" dir="ltr">${esc(s.aw_base)}</div>
      </form></div>

    <div class="card"><h2>${t('general')}</h2><form class="form" id="gf">
      <div class="row"><label class="field">${t('business_name')}<input name="business_name" value="${esc(s.business_name)}"></label>
        <label class="field">${t('return_fee')}<input name="return_fee" type="number" min="0" step="250" value="${esc(s.return_fee)}" inputmode="numeric"></label></div>
      <div class="row"><label class="field">${t('default_delivery')}<input name="customer_delivery" type="number" min="0" step="250" value="${esc(s.customer_delivery)}" inputmode="numeric"></label>
        <label class="field">${t('default_size')}<select name="default_package_size"><option value="">—</option>${sizes.map(z => `<option value="${esc(z.id)}" ${String(z.id) === String(s.default_package_size) ? 'selected' : ''}>${esc(z.size)}</option>`).join('')}</select></label></div>
      <div><button class="btn primary" type="submit">${t('save')}</button></div></form></div>

    <div class="card"><h2>${t('status_map')}</h2><p class="small muted" style="margin-top:-6px">${t('status_map_sub')}</p>
      ${map.length ? `<div class="table-wrap"><table><tbody>${map.map(r => `<tr><td class="num muted">${esc(r.status_id)}</td><td>${esc(r.status_text)}</td><td class="end">
        <select data-sm="${esc(r.status_id)}" style="width:auto">${['pending', 'in_transit', 'delivered', 'returning', 'returned', 'cancelled'].map(st => `<option value="${st}" ${r.state === st ? 'selected' : ''}>${t('st_' + st)}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div>` : `<div class="empty">${t('sync_now')} →</div>`}
    </div>

    <div class="card"><h2>${t('users')} <button class="btn sm" id="nu">${icon('plus')} ${t('new_user')}</button></h2>
      <div class="table-wrap"><table><tbody>${users.map(u => `<tr><td>${esc(u.display_name)} <span class="muted small">@${esc(u.username)}</span></td><td>${t(u.role)}</td>
        <td>${u.active ? '' : `<span class="badge st-cancelled">${t('inactive')}</span>`}</td>
        <td class="end">${u.id !== S.user.id ? `<button class="btn sm" data-ut="${u.id}" data-active="${u.active}">${u.active ? t('inactive') : t('active')}</button>` : ''}</td></tr>`).join('')}</tbody></table></div></div>

    <div class="card"><h2>${t('export')}</h2><div class="toolbar">
      <a class="btn" href="/api/export/orders.csv?from=${from}&to=${to}">${t('orders')}</a>
      <a class="btn" href="/api/export/expenses.csv?from=${from}&to=${to}">${t('expenses')}</a>
      <a class="btn" href="/api/export/inventory.csv">${t('products')}</a></div>
      <div class="small muted num">${from} → ${to}</div></div>

    ${passwordCard()}

    <div class="card"><h2>${t('sync_log')}</h2>${log.length ? `<div class="small" style="max-height:220px;overflow:auto">${log.map(l => `<div style="padding:4px 0;border-bottom:1px solid var(--line)"><span class="num muted">${esc(l.created_at)}</span> ${l.ok ? '✓' : '<span class="bad">✗</span>'} <span class="num" dir="ltr">${/credentials are not set/i.test(l.message) ? esc(t('aw_enter_first')) : esc(l.message)}</span></div>`).join('')}</div>` : `<div class="empty">${t('no_data')}</div>`}</div>
  </div>`;

  const save = async (form, btn) => guard(btn, async () => {
    const body = Object.fromEntries(new FormData(form));
    if (body.aw_password === '') delete body.aw_password;
    await api('PUT', '/api/settings', body);
    S.settings = await api('GET', '/api/settings');
    S.me = await api('GET', '/api/me');
    toast(t('saved'));
  });
  $('#awf').onsubmit = e => { e.preventDefault(); save(e.target, e.submitter).then(() => route()); };
  $('#gf').onsubmit = e => { e.preventDefault(); save(e.target, e.submitter).then(() => { renderShell(); route(); }); };
  // Save whatever is typed in the Al-Waseet form (so Test/Sync never run against old or empty credentials)
  const saveAw = async () => {
    const body = Object.fromEntries(new FormData($('#awf')));
    if (body.aw_password === '') delete body.aw_password;
    await api('PUT', '/api/settings', body);
    S.settings = await api('GET', '/api/settings');
    S.me = await api('GET', '/api/me');
  };
  const awFilled = () => s.aw_from_env || (($('#awf').aw_username?.value || '').trim() && (($('#awf').aw_password?.value || '') || s.aw_password_set));
  $('#aw-test').onclick = e => guard(e.currentTarget, async () => {
    if (!awFilled()) return toast(t('aw_enter_first'), true);
    const f = $('#awf'); const body = {};
    if (f.aw_username) { body.username = f.aw_username.value.trim(); body.password = f.aw_password.value; }
    const r = await api('POST', '/api/aw/test', body);
    await saveAw();
    const c = r.checks || {};
    const row = (k, label) => c[k] ? `<tr><td>${label}</td><td>${c[k].ok ? `<span class="good">✓</span>${c[k].count != null ? ` <span class="num muted">(${c[k].count})</span>` : ''}` : `<span class="bad">✗ ${esc(c[k].error)}</span>${c[k].errNum ? ` <span class="num muted">#${esc(c[k].errNum)}</span>` : ''}`}</td></tr>` : '';
    const allOk = Object.values(c).every(x => x.ok);
    modal(t('test_conn'), `<div class="alert ${allOk ? 'good' : 'warn'}" style="margin-bottom:12px">${t('conn_ok')} — ${t('saved')}</div>
      <table><tbody>${row('statuses', t('status'))}${row('orders', t('orders'))}${row('invoices', t('invoices'))}</tbody></table>
      ${allOk ? '' : `<p class="small muted" style="margin-top:12px">${t('aw_perm_help')}</p>`}`);
  });
  $('#aw-sync').onclick = async e => {
    if (!awFilled()) return toast(t('aw_enter_first'), true);
    const btn = e.currentTarget;
    const ok = await guard(btn, async () => { await saveAw(); return true; });
    if (ok) doSync(btn, () => route());
  };
  $$('[data-sm]').forEach(sel => sel.onchange = () => guard(sel, async () => { await api('PUT', '/api/status-map/' + sel.dataset.sm, { state: sel.value }); toast(t('saved')); }));
  $$('[data-ut]').forEach(b => b.onclick = () => guard(b, async () => { await api('PUT', '/api/users/' + b.dataset.ut, { active: b.dataset.active === '1' ? 0 : 1 }); route(); }));
  $('#nu').onclick = () => {
    const m = modal(t('new_user'), `<form class="form" id="uf"><div class="row"><label class="field">${t('display_name')}<input name="display_name"></label><label class="field">${t('username')}<input name="username" required autocapitalize="off"></label></div>
      <div class="row"><label class="field">${t('password')}<input name="password" type="password" required minlength="8" autocomplete="new-password"></label>
      <label class="field">${t('role')}<select name="role"><option value="staff">${t('staff')}</option><option value="admin">${t('admin')}</option></select></label></div></form>`,
      `<button class="btn" data-close>${t('cancel')}</button><button class="btn primary" id="us">${t('save')}</button>`);
    $('#us', m).onclick = e => guard(e.currentTarget, async () => { const f = $('#uf', m); if (!f.reportValidity()) return; await api('POST', '/api/users', Object.fromEntries(new FormData(f))); closeModal(m); route(); });
  };
  bindPassword(el);
};
function passwordCard() {
  return `<div class="card"><h2>${t('change_password')}</h2><form class="form" id="pwf"><div class="row">
    <label class="field">${t('current_password')}<input name="current" type="password" required autocomplete="current-password"></label>
    <label class="field">${t('new_password')}<input name="password" type="password" required minlength="8" autocomplete="new-password"></label></div>
    <div><button class="btn primary" type="submit">${t('save')}</button></div></form></div>`;
}
function bindPassword(el) {
  $('#pwf', el).onsubmit = e => { e.preventDefault(); guard(e.submitter, async () => { await api('POST', '/api/me/password', Object.fromEntries(new FormData(e.target))); e.target.reset(); toast(t('saved')); }); };
}

boot();
