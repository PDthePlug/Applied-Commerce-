import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers(){
    return [{source:"/:path*",headers:[
      {key:"X-Content-Type-Options",value:"nosniff"},
      {key:"X-Frame-Options",value:"DENY"},
      {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
      {key:"Content-Security-Policy",value:"frame-ancestors 'none'; object-src 'none'; base-uri 'self'"},
    ]}, {source:"/sw.js",headers:[
      {key:"Content-Type",value:"application/javascript; charset=utf-8"},
      {key:"Cache-Control",value:"no-cache, no-store, must-revalidate"},
      {key:"Service-Worker-Allowed",value:"/"},
    ]}];
  },
};
export default nextConfig;
