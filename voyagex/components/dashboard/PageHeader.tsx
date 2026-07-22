import { DASHBOARD_PAGE_HEADER } from "@/lib/dashboard-ui";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Consistent responsive page header across dashboards.
 * Title stacks above actions on mobile; side-by-side from sm+.
 */
export default function PageHeader({
  title,
  description,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`${DASHBOARD_PAGE_HEADER} ${className}`.trim()}>
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
