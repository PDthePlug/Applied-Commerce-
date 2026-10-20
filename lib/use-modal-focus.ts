"use client";

import { useEffect, type RefObject } from "react";

// Keep modal interaction and the accessibility tree inside the active surface.
// Save inert flags so closing never enables a previously disabled background.
export function useModalFocus(open: boolean, surface: RefObject<HTMLElement | null>, trigger: RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const dialog = surface.current;
    if (!open || !dialog) return;
    const opener = trigger.current;
    const previousOverflow = document.body.style.overflow;
    const background = new Map<HTMLElement, { inert: boolean; ariaHidden: string | null }>();
    // Move focus before hiding its opener from assistive technology.
    dialog.querySelector<HTMLElement>('button:not([disabled]),a[href]')?.focus({preventScroll:true});
    let branch: HTMLElement = dialog;
    while (branch.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (!(sibling instanceof HTMLElement) || sibling === branch || sibling.hasAttribute("data-modal-backdrop")) continue;
        background.set(sibling, { inert: sibling.inert, ariaHidden: sibling.getAttribute("aria-hidden") });
        sibling.setAttribute("inert", "");
        sibling.setAttribute("aria-hidden", "true");
      }
      if (branch.parentElement === document.body) break;
      branch = branch.parentElement;
    }
    document.body.style.overflow = "hidden";
    const controls = () => [...dialog.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]')]
      .filter(element => element.tabIndex >= 0 && !element.closest('[inert]') && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden");
    const frame = requestAnimationFrame(() => (controls()[0] ?? dialog).focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab") return;
      const items = controls();
      const first = items[0] ?? dialog;
      const last = items[items.length - 1] ?? dialog;
      if (!dialog.contains(document.activeElement) || (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      for (const [element, {inert, ariaHidden}] of background) {
        if (inert) element.setAttribute("inert", "");
        else element.removeAttribute("inert");
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      }
      requestAnimationFrame(() => { if (opener?.isConnected && !opener.closest('[inert]')) opener.focus({preventScroll:true}); });
    };
  }, [open, surface, trigger, onClose]);
}
