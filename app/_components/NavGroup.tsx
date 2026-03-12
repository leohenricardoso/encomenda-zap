"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavGroupChild {
  label: string;
  href: string;
}

interface NavGroupProps {
  label: string;
  icon: React.ReactNode;
  children: NavGroupChild[];
  onClick?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NavGroup({ label, icon, children, onClick }: NavGroupProps) {
  const pathname = usePathname();

  // A child is active if the path matches exactly or starts with href + "/"
  function isChildActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const anyChildActive = children.some((c) => isChildActive(c.href));

  // Open if a child is active; allow manual toggle
  const [isOpen, setIsOpen] = useState(anyChildActive);

  // Keep open when navigating into the group
  useEffect(() => {
    if (anyChildActive) setIsOpen(true);
  }, [anyChildActive]);

  return (
    <li>
      {/* Group header button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={[
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          anyChildActive
            ? "text-accent"
            : "text-foreground-muted hover:bg-surface-subtle hover:text-foreground",
        ].join(" ")}
        aria-expanded={isOpen}
      >
        <span className="shrink-0">{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className={[
            "h-4 w-4 shrink-0 transition-transform duration-150",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Children */}
      {isOpen && (
        <ul className="mt-0.5 space-y-0.5 pl-9">
          {children.map((child) => {
            const active = isChildActive(child.href);
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  onClick={onClick}
                  className={[
                    "block rounded-lg px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-accent/10 font-semibold text-accent"
                      : "text-foreground-muted hover:bg-surface-subtle hover:text-foreground",
                  ].join(" ")}
                >
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
