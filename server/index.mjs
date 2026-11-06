import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createApp} from './app.mjs';
const api=createApp();
const root=resolve('dist');
const host=process.env.CURRENT_HOST||'127.0.0.1';
if(api.demo&&host!=='127.0.0.1'&&host!=='localhost')throw new Error('Demo mode must bind to loopback. Set CURRENT_ADMIN_PASSWORD before binding externally.');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
  if((req.url||'').startsWith('/api/'))return api(req,res);
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','same-origin');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
  if(process.env.CURRENT_COOKIE_SECURE==='true')res.setHeader('Strict-Transport-Security','max-age=31536000');
  try{
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
    if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403);return res.end();}
    let file=path;try{if(!(await stat(file)).isFile())file=resolve(root,'index.html');}catch{file=resolve(root,'index.html');}
    const content=await readFile(file);res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(content);
  }catch{res.writeHead(404);res.end('Build the app with npm run build first.');}
});
server.listen(Number(process.env.PORT||4173),host,()=>console.log(`Current ready on http://${host}:${process.env.PORT||4173} · ${api.demo?'sample workspace':'password protected'}`));
