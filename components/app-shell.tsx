"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useModalFocus } from "@/lib/use-modal-focus";
import { Archive, BarChart3, BookOpen, Home, Menu, UserRound, X } from "lucide-react";
import { Brand } from "./brand";

const nav=[
  {href:"/",label:"Home",detail:"Your Applied Commerce starting point",icon:Home},
  {href:"/learn",label:"Learn",detail:"Grades, terms and lessons",icon:BookOpen},
  {href:"/portfolio",label:"Portfolio",detail:"Evidence captured from your work",icon:Archive},
  {href:"/progress",label:"Progress",detail:"See what you have completed",icon:BarChart3},
  {href:"/profile",label:"Profile",detail:"Your learner record and current grade",icon:UserRound},
];

export function AppShell({children}:{children:React.ReactNode}) {
  const pathname=usePathname();
  const focusedReader=/\/learn\/\d+\/term\/\d+\/.+/.test(pathname);
  const authPage=pathname==="/auth";
  const institutional=pathname.startsWith("/institutions");
  const facilitator=pathname.startsWith("/facilitator");
  const staffSurface=institutional||facilitator;
  const [menuOpen,setMenuOpen]=useState(false);
  const triggerRef=useRef<HTMLButtonElement|null>(null);
  const menuRef=useRef<HTMLElement|null>(null);
  const closeMenu=useCallback(()=>setMenuOpen(false),[]);
  useModalFocus(menuOpen,menuRef,triggerRef,closeMenu);

  return <div className={"app-shell "+(focusedReader?"focused-reader ":"")+(institutional?"institutional-shell ":"")+(facilitator?"facilitator-shell":"")}>
    <a className="skip-link" href={focusedReader?"#lesson-content":"#main-content"}>Skip to main content</a>
    {!focusedReader && !authPage && <header className="topbar">
      <Brand
        href={institutional?"/institutions":facilitator?"/facilitator":"/"}
        subtitle={institutional?"Learning Infrastructure":facilitator?"Facilitator Workspace":"Learning Platform"}
      />
      {institutional
        ? <div className="topbar-note institutional-topbar-note"><Link href="/">Learner platform</Link><span>For institutions</span></div>
        : facilitator
          ? <div className="topbar-note"><Link href="/">Learner platform</Link><span>Evidence & assessment</span></div>
          : <div className="topbar-note"><Link className="topbar-auth-link" href="/auth">Staff sign in</Link></div>}
    </header>}
    <main id="main-content" tabIndex={-1}>{children}</main>

    {!staffSurface && !authPage && menuOpen && <>
      <button className="app-menu-scrim" data-modal-backdrop type="button" tabIndex={-1} onClick={closeMenu} aria-label="Close Applied Commerce menu"/>
      <section ref={menuRef} className="app-menu-sheet" role="dialog" aria-modal="true" aria-label="Applied Commerce menu" tabIndex={-1}>
       <header>
        <div><span className="brand-mark">AC</span><div><strong>Applied Commerce</strong><small>Learner menu</small></div></div>
        <button type="button" onClick={closeMenu} aria-label="Close menu"><X/></button>
       </header>
       <nav className="app-menu-items">
        {nav.map(item=>{
          const Icon=item.icon;
          const active=item.href==="/"?pathname==="/":pathname.startsWith(item.href);
          return <Link key={item.href} className={active?"active":""} href={item.href} onClick={()=>setMenuOpen(false)} aria-current={active?"page":undefined}>
           <Icon/><span><strong>{item.label}</strong><small>{item.detail}</small></span>{active&&<em>Current</em>}
          </Link>;
        })}
       </nav>
      </section>
    </>}

    {!staffSurface && !authPage && <button ref={triggerRef} className="app-menu-trigger" type="button" onClick={()=>setMenuOpen(true)} aria-label="Open Applied Commerce menu" aria-haspopup="dialog" aria-expanded={menuOpen}>
      <Menu/><span>Menu</span>
    </button>}
  </div>;
}
