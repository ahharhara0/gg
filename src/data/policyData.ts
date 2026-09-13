import { PolicyContent } from '../types';

export const DEFAULT_POLICIES: PolicyContent = {
  privacyPolicyAr: `## 🛡️ سياسة الخصوصية وأمن البيانات - حضرموت هايبر ماركت

نلتزم في "حضرموت هايبر ماركت" بحماية خصوصية مستخدمينا وعملائنا وشركائنا التجاريين وفق أعلى معايير الأمان الرقمي:

### 1. جمع واستخدام البيانات
* نجمع البيانات الأساسية الضرورية لإتمام عمليات الشراء والتوصيل (الاسم، رقم الجوال، العنوان الجغرافي، وسجل المشتريات).
* يتم استخدام بيانات الموقع الجغرافي (GPS) حصرياً لتمكين كابتن التوصيل من الوصول الدقيق لعنوان العميل وعرض الفروع الأقرب.

### 2. سرية وأمن المعاملات المالية
* كافة عمليات الدفع الإلكتروني والتحويلات عبر البنوك والمحافظ اليمنية (الكريمي، فلوسك، القطيبي، بنك العمقي، قروشي، ونجم) مشفرة ومؤمنة بالكامل.
* لا يتم تخزين أرقام بطاقات الصراف الآلي أو كلمات السر الخاصة بحساباتك البنكية في خوادمنا.

### 3. عدم مشاركة البيانات مع أطراف ثالثة
* نلتزم بعدم بيع أو تأجير أو مشاركة أي بيانات شخصية تخص العميل مع أي جهات تسويقية خارجية.
* تُمنح بيانات العنوان ورقم الهاتف لمندوب التوصيل فقط خلال فترة تنفيذ الطلب النشط لغرض التواصل والتسليم.

### 4. حقوق العميل والتحكم بالملف
* يحق للعميل طلب تعديل بياناته، تفريغ سجل المحفظة، أو إغلاق الحساب في أي وقت بالتواصل مع مركز خدمة العملاء.`,

  privacyPolicyEn: `## 🛡️ Privacy & Data Protection Policy - Hadramout Hypermarket

At Hadramout Hypermarket, we prioritize customer privacy, secure transactions, and data protection:

1. **Information Collection**: We collect essential information (name, phone, delivery address, GPS coordinates) strictly to fulfill deliveries accurately.
2. **Payment Security**: All financial transactions via Yemeni e-wallets (Kuraimi, Flousak, Al-Qutaibi, Al-Amqi) are encrypted.
3. **No Third-Party Sharing**: We never sell or share user data with external marketing agencies.
4. **User Rights**: You may update your profile, review purchases, or request account closure at any time via Customer Support.`,

  returnPolicyAr: `## 🔄 سياسة الاستبدال والإرجاع واسترداد الأموال - حضرموت هايبر ماركت

نضمن لك في "حضرموت هايبر ماركت" تجربة تسوق آمنة ومضمونة 100%:

### 1. السلع الغذائية والمحاصيل الطازجة واللحوم والأسماك
* يحق للعميل فحص السلع الطازجة (خضار، فواكه، لحوم، أسماك، مخبوزات) فور الاستلام من كابتن التوصيل.
* في حال وجود أي ملاحظة على جودة السلعة، يحق للعميل رفض استلامها فوراً أو طلب الاستبدال خلال ساعتين من الاستلام.

### 2. السلع الجافة، المواد الاستهلاكية، والمعدات والمنزلية
* يمكن إرجاع أو استبدال المواد الغذائية الجافة والمواد المنزلية خلال 48 ساعة من تاريخ الشراء بشرط عدم فتح العبوة ووجود الفاتورة الأصلية.
* الإلكترونيات، أنظمة الطاقة الشمسية، وقطع غيار المركبات يشملها حق الاستبدال خلال 7 أيام في حال وجود عيب مصنعي مثبت.

### 3. المنتجات المستثناة من الإرجاع
* العطور ومستحضرات التجميل والعناية الشخصية بعد إزالة الغلاف البلاستيكي الواقي حفاظاً على الصحة العامة.
* المنتجات التي تم استهلاكها أو إتلافها بسبب سوء الاستخدام بعد الاستلام.

### 4. آلية استرداد الأموال (Refund Policy)
* **استرداد فوري للمحفظة الرقمية**: يُعاد المبلغ فوراً لمحفظة العميل داخل التطبيق مع نقاط ولاء تعويضية.
* **استرداد نقدي / بنكي**: يتم التحويل البنكي لحساب العميل (الكريمي / البنك) خلال 24 ساعة عمل من اعتماد طلب الإرجاع.
* إذا كان سبب الإرجاع خطأً من إدارة الهايبر أو التاجر، يُعفى العميل من أي رسوم توصيل بديلة.`,

  returnPolicyEn: `## 🔄 Return, Exchange & Refund Policy - Hadramout Hypermarket

1. **Fresh Food, Produce & Meat**: Inspect upon delivery. Return immediately to the courier or request a replacement within 2 hours if unsatisfied.
2. **Dry Groceries & General Merchandise**: Returnable within 48 hours in original unopened packaging.
3. **Electronics & Solar Systems**: Replacement guaranteed within 7 days in case of manufacturing defects.
4. **Instant Refund**: Funds returned immediately to digital in-app wallet or within 24 hours via bank transfer.`,

  lastUpdated: '11 سبتمبر 2026',
  updatedBy: 'م. أحمد أمين بن حرهره (مهندس النظام)',
};

const STORAGE_POLICIES_KEY = 'hadramout_hyper_app_policies_v2';
const policyListeners = new Set<() => void>();

export function getAppPolicies(): PolicyContent {
  try {
    const raw = localStorage.getItem(STORAGE_POLICIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_POLICIES, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load policies from localStorage:', e);
  }
  return DEFAULT_POLICIES;
}

export function saveAppPolicies(policies: PolicyContent): void {
  try {
    localStorage.setItem(STORAGE_POLICIES_KEY, JSON.stringify(policies));
  } catch (e) {
    console.warn('Failed to save policies to localStorage:', e);
  }
  policyListeners.forEach(listener => listener());
}

export function subscribeToPolicies(listener: () => void): () => void {
  policyListeners.add(listener);
  return () => policyListeners.delete(listener);
}
