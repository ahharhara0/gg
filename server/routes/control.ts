import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission, requireAnyRole } from '../middleware/rbac.js';
import { sensitiveRateLimit, generalRateLimit } from '../middleware/rateLimit.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { getDb, isFirebaseReady } from '../services/firebaseAdmin.js';
import { listUsers } from '../services/users.js';
import { writeAuditLog, listAuditLogs } from '../services/audit.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router=Router();
router.get('/overview', authenticate, generalRateLimit, requireAnyRole('admin','super_admin','developer','operations','finance','support'), asyncHandler(async (_req,res)=>{
  if(!isFirebaseReady()) throw new ApiError(503,'BACKEND_NOT_READY','قاعدة البيانات غير متاحة');
  const db=getDb();
  const [users,orders,products,complaints,payments,pendingRefunds]=await Promise.all([
    db.collection('users').limit(1000).get(), db.collection('orders').limit(1000).get(), db.collection('products').limit(1000).get(),
    db.collection('complaints').where('status','in',['open','in_progress']).limit(200).get(),
    db.collection('payments').where('status','==','PENDING').limit(200).get(),
    db.collection('orders').where('status','==','REFUND_PENDING').limit(200).get()
  ]);
  let sales=0, delivered=0, codPending=0; orders.forEach(d=>{const o=d.data() as any; if(o.status==='DELIVERED') delivered++; if(typeof o.total==='number') sales+=o.total; if(o.paymentStatus==='COD_PENDING') codPending++;});
  res.json({success:true,overview:{users:users.size,orders:orders.size,products:products.size,openComplaints:complaints.size,pendingPayments:payments.size,pendingRefunds:pendingRefunds.size,deliveredOrders:delivered,grossSalesYER:sales,codPending}});
}));

router.get('/security', authenticate, generalRateLimit, requirePermission('VIEW_AUDIT_LOGS'), asyncHandler(async (_req,res)=>{
  const logs=await listAuditLogs({limit:100});
  const securityEvents=logs.filter(l=>l.category==='security');
  res.json({success:true,security:{recentSecurityEvents:securityEvents,criticalCount:securityEvents.filter(l=>l.severity==='critical').length,blockedCount:securityEvents.filter(l=>l.status==='BLOCKED').length}});
}));

router.post('/refunds/confirm', authenticate, sensitiveRateLimit, requirePermission('PROCESS_REFUNDS'), asyncHandler(async(req,res)=>{
  const auth=req as AuthenticatedRequest; const {orderId,providerReference}=req.body||{};
  if(!orderId||!providerReference) throw new ApiError(400,'INVALID_REQUEST','رقم الطلب ومرجع الاسترجاع مطلوبان');
  const db=getDb(); const ref=db.collection('orders').doc(orderId); const snap=await ref.get(); if(!snap.exists) throw new ApiError(404,'ORDER_NOT_FOUND','الطلب غير موجود');
  const order=snap.data() as any; if(order.status!=='REFUND_PENDING') throw new ApiError(409,'INVALID_REFUND_STATE','الطلب ليس في انتظار تأكيد الاسترجاع');
  await ref.update({status:'REFUNDED',paymentStatus:'REFUNDED',refundConfirmedAt:new Date().toISOString(),refundConfirmedBy:auth.uid,refundProviderReference:providerReference,updatedAt:new Date().toISOString()});
  await writeAuditLog({actorUid:auth.uid!,actorRole:auth.user!.role,action:'REFUND_CONFIRMED',category:'finance',targetId:orderId,details:{providerReference},severity:'critical',status:'SUCCESS'});
  res.json({success:true});
}));


router.get('/cod-eligibility', authenticate, generalRateLimit, async(req,res)=>{
  const auth=req as AuthenticatedRequest; if(!isFirebaseReady()) throw new ApiError(503,'BACKEND_NOT_READY','قاعدة البيانات غير متاحة');
  const db=getDb(); const snap=await db.collection('orders').where('customerId','==',auth.uid).where('status','==','DELIVERED').where('paymentStatus','==','PAID').limit(100).get();
  const successfulPrepaid=snap.docs.filter(d=>String((d.data() as any).paymentMethod||'').toUpperCase()!=='COD').length;
  res.json({success:true,eligible:successfulPrepaid>=5,successfulPrepaidOrders:successfulPrepaid,required:5});
});
router.post('/cod/collect', authenticate, sensitiveRateLimit, asyncHandler(async(req,res)=>{
  const auth=req as AuthenticatedRequest; if(auth.user!.role!=='driver'&&auth.user!.role!=='admin'&&auth.user!.role!=='super_admin') throw new ApiError(403,'INSUFFICIENT_PERMISSION','غير مصرح بتحصيل COD');
  const {orderId,amount,reference}=req.body||{}; if(!orderId||typeof amount!=='number'||!reference) throw new ApiError(400,'INVALID_REQUEST','بيانات التحصيل غير مكتملة');
  const db=getDb(); const ref=db.collection('orders').doc(orderId);
  await db.runTransaction(async tx=>{ const snap=await tx.get(ref); if(!snap.exists) throw new ApiError(404,'ORDER_NOT_FOUND','الطلب غير موجود'); const o=snap.data() as any; if(o.paymentMethod!=='COD' && o.paymentStatus!=='COD_PENDING') throw new ApiError(400,'NOT_COD','الطلب ليس نقدًا عند الاستلام'); if(auth.user!.role==='driver' && o.driverId!==auth.uid) throw new ApiError(403,'NOT_ASSIGNED_DRIVER','الطلب غير مسند إليك'); if(o.paymentStatus!=='COD_PENDING') throw new ApiError(409,'ALREADY_COLLECTED','تم تحصيل الطلب مسبقًا'); if(amount!==o.payableRemaining) throw new ApiError(400,'COD_AMOUNT_MISMATCH','المبلغ المحصل لا يطابق المستحق'); tx.update(ref,{paymentStatus:'PAID',paymentReference:reference,codCollectedAt:new Date().toISOString(),codCollectedBy:auth.uid,status:o.status==='DELIVERED'?'DELIVERED':o.status,updatedAt:new Date().toISOString()}); });
  await writeAuditLog({actorUid:auth.uid!,actorRole:auth.user!.role,action:'COD_COLLECTED',category:'finance',targetId:orderId,details:{amount,reference},severity:'warning',status:'SUCCESS'});
  res.json({success:true,orderId,paymentStatus:'PAID'});
}));

router.put('/categories', authenticate, sensitiveRateLimit, requirePermission('MANAGE_CATEGORIES'), asyncHandler(async(req,res)=>{
  if(!isFirebaseReady()) throw new ApiError(503,'BACKEND_NOT_READY','قاعدة البيانات غير متاحة');
  const categories=Array.isArray(req.body?.categories)?req.body.categories:[]; if(categories.length>500) throw new ApiError(400,'INVALID_REQUEST','عدد التصنيفات كبير جدًا');
  const db=getDb(); const batch=db.batch(); for(const c of categories){ if(!c?.id) throw new ApiError(400,'INVALID_CATEGORY','معرّف التصنيف مطلوب'); batch.set(db.collection('categories').doc(String(c.id)),{...c,updatedAt:new Date().toISOString()},{merge:true}); } await batch.commit();
  const auth=req as AuthenticatedRequest; await writeAuditLog({actorUid:auth.uid!,actorRole:auth.user!.role,action:'CATEGORIES_UPDATED',category:'catalog',details:{count:categories.length},severity:'info',status:'SUCCESS'}); res.json({success:true,count:categories.length});
}));
router.put('/payment-methods', authenticate, sensitiveRateLimit, requirePermission('MANAGE_PAYMENTS'), asyncHandler(async(req,res)=>{
  if(!isFirebaseReady()) throw new ApiError(503,'BACKEND_NOT_READY','قاعدة البيانات غير متاحة');
  const methods=Array.isArray(req.body?.methods)?req.body.methods:[]; if(methods.length>100) throw new ApiError(400,'INVALID_REQUEST','عدد طرق الدفع كبير جدًا');
  const db=getDb(); const batch=db.batch(); for(const m of methods){ if(!m?.id) throw new ApiError(400,'INVALID_PAYMENT_METHOD','معرّف طريقة الدفع مطلوب'); batch.set(db.collection('payment_methods').doc(String(m.id)),{...m,updatedAt:new Date().toISOString()},{merge:true}); } await batch.commit();
  const auth=req as AuthenticatedRequest; await writeAuditLog({actorUid:auth.uid!,actorRole:auth.user!.role,action:'PAYMENT_METHODS_UPDATED',category:'finance',details:{count:methods.length},severity:'warning',status:'SUCCESS'}); res.json({success:true,count:methods.length});
}));
router.delete('/payment-methods/:id', authenticate, sensitiveRateLimit, requirePermission('MANAGE_PAYMENTS'), asyncHandler(async(req,res)=>{ if(!isFirebaseReady()) throw new ApiError(503,'BACKEND_NOT_READY','قاعدة البيانات غير متاحة'); const db=getDb(); await db.collection('payment_methods').doc(req.params.id).delete(); const auth=req as AuthenticatedRequest; await writeAuditLog({actorUid:auth.uid!,actorRole:auth.user!.role,action:'PAYMENT_METHOD_DELETED',category:'finance',targetId:req.params.id,severity:'warning',status:'SUCCESS'}); res.json({success:true}); }));

export default router;
