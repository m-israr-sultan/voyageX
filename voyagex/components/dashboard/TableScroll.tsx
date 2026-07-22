import { DASHBOARD_TABLE_SCROLL } from "@/lib/dashboard-ui";

interface TableScrollProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Horizontal scroll container for wide dashboard tables.
 * Prevents page-level horizontal overflow on narrow phones.
 */
export default function TableScroll({ children, className = "" }: TableScrollProps) {
  return (
    <div className={`${DASHBOARD_TABLE_SCROLL} ${className}`.trim()}>
      {children}
    </div>
  );
}
