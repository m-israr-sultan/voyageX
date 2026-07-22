"use client";

import { useEffect } from "react";
import { DASHBOARD_MODAL_BACKDROP, DASHBOARD_MODAL_PANEL } from "@/lib/dashboard-ui";

interface DashboardModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Tailwind max-width class, e.g. max-w-md / max-w-lg / max-w-2xl */
  maxWidthClass?: string;
  /** Extra classes on the white panel */
  panelClassName?: string;
  /** Close when backdrop is clicked (default true) */
  closeOnBackdrop?: boolean;
}

/**
 * Shared mobile-safe modal chrome for all dashboards.
 * Scrollable panel, viewport-capped height, padded backdrop.
 */
export default function DashboardModal({
  open,
  onClose,
  children,
  maxWidthClass = "max-w-md",
  panelClassName = "",
  closeOnBackdrop = true,
}: DashboardModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={DASHBOARD_MODAL_BACKDROP}
      onClick={closeOnBackdrop ? onClose : undefined}
      role="presentation"
    >
      <div
        className={`${DASHBOARD_MODAL_PANEL} ${maxWidthClass} ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}
