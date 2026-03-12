/**
 * SettingsCard — reusable section wrapper for settings groups.
 *
 * Provides a consistent group header (title + description) above a
 * vertically-stacked list of the section's form cards. Intentionally a
 * Server Component with no interactivity — interactivity lives in the
 * individual form children.
 */

interface SettingsCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function SettingsCard({
  title,
  description,
  icon,
  children,
}: SettingsCardProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
      {/* ── Section label (left column on md+) ──────────────────────── */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-hover text-foreground-muted">
            {icon}
          </div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        </div>
        <p className="text-sm text-foreground-muted leading-relaxed">
          {description}
        </p>
      </div>

      {/* ── Forms (right column on md+) ──────────────────────────────── */}
      <div className="space-y-4">{children}</div>
    </div>
  );
}
