# Horn Store Manager · نظام إدارة متجر الهورنات

Revenue, gross profit, net profit, expenses and inventory for an online car-horn store, connected live to **Al-Waseet** delivery (Iraq).
Arabic / English interface, works on phone and desktop. **Zero external packages** — only Node.js 22.

[العربية ↓](#بالعربية)

---

## What it does

| Area | What you get |
|---|---|
| **Dashboard** | Revenue, gross profit, expenses, net profit (with margins), delivered orders, return rate, average order, money Al-Waseet owes you, inventory value, stock out with couriers, daily chart, P&L statement, expense breakdown, low-stock alerts, best sellers. Filter by today / 7 days / month / custom. |
| **Orders** | Create an order → sent to Al-Waseet instantly (receipt number + printable label). Edit before pickup. Statuses sync automatically. Orders you create in the Al-Waseet app are imported too and auto-linked to a product when the goods description matches a product name or SKU. |
| **Inventory** | Products, stock, weighted-average cost, stock value, adjustments, full movement history. Stock leaves when an order is created and comes back automatically when Al-Waseet marks it returned. |
| **Purchases** | Record stock you buy; average cost updates automatically. |
| **Expenses** | Ads, rent, salaries, bills, packaging, other. Al-Waseet delivery fees and return fees are added automatically. |
| **Al-Waseet invoices** | See payout invoices, the orders in each, and confirm receipt. |
| **Users** | Admin (everything) and Staff (orders + stock only — no costs or profit). |
| **Export** | CSV for orders, expenses, inventory (opens in Excel, Arabic-safe). |

## How the numbers are calculated

```
Revenue        = total paid by customers on DELIVERED orders (incl. the delivery charge you added)
COGS           = units delivered × their average cost when they left stock
Gross profit   = Revenue − COGS
Expenses       = Al-Waseet delivery fees (delivered orders) + return fees
                 + ads + rent + salaries + bills + packaging + other + stock write-offs
Net profit     = Gross profit − Expenses
Inventory value = units on hand × weighted average cost
Money with Al-Waseet = (price − delivery fee) of delivered orders whose invoice you haven't received
```
Purchases are **not** an expense — buying stock turns cash into inventory; the cost hits profit only when the goods are delivered.
An order counts in a period by its **delivery date**.

## Try it now (demo, fake Al-Waseet)

```bash
npm run demo
# open http://localhost:3000  → login demo / demo1234
```
This starts a local fake Al-Waseet API with sample data. Nothing is sent to the real Al-Waseet.

## Run for real

### Option A — Docker on a VPS (recommended)
Any small Linux server (1 GB RAM is plenty) with Docker installed.
```bash
cp .env.example .env          # then edit: set APP_SECRET (long random string)
docker compose up -d --build  # app on http://SERVER_IP:3000
```
HTTPS with your own domain: point the domain's DNS A-record to the server, set `DOMAIN=` and `COOKIE_SECURE=1`, `TRUST_PROXY=1` in `.env`, then:
```bash
docker compose --profile https up -d
```

### Option B — plain Node.js
Requires **Node.js 22.13 or newer** (uses the built-in SQLite).
```bash
cp .env.example .env
node --env-file=.env server.js
```
Keep it running with `pm2`, `systemd`, or similar.

### First launch
1. Open the site → create the admin account.
2. **Settings → Al-Waseet account**: enter your Al-Waseet **merchant** username and password (not a merchant-user account — invoice APIs need the merchant token). Press **Test connection**, then **Save**.
3. **Import Al-Waseet orders created since**: defaults to today. Set an earlier date to pull existing orders (then link their products so profit is complete).
4. Add your products (with opening stock and unit cost), set the default delivery charge and package size.
5. Press **Sync now** once; after that it syncs automatically (every 10 min by default).

## Al-Waseet integration details
Built on the official Merchant API V2.3 (`https://api.alwaseet-iq.net/v1/merchant`):
login · cities · regions · package sizes · create-order · edit-order · merchant-orders · get-orders-by-ids-bulk · statuses · invoices · invoice orders · receive invoice.

- Stays under the 30 requests / 30 s rate limit with a built-in throttle; city/region/size lists are cached.
- Token is renewed automatically when it expires (e.g. after a password change).
- Phone numbers are converted to the required `+9647XXXXXXXXX` format.
- **Status mapping**: each Al-Waseet status is classified automatically (delivered / returned / in transit / …). Check **Settings → Al-Waseet status mapping** after the first sync and correct any that look wrong — this decides when stock returns and when revenue counts.
- Al-Waseet's API has no "cancel order" call: cancelling here returns stock locally; cancel it in the Al-Waseet app too.
- Editing is only allowed while the order is still with you (before driver pickup), per Al-Waseet's rules.

## Backups
All data is one SQLite file: `data/hornpro.db` (Docker: the `./data` folder). Copy it daily, for example:
```bash
sqlite3 data/hornpro.db ".backup 'backup-$(date +%F).db'"
```
Keep `APP_SECRET` with your backup — it's needed to decrypt the saved Al-Waseet password.

## Tests
```bash
npm test     # full end-to-end flow against the fake Al-Waseet API, including the profit math
```

## Project layout
```
server.js            HTTP server + all API routes
src/db.js            schema (SQLite, built into Node)
src/alwaseet.js      Al-Waseet API client (auth, throttle, retries)
src/sync.js          status/invoice sync + status classification
src/orders.js        order lifecycle (stock out / restock / return fees)
src/inventory.js     weighted-average costing
src/reports.js       P&L, inventory, daily series
src/security.js      password hashing, sessions, credential encryption
public/              front end (vanilla JS, Arabic/English, mobile-first)
tools/               fake Al-Waseet API + demo seeder
```

---

## بالعربية

نظام لإدارة متجر هورنات السيارات أونلاين: **الإيرادات، الربح الإجمالي، صافي الربح، المصاريف، والمخزون**، مربوط مباشرة مع شركة **الوسيط** للتوصيل. الواجهة عربي/إنكليزي وتعمل على الهاتف والحاسبة.

### ماذا يقدّم
- **الرئيسية**: الإيرادات، الربح الإجمالي، المصاريف، صافي الربح، نسبة الإرجاع، أموالك لدى الوسيط، قيمة المخزون، مخطط يومي، وقائمة أرباح وخسائر.
- **الطلبات**: تنشئ الطلب فيُرسل للوسيط فوراً مع رقم الوصل ورابط طباعة الوصل. الحالات تتحدّث تلقائياً. الطلبات التي تنشئها من تطبيق الوسيط تُستورد أيضاً.
- **المخزون**: الكميات ومتوسط الكلفة وقيمة المخزون. البضاعة تنقص عند إنشاء الطلب وترجع تلقائياً عند الإرجاع.
- **المشتريات**: تسجيل شراء البضاعة وتحديث متوسط الكلفة.
- **المصاريف**: إعلانات، إيجار، رواتب، فواتير، تغليف، أخرى. أجور توصيل الوسيط ورسوم الإرجاع تُضاف تلقائياً.
- **فواتير الوسيط**: عرض الفواتير وتأكيد الاستلام.
- **المستخدمون**: مدير (كل شيء) وموظف (الطلبات والمخزون فقط بدون الأرباح).

### طريقة الحساب
- **الإيرادات** = ما دفعه الزبائن على الطلبات **المسلّمة**.
- **كلفة البضاعة** = القطع المسلّمة × متوسط كلفتها.
- **الربح الإجمالي** = الإيرادات − كلفة البضاعة.
- **المصاريف** = أجور الوسيط + رسوم الإرجاع + الإعلانات + الإيجار + الرواتب + الفواتير + التغليف + أخرى + التالف.
- **صافي الربح** = الربح الإجمالي − المصاريف.
- شراء البضاعة **ليس مصروفاً**؛ كلفتها تُحسب عند بيعها.

### التجربة السريعة
```bash
npm run demo
```
ثم افتح `http://localhost:3000` وسجّل الدخول بـ `demo / demo1234` (وسيط تجريبي، لا يُرسل أي شيء للوسيط الحقيقي).

### التشغيل الفعلي
1. على سيرفر فيه Docker: انسخ `.env.example` إلى `.env` وضع قيمة طويلة عشوائية في `APP_SECRET`، ثم `docker compose up -d --build`.
2. افتح الموقع وأنشئ حساب المدير.
3. من **الإعدادات ← حساب الوسيط** أدخل اسم المستخدم وكلمة المرور لحساب **التاجر** (وليس حساب موظف التاجر)، اضغط **اختبار الاتصال** ثم **حفظ**.
4. أضف منتجاتك مع الكمية الافتتاحية والكلفة.
5. اضغط **مزامنة الآن** مرة، وبعدها تتم المزامنة تلقائياً كل 10 دقائق.
6. راجع **تصنيف حالات الوسيط** في الإعدادات بعد أول مزامنة وصحّح أي حالة غير دقيقة.

### ملاحظات مهمة
- لا يوجد في API الوسيط أمر لإلغاء الطلب؛ عند الإلغاء هنا ألغِه أيضاً من تطبيق الوسيط.
- التعديل مسموح فقط قبل استلام المندوب للطلب.
- كل البيانات في ملف واحد `data/hornpro.db` — خذ منه نسخة احتياطية يومياً واحتفظ بـ `APP_SECRET`.
