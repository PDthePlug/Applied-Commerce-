import {defineConfig} from '@playwright/test';
import fs from 'node:fs';
const proxyUrl=process.env.HTTPS_PROXY?new URL(process.env.HTTPS_PROXY):null;
const proxy=proxyUrl?{server:proxyUrl.origin,username:decodeURIComponent(proxyUrl.username),password:decodeURIComponent(proxyUrl.password),bypass:'127.0.0.1,localhost'}:undefined;
const bypassProxyTLS=process.env.AC_TEST_PROXY_TLS_BYPASS==='1';
const publicConfig=JSON.parse(fs.readFileSync(process.env.AC_ROLE_FIXTURES+'/public-config.json'));
export default defineConfig({testDir:'./tests/role-sessions',timeout:420000,expect:{timeout:30000},workers:1,retries:0,reporter:[['line']],outputDir:'test-results/roles',use:{baseURL:process.env.AC_ROLE_BASE_URL??'http://127.0.0.1:3100',trace:'off',screenshot:'off',launchOptions:process.env.AC_BROWSER_EXECUTABLE?{executablePath:process.env.AC_BROWSER_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage',...(bypassProxyTLS?['--ignore-certificate-errors']:[])],proxy}:undefined},webServer:process.env.AC_ROLE_BASE_URL?undefined:{command:'npm run start -- -H 127.0.0.1 -p 3100',url:'http://127.0.0.1:3100',reuseExistingServer:false,env:{NEXT_PUBLIC_SUPABASE_URL:publicConfig.url,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:publicConfig.key}},projects:[{name:'roles-desktop',use:{viewport:{width:1280,height:900}}},{name:'roles-mobile',use:{viewport:{width:360,height:800}}}]});
