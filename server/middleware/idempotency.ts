import { Request, Response, NextFunction } from 'express';
import { getDb, isFirebaseReady } from '../services/firebaseAdmin.js';
import { logger } from '../utils/logger.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { config } from '../config.js';

const COLLECTION = 'idempotency_keys';
const HEADER = 'idempotency-key';
const KEY_REGEX = /^[a-zA-Z0-9_-]{8,128}$/;

/** Atomic idempotency claim. A request is either the owner of a new key, a replay, or rejected as in-flight/conflicting. */
export async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const requestId = authReq.requestId ?? 'no-req-id';
  const key = req.headers[HEADER] as string | undefined;
  if (!key) { next(); return; }
  if (!KEY_REGEX.test(key)) {
    res.status(400).json({ success:false, error:{code:'INVALID_IDEMPOTENCY_KEY', message:'مفتاح Idempotency غير صالح'}, requestId });
    return;
  }
  if (!isFirebaseReady()) {
    res.status(503).json({ success:false, error:{code:'BACKEND_NOT_READY', message:'خدمة العمليات الآمنة غير متاحة حاليًا'}, requestId });
    return;
  }

  const db=getDb();
  const ref=db.collection(COLLECTION).doc(key);
  const endpoint=`${req.method}:${req.path}`;
  const uid=authReq.uid ?? null;
  const now=Date.now();
  let replay:any=null;
  let claimed=false;
  try {
    await db.runTransaction(async tx=>{
      const snap=await tx.get(ref);
      if(snap.exists){
        const r=snap.data()||{};
        const expires=Date.parse(String(r.expiresAt||''));
        if(Number.isFinite(expires) && expires <= now){
          tx.delete(ref);
          tx.create(ref,{key,endpoint,uid,state:'processing',createdAt:new Date().toISOString(),expiresAt:new Date(now+config.idempotencyTtlSeconds*1000).toISOString()});
          claimed=true; return;
        }
        if(r.endpoint!==endpoint || r.uid!==uid) throw Object.assign(new Error('IDEMPOTENCY_KEY_CONFLICT'),{code:'CONFLICT'});
        if(r.state==='completed' && r.responsePayload!==undefined){ replay=r; return; }
        throw Object.assign(new Error('IDEMPOTENCY_IN_PROGRESS'),{code:'IN_PROGRESS'});
      }
      tx.create(ref,{key,endpoint,uid,state:'processing',createdAt:new Date().toISOString(),expiresAt:new Date(now+config.idempotencyTtlSeconds*1000).toISOString()});
      claimed=true;
    });
  } catch(err:any){
    if(err?.code==='CONFLICT'){ res.status(409).json({success:false,error:{code:'IDEMPOTENCY_KEY_CONFLICT',message:'مفتاح Idempotency مستخدم لعملية مختلفة'},requestId}); return; }
    if(err?.code==='IN_PROGRESS'){ res.status(409).json({success:false,error:{code:'IDEMPOTENCY_IN_PROGRESS',message:'العملية نفسها قيد التنفيذ؛ أعد المحاولة بعد لحظات'},requestId,retryable:true}); return; }
    logger.error('Atomic idempotency claim failed',{requestId,error:err?.message});
    res.status(503).json({success:false,error:{code:'IDEMPOTENCY_UNAVAILABLE',message:'تعذر تأمين العملية؛ أعد المحاولة'},requestId}); return;
  }
  if(replay){ res.status(replay.statusCode).json(replay.responsePayload); return; }
  if(!claimed){ res.status(409).json({success:false,error:{code:'IDEMPOTENCY_IN_PROGRESS',message:'العملية قيد التنفيذ'},requestId}); return; }
  authReq.idempotencyKey=key;
  const originalSend=res.send.bind(res) as (body?:unknown)=>Response;
  res.send=function patched(body?:unknown){
    const payload=typeof body==='string' ? (()=>{try{return JSON.parse(body)}catch{return body}})() : body;
    const record={state:'completed',statusCode:res.statusCode,responsePayload:payload,completedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+config.idempotencyTtlSeconds*1000).toISOString()};
    ref.set(record,{merge:true}).catch(e=>logger.error('Idempotency completion write failed',{key,error:e?.message}));
    return originalSend(body);
  } as (body?:unknown)=>Response;
  next();
}
