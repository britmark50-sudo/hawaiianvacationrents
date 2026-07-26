# 🚀 دليل نشر المنصة على Cloudflare

المنصة تعمل بالكامل على بنية Cloudflare: **Workers** (التطبيق) + **D1** (قاعدة البيانات) + **R2** (صور الإعلانات) + **Cron Triggers** (الصيانة اليومية).

**التكلفة المتوقعة:** خطة Workers المدفوعة **5$/شهر** (موصى بها بقوة — الخطة المجانية تحدّ المعالج بـ10ms لكل طلب). D1 مجاني حتى 5GB، وR2 مجاني حتى 10GB مع **صفر رسوم نقل بيانات**. النطاق يُدار من Cloudflare DNS مجانًا.

---

## الخطوة 0 — المتطلبات

- حساب [Cloudflare](https://dash.cloudflare.com/sign-up) (وفعّل خطة Workers Paid من Workers & Pages → Plans)
- Node.js 20+ على جهازك
- الكود مفكوك الضغط: `npm install`

## الخطوة 1 — تسجيل الدخول

```bash
npx wrangler login     # يفتح المتصفح للموافقة
```

## الخطوة 2 — قاعدة البيانات D1

```bash
npm run cf:d1:create
# انسخ database_id من الناتج وضعه في wrangler.toml مكان REPLACE_WITH_YOUR_D1_ID
```

ثم أنشئ الجداول وازرع البيانات التجريبية (اختياري):

```bash
npm run cf:d1:migrate            # ينشئ كل الجداول على D1 السحابية
npm run cf:d1:seed               # اختياري: 12 إعلانًا تجريبيًا + الحسابات + المدونة
```

> **لإنتاج نظيف بدون بيانات تجريبية:** تجاوز `cf:d1:seed`، وبعد النشر سجّل حسابك من الموقع
> ثم رقِّه إلى أدمن:
> ```bash
> npx wrangler d1 execute hvr-db --remote --command "UPDATE User SET role='ADMIN' WHERE email='بريدك@هنا.com'"
> ```

## الخطوة 3 — تخزين الصور R2

```bash
npx wrangler r2 bucket create hvr-uploads
```

(الاسم مطابق لما في wrangler.toml — لا شيء آخر مطلوب؛ الرفع والعرض يمران عبر الووركر.)

## الخطوة 4 — الأسرار

القيم غير السرية موجودة مسبقًا في `wrangler.toml` (الأسعار، المحفظة، وضع الدفع…). أدخل الأسرار فقط:

```bash
npx wrangler secret put SESSION_SECRET        # نص عشوائي طويل: openssl rand -hex 32
npx wrangler secret put PAYPAL_EMAIL          # hassamizos@gmail.com (وضع الاعتماد اليدوي)
npx wrangler secret put CRON_SECRET           # نص عشوائي لحماية مسار الكرون
# إشعارات تيليجرام (البوت: @HawaiiRentalsNotifBot — التوكن ومعرف المحادثة في ملف .env المحلي):
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put TRONGRID_API_KEY
# للتحول لPayPal الفوري عبر API لاحقًا:
npx wrangler secret put PAYPAL_CLIENT_ID
npx wrangler secret put PAYPAL_CLIENT_SECRET
```

## الخطوة 5 — النشر 🚀

```bash
npm run cf:deploy
```

سيبني المشروع وينشره ويعطيك رابط `*.workers.dev` للتجربة الفورية.

## الخطوة 6 — ربط النطاق hawaiianvacationrents.com

1. في لوحة Cloudflare: **Add a domain** وأضف نطاقك (خطة Free تكفي)، وغيّر الـNameservers عند مسجّل النطاق إلى ما يعرضه Cloudflare.
2. أزل التعليق عن قسم `[[routes]]` في نهاية `wrangler.toml` ثم `npm run cf:deploy` مجددًا —
   أو من اللوحة: Workers & Pages → مشروعك → Settings → **Custom Domains** → أضف النطاق و www.

شهادة HTTPS تصدر تلقائيًا خلال دقائق.

## نماذج Formspree و LinkedIn

- رسائل «تواصل معنا» وكل **عقار جديد يضيفه مالك** تصلك بريديًا عبر Formspree
  (`FORMSPREE_ENDPOINT` مضبوط في wrangler.toml) — وتبقى نسخة في لوحة الإدارة كالمعتاد.
- رابط LinkedIn في تذييل الموقع وصفحة التواصل — لتغييره عدّل `SOCIAL_LINKS` في `lib/constants.ts`.

## الكرون اليومي

مفعّل تلقائيًا من `wrangler.toml` (`0 8 * * *` بتوقيت UTC): إيقاف الإعلانات المنتهية + تذكير قبل 5 أيام. تحقق منه في اللوحة: Workers → مشروعك → Triggers → Cron Triggers.

## التطوير المحلي (كما هو دائمًا)

```bash
npm run dev          # الأسرع — Node + SQLite المحلية (dev.db)
npm run cf:preview   # محاكاة Cloudflare كاملة: Workers + D1 + R2 محليًا
```

لتحديث ملف الزرع بعد تعديل البيانات المحلية: `python3 scripts/gen-d1-seed.py`

## ملاحظات تشغيلية

- **رفع الصور:** يذهب تلقائيًا إلى R2 على السحابة (روابط `/r2/uploads/…`) وإلى `public/uploads` محليًا — بدون أي إعداد.
- **التحقق من USDT وTelegram وPayPal:** طلبات HTTPS صادرة — تعمل على Workers مباشرة.
- **كلمات المرور:** PBKDF2 عبر Web Crypto (سريعة على Workers ومتوافقة مع كل البيئات).
- **قيود D1:** المعاملات التفاعلية غير مدعومة — الكود يستخدم المعاملات الدفعية المدعومة فقط.
- **مراقبة:** لوحة Workers → Logs (بث مباشر للسجلات) أو `npx wrangler tail`.

## ما بعد الإطلاق — قائمة سريعة

- [ ] فعّل خطة Workers Paid (5$) قبل الإطلاق الفعلي
- [ ] أنشئ حساب الأدمن الحقيقي وعطّل/احذف الحسابات التجريبية من لوحة الإدارة
- [ ] راجع الصفحات القانونية من `/admin/pages` واعرضها على مستشار قانوني
- [ ] أرسل `sitemap.xml` إلى Google Search Console
- [ ] جرّب دورة دفع كاملة: إضافة عقار → باقة → USDT حقيقي صغير أو PayPal → النشر التلقائي
- [ ] فعّل إشعارات Telegram وجرّب `npx wrangler tail` لمراقبة أول المستخدمين
