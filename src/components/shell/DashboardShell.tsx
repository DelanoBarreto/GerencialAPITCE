import type { ReactNode } from "react";

export type ShellNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
};

type DashboardShellProps = {
  brand: string;
  brandMark: string;
  nav: ShellNavItem[];
  title: string;
  subtitle?: string;
  periodLabel?: string;
  periodCaption?: string;
  scope?: { label: string; value: string; detail?: string };
  aside?: ReactNode;
  isAdmin?: boolean;
  children: ReactNode;
};

export function DashboardShell({
  brand,
  brandMark,
  nav,
  title,
  subtitle,
  periodLabel,
  periodCaption,
  scope,
  aside,
  isAdmin = false,
  children
}: DashboardShellProps) {
  return (
    <div className={isAdmin ? "ap-shell is-admin" : "ap-shell"}>
      <aside className="ap-sidebar">
        <div className="ap-sidebar-brand">
          <span>{brandMark}</span>
          {brand}
        </div>

        {scope ? (
          <div className="ap-sidebar-scope">
            <small>{scope.label}</small>
            <strong>{scope.value}</strong>
            {scope.detail ? <p>{scope.detail}</p> : null}
          </div>
        ) : null}

        <nav className="ap-sidebar-nav">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={item.active ? "ap-sidebar-item is-active" : "ap-sidebar-item"}
              aria-current={item.active ? "page" : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        {aside ? <div className="ap-sidebar-foot">{aside}</div> : null}
      </aside>

      <div className="ap-main">
        <header className="ap-header">
          <div>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {periodLabel ? (
            <div className="ap-header-period">
              <small>{periodCaption ?? "Período de referência"}</small>
              <strong>{periodLabel}</strong>
            </div>
          ) : null}
        </header>
        {children}
      </div>
    </div>
  );
}
