import {defineConfig,devices} from '@playwright/test';
const api='http://127.0.0.1:18581/api/v1';
export default defineConfig({
  testDir:'./tests/live',timeout:90000,expect:{timeout:15000},workers:1,reporter:[['list']],
  use:{baseURL:'http://127.0.0.1:5173',trace:'retain-on-failure'},
  webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',url:'http://127.0.0.1:5173',reuseExistingServer:false,env:{VITE_API_URL:api,VITE_API_BASE_URL:api,VITE_API_PROXY_TARGET:'http://127.0.0.1:18581'},timeout:60000},
  projects:[{name:'chromium-live',use:{...devices['Desktop Chrome']}}],
});
