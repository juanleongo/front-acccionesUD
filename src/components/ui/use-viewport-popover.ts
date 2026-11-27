'use client';

import { useLayoutEffect, type RefObject } from 'react';

/** Anchor a fixed popover within the visual viewport, including the on-screen keyboard. */
export function useViewportPopover(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
) {
  useLayoutEffect(() => {
    if (!open) return;
    function positionCalendar() {
      const popup = panelRef.current;
      const anchor = anchorRef.current;
      if (!popup || !anchor) return;
      const viewport = window.visualViewport;
      const left = (viewport?.offsetLeft ?? 0) + 8;
      const top = (viewport?.offsetTop ?? 0) + 8;
      const width = viewport?.width ?? window.innerWidth;
      const height = viewport?.height ?? window.innerHeight;
      const right = left + width - 16;
      const bottom = top + height - 16;
      const rect = anchor.getBoundingClientRect();
      popup.style.width = `${Math.min(width - 16, 352)}px`;
      popup.style.left = `${Math.max(left, Math.min(rect.right - popup.offsetWidth, right - popup.offsetWidth))}px`;
      // Phones use a bottom sheet; wider screens keep the calendar by its field.
      const mobile = width <= 640;
      const below = Math.max(0, bottom - rect.bottom - 8);
      const above = Math.max(0, rect.top - top - 8);
      const flip = below < popup.scrollHeight && above > below;
      const space = mobile ? height - 16 : Math.max(64, flip ? above : below);
      popup.style.maxHeight = `${Math.min(height - 16, space)}px`;
      const popupHeight = popup.getBoundingClientRect().height;
      popup.style.top = `${mobile ? bottom - popupHeight : Math.max(top, Math.min(flip ? rect.top - popupHeight - 8 : rect.bottom + 8, bottom - popupHeight))}px`;
    }
    positionCalendar();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(positionCalendar);
    if (panelRef.current) observer?.observe(panelRef.current);
    window.addEventListener('resize', positionCalendar);
    window.addEventListener('scroll', positionCalendar, true);
    window.visualViewport?.addEventListener('resize', positionCalendar);
    window.visualViewport?.addEventListener('scroll', positionCalendar);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', positionCalendar);
      window.removeEventListener('scroll', positionCalendar, true);
      window.visualViewport?.removeEventListener('resize', positionCalendar);
      window.visualViewport?.removeEventListener('scroll', positionCalendar);
    };
  }, [open, anchorRef, panelRef]);
}
