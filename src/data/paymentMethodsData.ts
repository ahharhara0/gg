import { PaymentMethodConfig } from '../types';

/** Production payment methods: manual bank/exchange transfer + COD.
 * Electronic wallets are intentionally disabled until real provider APIs are integrated.
 */
export const INITIAL_PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'pm-qutaibi', key: 'BANK_QUTAIBI', name: 'تحويل بنك القطيبي', nameEn: 'Qutaibi Bank Transfer',
    bankOrIssuer: 'بنك القطيبي الإسلامي', accountNumber: '122456789', color: 'from-emerald-700 to-emerald-800', badge: 'تحويل بنكي يدوي', isEnabled: true, isCod: false, order: 1,
  },
  {
    id: 'pm-omqi', key: 'BANK_OMQI', name: 'تحويل شركة العمقي للصرافة', nameEn: 'Omqi Exchange Transfer',
    bankOrIssuer: 'شركة العمقي وإخوانه للصرافة', accountNumber: '25410988', color: 'from-teal-700 to-teal-800', badge: 'تحويل بنكي يدوي', isEnabled: true, isCod: false, order: 2,
  },
  {
    id: 'pm-cod', key: 'COD', name: 'الدفع عند الاستلام', nameEn: 'Cash on Delivery (COD)',
    bankOrIssuer: 'حضرموت هايبر - تسليم مباشر للمندوب', accountNumber: 'نقداً أو عبر شبكة POS', color: 'from-stone-700 to-stone-800', badge: 'مشروط بـ 5 طلبات', isEnabled: true, isCod: true, minOrdersForCod: 5, order: 3,
  },
];
