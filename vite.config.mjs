import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createApp } from './server/app.mjs';
export default defineConfig({plugins:[react(),{name:'current-api',configureServer(server){const app=createApp();server.middlewares.use('/api',(req,res)=>app(req,res));}}],server:{host:'127.0.0.1',allowedHosts:['terminal.local']}});
