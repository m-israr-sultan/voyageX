/**
 * Shared Tailwind class fragments for dashboard responsiveness.
 * Layout-only — no business logic.
 */

/** Full-screen modal backdrop */
export const DASHBOARD_MODAL_BACKDROP =
  "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 overflow-y-auto";

/** Scrollable modal panel — keeps content within the viewport on mobile */
export const DASHBOARD_MODAL_PANEL =
  "bg-white rounded-xl w-full max-h-[90vh] overflow-y-auto shadow-xl my-auto";

/** Page title row that stacks on small screens */
export const DASHBOARD_PAGE_HEADER =
  "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between";

/** Stat / metric card grid — 1 → 2 → 3/4 columns */
export const DASHBOARD_STAT_GRID =
  "grid grid-cols-1 min-[375px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4";

/** Horizontal scroll wrapper for tables */
export const DASHBOARD_TABLE_SCROLL =
  "w-full min-w-0 overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0";
