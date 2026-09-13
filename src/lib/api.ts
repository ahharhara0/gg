import { auth } from './firebase';

export async function apiFetch<T=any>(path:string, init:RequestInit={}) : Promise<T> {
  const user=auth.currentUser; const token=user ? await user.getIdToken() : null;
  const headers=new Headers(init.headers||{}); headers.set('Content-Type','application/json'); if(token) headers.set('Authorization',`Bearer ${token}`);
  const res=await fetch(path,{...init,headers,credentials:'include'}); const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data?.error?.message || `API ${res.status}`); return data as T;
}
