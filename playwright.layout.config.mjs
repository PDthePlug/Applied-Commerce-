import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/layout-browser',timeout:30000,workers:1,reporter:[['line']],
 outputDir:'test-results/layout',
 use:{launchOptions:process.env.AC_BROWSER_EXECUTABLE?{executablePath:process.env.AC_BROWSER_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:undefined},
});
