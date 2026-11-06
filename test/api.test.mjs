import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createStore,today} from '../server/store.mjs';
import {createApp} from '../server/app.mjs';

async function fixture(run,password){
  const store=createStore(':memory:');const app=createApp({store,password});const server=createServer(app);
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
  const request=async(path,method='GET',data,cookie)=>{const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(cookie?{cookie}:{})},body:data?JSON.stringify(data):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')};};
  try{await run({request,store});}finally{await new Promise(r=>server.close(r));store.close();}
}
test('creates a job and produces a workflow draft without sending a message',()=>fixture(async({request,store})=>{
  const sample=store.get('jobs','j1');const {id,version,...data}=sample;
  const r=await request('/api/jobs','POST',{...data,date:'2026-12-10',status:'Scheduled',start:600});
  assert.equal(r.status,201);assert.equal(store.list('messages').length,2);assert.equal(store.list('messages').at(-1).status,'Draft');
}));
test('rejects conflicting crew schedules and stale updates',()=>fixture(async({request,store})=>{
  const job=store.get('jobs','j3');
  assert.equal((await request('/api/jobs/j3','PATCH',{version:job.version,start:620})).status,409);
  assert.equal((await request('/api/jobs/j3','PATCH',{version:99,notes:'A stale window'})).status,409);
}));
test('requires checklist and atomically deducts stock only once',()=>fixture(async({request,store})=>{
  let job=store.get('jobs','j3');
  assert.equal((await request('/api/jobs/j3','PATCH',{version:job.version,status:'Completed'})).status,422);
  let r=await request('/api/jobs/j3','PATCH',{version:job.version,status:'Completed',checklist:[true,true,true],partsUsed:[{inventoryId:'p2',quantity:99}]});
  assert.equal(r.status,409);assert.equal(store.get('inventory','p2').stock,6);assert.equal(store.get('jobs','j3').status,'Scheduled');
  r=await request('/api/jobs/j3','PATCH',{version:job.version,status:'Completed',checklist:[true,true,true],partsUsed:[{inventoryId:'p2',quantity:2}]});
  assert.equal(r.status,200);assert.equal(store.get('inventory','p2').stock,4);
  assert.equal((await request('/api/jobs/j3','PATCH',{version:r.data.version,status:'Scheduled'})).status,422);
  assert.equal(store.get('inventory','p2').stock,4);
}));
test('customer import rolls back the whole batch on duplicate or invalid rows',()=>fixture(async({request,store})=>{
  const {id,version,...customer}=store.get('customers','c1');const count=store.list('customers').length;
  assert.equal((await request('/api/import/customers','POST',{rows:[{...customer,email:'new@example.com'},customer]})).status,409);
  assert.equal(store.list('customers').length,count);
  assert.equal((await request('/api/import/customers','POST',{rows:[{...customer,email:'new@example.com',name:''}]})).status,422);
  assert.equal(store.list('customers').length,count);
}));
test('portal exposes only its customer and accepts a scoped service request',()=>fixture(async({request,store})=>{
  const r=await request('/api/customers/c1/portal','POST',{});assert.equal(r.status,200);
  const portal=await request('/api'+r.data.path);assert.equal(portal.data.customer.name,'Marissa Cole');
  assert.ok(portal.data.jobs.every(j=>j.id==='j1'));assert.equal(portal.data.customer.access,undefined);assert.equal(portal.data.customer.email,undefined);
  assert.equal((await request('/api'+r.data.path+'/request','POST',{message:'Please check the heater on the next visit.'})).status,201);
  assert.equal(store.list('messages').at(-1).customerId,'c1');
  await request('/api/customers/c1/portal','POST',{});
  assert.equal((await request('/api'+r.data.path)).status,404);
}));
test('password mode protects records, rejects bad login, and issues an HttpOnly session',()=>fixture(async({request})=>{
  assert.equal((await request('/api/data')).status,401);
  assert.equal((await request('/api/login','POST',{password:'wrong'})).status,401);
  const login=await request('/api/login','POST',{password:'a-long-test-password-for-current'});
  assert.equal(login.status,200);assert.match(login.cookie,/HttpOnly/);
  assert.equal((await request('/api/data','GET',null,login.cookie)).status,200);
},'a-long-test-password-for-current'));
test('does not allow draft messages to be marked sent and records payment evidence',()=>fixture(async({request,store})=>{
  assert.equal((await request('/api/messages/m1/send','POST',{})).status,503);
  assert.equal((await request('/api/messages/m1','PATCH',{version:1,status:'Sent'})).status,422);
  assert.equal((await request('/api/invoices/i2','PATCH',{version:1,status:'Paid'})).status,422);
  assert.equal((await request('/api/invoices/i2','PATCH',{version:1,status:'Paid',paymentReference:'Check 10245'})).status,200);
  assert.equal((await request('/api/invoices/i2','PATCH',{version:2,notes:'Cannot change a paid invoice'})).status,422);
}));
