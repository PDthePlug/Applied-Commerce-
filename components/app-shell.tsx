"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const institutional=pathname.startsWith("/institutions");
  const facilitator=pathname.startsWith("/facilitator");
  const staffSurface=institutional||facilitator;
  const [menuOpen,setMenuOpen]=useState(false);
  const triggerRef=useRef<HTMLButtonElement|null>(null);
  const closeRef=useRef<HTMLButtonElement|null>(null);

  useEffect(()=>{
    if(!menuOpen) return;
    const previousOverflow=document.body.style.overflow;
    const trigger=triggerRef.current;
    document.body.style.overflow="hidden";
    requestAnimationFrame(()=>closeRef.current?.focus());
    const onKeyDown=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){
        event.preventDefault();
        setMenuOpen(false);
        return;
      }
      if(event.key!=="Tab") return;
      const dialog=document.querySelector<HTMLElement>(".app-menu-sheet");
      if(!dialog) return;
      const focusable=[...dialog.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])')];
      if(!focusable.length) return;
      const first=focusable[0];
      const last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){
        event.preventDefault();
        last.focus();
      }else if(!event.shiftKey&&document.activeElement===last){
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown",onKeyDown);
    return ()=>{
      document.body.style.overflow=previousOverflow;
      window.removeEventListener("keydown",onKeyDown);
      requestAnimationFrame(()=>trigger?.focus());
    };
  },[menuOpen]);

  return <div className={"app-shell "+(focusedReader?"focused-reader ":"")+(institutional?"institutional-shell ":"")+(facilitator?"facilitator-shell":"")}>
    {!focusedReader && <header className="topbar">
      <Brand
        href={institutional?"/institutions":facilitator?"/facilitator":"/"}
        subtitle={institutional?"Learning Infrastructure":facilitator?"Facilitator Workspace":"Learning Platform"}
      />
      {institutional
        ? <div className="topbar-note institutional-topbar-note"><Link href="/">Learner platform</Link><span>For institutions</span></div>
        : facilitator
          ? <div className="topbar-note"><Link href="/">Learner platform</Link><span>Evidence & assessment</span></div>
          : <div className="topbar-note"><span>Grades 8–12</span><Link className="topbar-institution-link" href="/institutions">For institutions</Link></div>}
    </header>}
    <main>{children}</main>

    {!staffSurface && menuOpen && <>
      <button className="app-menu-scrim" type="button" onClick={()=>setMenuOpen(false)} aria-label="Close Applied Commerce menu"/>
      <section className="app-menu-sheet" role="dialog" aria-modal="true" aria-label="Applied Commerce menu">
       <header>
        <div><span className="brand-mark">AC</span><div><strong>Applied Commerce</strong><small>Learner menu</small></div></div>
        <button ref={closeRef} type="button" onClick={()=>setMenuOpen(false)} aria-label="Close menu"><X/></button>
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

    {!staffSurface && <button ref={triggerRef} className="app-menu-trigger" type="button" onClick={()=>setMenuOpen(true)} aria-label="Open Applied Commerce menu" aria-haspopup="dialog" aria-expanded={menuOpen}>
      <Menu/><span>Menu</span>
    </button>}
  </div>;
}
