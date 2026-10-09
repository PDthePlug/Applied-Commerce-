"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Building2, GraduationCap, Home, Menu, UsersRound, UserRound, X } from "lucide-react";

type Destination = { href: string; label: string; detail: string; icon: typeof Home };

export function InstitutionWorkspaceMenu({ isPlatformAdmin }: { isPlatformAdmin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const close = useRef<HTMLButtonElement | null>(null);

  const items: Destination[] = isPlatformAdmin
    ? [
        { href: "/institutions/manage", label: "Platform home", detail: "Manage the institution delivery layer", icon: Home },
        { href: "/institutions/manage/cohorts", label: "Institutions & cohorts", detail: "Set up programme delivery groups", icon: Building2 },
        { href: "/institutions/manage/learners", label: "Learner enrolment", detail: "Assign learners by email, before or after signup", icon: GraduationCap },
        { href: "/institutions/manage/facilitators", label: "Facilitator assignments", detail: "Assign educators to cohorts", icon: UsersRound },
        { href: "/institutions/manage/team", label: "Institution access", detail: "Manage school administrators and educators", icon: UserRound },
        { href: "/", label: "Learner experience", detail: "Open the learner workspace", icon: GraduationCap },
      ]
    : [
        { href: "/institutions/manage", label: "Institution home", detail: "Overview of this institution's delivery", icon: Home },
        { href: "/institutions/manage/cohorts", label: "Cohorts", detail: "Create and manage delivery groups", icon: Building2 },
        { href: "/institutions/manage/learners", label: "Learners", detail: "Enrol learners by email, before or after signup", icon: GraduationCap },
        { href: "/institutions/manage/facilitators", label: "Facilitators", detail: "Assign facilitators to cohorts", icon: UsersRound },
        { href: "/institutions/manage/team", label: "Institution team", detail: "Manage school-level access", icon: UserRound },
        { href: "/", label: "Learner platform", detail: "Open the learner workspace", icon: GraduationCap },
      ];

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const opener = trigger.current;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => close.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = document.querySelector<HTMLElement>(".app-menu-sheet");
      if (!dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusable[focusable.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) {
        event.preventDefault();
        focusable[0].focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      requestAnimationFrame(() => opener?.focus());
    };
  }, [open]);

  return (
    <>
      <button ref={trigger} className="app-menu-trigger" type="button" onClick={() => setOpen(true)} aria-label={isPlatformAdmin ? "Open platform administration menu" : "Open institution workspace menu"} aria-haspopup="dialog" aria-expanded={open}>
        <Menu /><span>Menu</span>
      </button>
      {open ? <>
        <button className="app-menu-scrim" type="button" aria-label="Close workspace menu" onClick={() => setOpen(false)} />
        <section className="app-menu-sheet" role="dialog" aria-modal="true" aria-label={isPlatformAdmin ? "Platform administration menu" : "Institution workspace menu"}>
          <header>
            <div><span className="brand-mark">AC</span><div><strong>Applied Commerce</strong><small>{isPlatformAdmin ? "Platform administration" : "Institution workspace"}</small></div></div>
            <button ref={close} type="button" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button>
          </header>
          <nav className="app-menu-items" aria-label={isPlatformAdmin ? "Platform administration navigation" : "Institution navigation"}>
            {items.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/institutions/manage" ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
              return <Link key={item.href} href={item.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}>
                <Icon /><span><strong>{item.label}</strong><small>{item.detail}</small></span>{active ? <em>Current</em> : null}
              </Link>;
            })}
          </nav>
        </section>
      </> : null}
    </>
  );
}
