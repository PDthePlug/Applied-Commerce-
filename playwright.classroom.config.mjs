import {defineConfig} from '@playwright/test';
import path from 'node:path';
export default defineConfig({
 // Each case includes axe, a long full-guide capture, print and a reader round trip.
 testDir:'./tests/classroom-browser',timeout:90_000,expect:{timeout:12_000},workers:1,retries:0,
 reporter:[['line']],outputDir:'work/classroom/private/browser-results',
 use:{baseURL:'http://127.0.0.1:3200',trace:'retain-on-failure',launchOptions:process.env.AC_BROWSER_EXECUTABLE?{executablePath:process.env.AC_BROWSER_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:undefined},
 webServer:{command:'npm --prefix work/classroom/fixture-app run start -- -H 127.0.0.1 -p 3200',url:'http://127.0.0.1:3200',timeout:120_000,reuseExistingServer:false,env:{NEXT_PUBLIC_APPLIED_COMMERCE_BACKEND_MODE:'local',NEXT_PUBLIC_SUPABASE_URL:'',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'',AC_CLASSROOM_CONTENT_KEY_FILE:path.resolve('work/classroom/private/content.classroom-key')}},
 projects:[320,360,430,768,1280,1920].map(width=>({name:`classroom-${width}`,use:{viewport:{width,height:width<500?900:1000}}})),
});
