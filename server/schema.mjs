import {z} from 'zod';
const text=(max=300)=>z.string().trim().max(max);
const required=(max=200)=>text(max).min(1);
const id=required(100);
const cents=z.number().int().min(0).max(100000000);
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>{const d=new Date(v+'T12:00:00Z');return !isNaN(d.getTime())&&d.toISOString().slice(0,10)===v;},'Choose a valid date');
export const schemas={
  customers:z.object({name:required(),email:z.union([z.email(),z.literal('')]),phone:text(40),address:text(500),plan:z.enum(['Weekly care','Monthly care','On demand']),access:text(2000),notes:text(5000),smsConsent:z.boolean(),tubs:z.array(z.object({id,model:required(),serial:text(),gallons:z.number().min(1).max(10000),warrantyUntil:z.union([date,z.literal('')])})).max(30)}),
  jobs:z.object({customerId:id,tubId:text(100),title:required(),type:z.enum(['Cleaning','Repair','Delivery']),crew:z.enum(['north','lake','south','unassigned']),date,start:z.number().int().min(360).max(1200),duration:z.number().int().min(15).max(480),status:z.enum(['Unassigned','Scheduled','On site','Completed','Cancelled']),confirmation:z.enum(['Pending','Confirmed']),recurrence:z.enum(['None','Weekly','Biweekly','Monthly']),priceCents:cents,notes:text(5000),checklist:z.array(z.boolean()).length(3),partsUsed:z.array(z.object({inventoryId:id,quantity:z.number().int().min(1).max(999)})).max(30),latitude:z.number().min(-90).max(90).optional(),longitude:z.number().min(-180).max(180).optional()}),
  inventory:z.object({name:required(),sku:required(80),category:z.enum(['Chemicals','Filters','Parts','Hot tubs','Water testing','Accessories']),stock:z.number().int().min(0).max(100000),reorderAt:z.number().int().min(0).max(100000),costCents:cents,priceCents:cents,location:text(200)}),
  invoices:z.object({customerId:id,jobId:text(100),number:text(100),status:z.enum(['Draft','Awaiting payment','Paid']),dueDate:date,items:z.array(z.object({description:required(),quantity:z.number().int().min(1).max(9999),unitCents:cents})).min(1).max(100),taxBps:z.number().int().min(0).max(3000),notes:text(3000),paymentReference:text(300).optional()}),
  readings:z.object({customerId:id,jobId:text(100),date,ph:z.number().min(0).max(14),chlorine:z.number().min(0).max(30),alkalinity:z.number().min(0).max(1000),temperature:z.number().min(32).max(120),notes:text(3000)}),
  sales:z.object({customerId:id,title:required(),stage:z.enum(['New lead','Consultation','Quote sent','Won','Lost']),valueCents:cents,nextStep:text(500),notes:text(3000)}),
  workflows:z.object({name:required(),trigger:z.enum(['job.created','job.completed','invoice.created']),action:z.enum(['draft_sms','draft_email','create_task']),enabled:z.boolean(),template:required(3000)}),
  messages:z.object({customerId:id,channel:z.enum(['SMS','Email','Portal']),direction:z.enum(['outbound','inbound']),status:z.enum(['Draft','Received']),body:required(5000),createdAt:z.string().datetime()}),
  tasks:z.object({customerId:id,title:required(3000),status:z.enum(['Open','Done']),createdAt:z.string().datetime()})
};
export const invoiceTotal=inv=>{const subtotal=inv.items.reduce((n,i)=>n+i.quantity*i.unitCents,0);return subtotal+Math.round(subtotal*inv.taxBps/10000);};
export const jobEnd=job=>job.start+job.duration;
export function validateLinks(store,entity,data,ignoreId){
  const fail=(message,status=422)=>{throw Object.assign(new Error(message),{status});};
  if(data.customerId&&!store.get('customers',data.customerId))fail('Choose an existing customer.');
  if(entity==='jobs'){
    const customer=store.get('customers',data.customerId);
    if(data.tubId&&!customer.tubs.some(t=>t.id===data.tubId))fail('This hot tub does not belong to the customer.');
    if(jobEnd(data)>1260)fail('Jobs must finish by 9:00 PM.');
    if(data.crew!=='unassigned'&&!['Cancelled','Completed'].includes(data.status)){
      const conflict=store.list('jobs').find(j=>j.id!==ignoreId&&j.crew===data.crew&&j.date===data.date&&!['Cancelled','Completed'].includes(j.status)&&data.start<jobEnd(j)&&jobEnd(data)>j.start);
      if(conflict)fail(`This crew already has ${conflict.title} during that time.`,409);
    }
  }
  if(data.jobId){const job=store.get('jobs',data.jobId);if(!job||job.customerId!==data.customerId)fail('Choose a job belonging to this customer.');}
  if(entity==='inventory'&&store.list('inventory').some(p=>p.id!==ignoreId&&p.sku.toLowerCase()===data.sku.toLowerCase()))fail('That SKU already exists.',409);
  if(entity==='invoices'&&data.jobId&&store.list('invoices').some(i=>i.id!==ignoreId&&i.jobId===data.jobId))fail('This job already has an invoice.',409);
}
