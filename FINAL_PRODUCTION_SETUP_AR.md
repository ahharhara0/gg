# حضرموت هايبر — دليل التجهيز النهائي للإنتاج

## 1) Firebase
1. أنشئ Firebase Project مستقل للإنتاج.
2. فعّل Authentication (Phone، وأي مزود تستخدمه فعليًا).
3. أنشئ Firestore Database.
4. انشر `firestore.rules` و`firestore.indexes.json`.
5. فعّل Storage وانشر `storage.rules`.
6. أنشئ Service Account للـBackend أو استخدم ADC في Cloud Run. لا تضع مفتاح Service Account داخل APK.

## 2) تهيئة البيانات
- استخدم `npm run seed:firestore` من بيئة موثوقة بعد ضبط Firebase Admin.
- السكربت ينشئ الكتالوج والتصنيفات وطرق الدفع فقط، ولا ينشئ مستخدمين أو أرصدة أو دفعات.
- أنشئ أول حساب مدير عبر Firebase Auth ثم امنحه `admin`/`super_admin` من عملية إدارية موثوقة على الخادم، وليس من العميل.

## 3) Backend
- اضبط `.env.production` وفق `.env.production.example`.
- `PAYMENT_GATEWAY=manual` حاليًا. لا يوجد Gateway وهمي.
- التحويل البنكي يدوي حتى ربط API بنك حقيقي.
- لا تنشئ `PAYMENT_WEBHOOK_SECRET` إلا إذا كان لديك مزود فعلي يرسل Webhooks؛ عند دمج المزود يجب تطبيق توقيعه الرسمي.

## 4) الدفع
### التحويل البنكي
حالة الدفع: `PENDING`/`PENDING_VERIFICATION` → تحقق إداري → `PAID`.
لا يستطيع العميل تغيير حالة الدفع أو مبلغ الطلب.

### COD
- الخادم يحسب أهلية COD بناءً على 5 طلبات مسبقة الدفع مكتملة بنجاح.
- لا يوجد عداد في localStorage يمكن للعميل تزويره.
- تحصيل COD يتطلب المندوب المعيّن + تطابق المبلغ + مرجع تحصيل + سجل تدقيق.

### Refund
- التحويل البنكي اليدوي: `REFUND_PENDING` حتى تأكيد الاسترجاع الحقيقي.
- لا تستخدم `REFUNDED` كإشارة لمجرد طلب الاسترجاع.

## 5) الدخول الإداري المخفي
- واجهة العميل لا تعرض أزرار الإدارة للعميل.
- يوجد مدخل داخلي غير ظاهر عبر 7 نقرات سريعة على شعار التطبيق في رأس صفحات المتجر، ثم رمز البوابة العام `HHP-OPS`.
- هذا الرمز ليس سرًا ولا يمنح صلاحية؛ وظيفته فقط فتح شاشة تسجيل الدخول العادية.
- الصلاحية الحقيقية تأتي من Firebase Auth + دور الخادم + Permission + MFA.
- مهندس النظام والمدير لا يجب أن يعتمدا على الرمز وحده.

## 6) البناء
```bash
npm ci
npm run lint
npm run build
npm run cap:sync:android
cd android
./gradlew assembleRelease
./gradlew bundleRelease
```

## 7) توقيع Android
أنشئ Keystore إنتاجي خارج Git، ثم ضع `android/keystore.properties` محليًا/في CI. لا ترفع كلمات المرور أو المفتاح إلى Git.

## 8) Cloud Run
```bash
docker build -t REGION-docker.pkg.dev/PROJECT/hadramout-hyper/app:2.6.0 .
docker push REGION-docker.pkg.dev/PROJECT/hadramout-hyper/app:2.6.0
gcloud run deploy hadramout-hyper --image REGION-docker.pkg.dev/PROJECT/hadramout-hyper/app:2.6.0 --region REGION --allow-unauthenticated
```
اضبط متغيرات البيئة/Secret Manager على Cloud Run. لا تضع أسرار الدفع أو Firebase داخل APK.

## 9) الاختبار قبل الإطلاق
- إنشاء حساب عميل حقيقي.
- إنشاء طلب ببطاقة/تحويل يدوي واختبار منع تغيير السعر.
- اختبار COD قبل 5 طلبات: يجب أن يُرفض.
- إكمال 5 طلبات مسبقة الدفع: يجب أن يتاح COD.
- اختبار طلب COD بمبلغ خاطئ: يجب أن يُرفض.
- اختبار تكرار Idempotency-Key بالتزامن: يجب ألا ينفذ مرتين.
- اختبار Webhook مكرر: يجب ألا ينفذ مرتين.
- اختبار Refund: يجب أن يبقى pending حتى التأكيد.
- اختبار حساب support/driver/merchant ومحاولة الوصول إلى وظائف خارج الصلاحية.
- اختبار محاولة عميل عادي استدعاء `/api/control/*`: يجب أن يحصل على 403.

## 10) ما لا يزال يعتمد على مزود خارجي
- API البنك للتحقق الآلي من التحويلات.
- بوابات المحافظ الإلكترونية المستقبلية.
- مزود إشعارات SMS/WhatsApp إذا أضفتها.
- خرائط/تتبع GPS خارجي إذا احتجت مزايا أكثر من Capacitor Geolocation.

## دخول الموظفين (Staff Access)
صفحة تسجيل الدخول الحالية تدعم رموز Staff من نفس حقل الهاتف، لكن التحقق يتم في Backend فقط. الرموز لا توجد في Frontend. يتم إنشاء جلسة opaque داخل Firestore مع HttpOnly cookie. اضبط `STAFF_DEVELOPER_CODE_HASH` و`STAFF_MANAGER_CODE_HASH` و`STAFF_AUDIT_SALT` كأسرار server-side.
