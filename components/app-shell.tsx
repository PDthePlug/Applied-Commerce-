"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Archive, BarChart3, Home } from "lucide-react";
import { Brand } from "./brand";

const nav=[
  {href:"/",label:"Home",icon:Home},
  {href:"/learn",label:"Learn",icon:BookOpen},
  {href:"/portfolio",label:"Portfolio",icon:Archive},
  {href:"/progress",label:"Progress",icon:BarChart3},
];

export function AppShell({children}:{children:React.ReactNode}) {
  const pathname=usePathname();
  const focusedReader=/\/learn\/\d+\/term\/\d+\/.+/.test(pathname);
  return <div className={`app-shell ${focusedReader?"focused-reader":""}`}>
    {!focusedReader && <header className="topbar">
      <Brand />
      <nav className="desktop-nav" aria-label="Main navigation">
        {nav.map(item=>{const I=item.icon; const active=item.href==="/"?pathname==="/":pathname.startsWith(item.href); return <Link className={active?"active":""} href={item.href} key={item.href}><I/> {item.label}</Link>})}
      </nav>
      <div className="topbar-note">Grades 8–12</div>
    </header>}
    <main>{children}</main>
    {!focusedReader && <nav className="mobile-nav" aria-label="Mobile navigation">
      {nav.map(item=>{const I=item.icon; const active=item.href==="/"?pathname==="/":pathname.startsWith(item.href); return <Link className={active?"active":""} href={item.href} key={item.href}><I/><span>{item.label}</span></Link>})}
    </nav>}
  </div>;
}
