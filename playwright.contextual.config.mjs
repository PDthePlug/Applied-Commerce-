import {defineConfig} from '@playwright/test';import path from 'node:path';
export default defineConfig({testDir:'./tests/contextual-browser',timeout:90_000,expect:{timeout:12_000},workers:1,retries:0,
 reporter:[['line'],['json',{outputFile:'work/classroom-v2/private/benchmark-suite/browser-results.json'}]],outputDir:'work/classroom-v2/private/benchmark-suite/browser-results',
 use:{baseURL:'http://127.0.0.1:3200',trace:'retain-on-failure',launchOptions:process.env.AC_BROWSER_EXECUTABLE?{executablePath:process.env.AC_BROWSER_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:undefined},
 webServer:{command:'npm --prefix work/classroom/fixture-app run start -- -H 127.0.0.1 -p 3200',url:'http://127.0.0.1:3200',reuseExistingServer:false,timeout:120_000,env:{NEXT_PUBLIC_APPLIED_COMMERCE_BACKEND_MODE:'local',NEXT_PUBLIC_SUPABASE_URL:'',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'',AC_CLASSROOM_CONTENT_KEY_FILE:path.resolve('work/classroom/private/content.classroom-key')}},
 projects:[[320,740],[360,800],[430,932],[768,1024],[1280,900],[1920,1080]].map(([width,height])=>({name:`contextual-${width}`,use:{viewport:{width,height}}})),
});
