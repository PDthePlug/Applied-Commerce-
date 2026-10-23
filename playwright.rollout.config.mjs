import {defineConfig}from '@playwright/test';
export default defineConfig({testDir:'./tests/rollout-browser',timeout:45000,expect:{timeout:15000},workers:2,retries:0,reporter:[['line']],outputDir:'test-results/rollout',
 use:{baseURL:'http://127.0.0.1:3101',trace:'retain-on-failure',launchOptions:{executablePath:process.env.AC_BROWSER_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}},
 webServer:{command:'npm run start -- -H 127.0.0.1 -p 3101',url:'http://127.0.0.1:3101',reuseExistingServer:false,env:{NEXT_PUBLIC_APPLIED_COMMERCE_BACKEND_MODE:'local'}},
 projects:[[320,800],[430,932],[1280,900]].map(([width,height])=>({name:'rollout-'+width,use:{viewport:{width,height}}}))});
