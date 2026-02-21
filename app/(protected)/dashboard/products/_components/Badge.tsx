/**
 * Badge — inline status pill.
 *
 * Variants:
 *   active   — soft green: communicates "live / visible to customers"
 *   inactive — muted gray: communicates "hidden / draft"
 *
 * Intentionally small and unobtrusive — designed to sit inside a card
 * without competing for attention with the product name or price.
 */

type BadgeVariant = "active" | "inactive";

interface BadgeProps {
  variant: BadgeVariant;
  /** Override the default label derived from variant */
  label?: string;
}

const LABELS: Record<BadgeVariant, string> = {
  active: "Ativo",
  inactive: "Inativo",
};

// All colours use rgb(var(--color-X)) arbitrary values per the design system.
// active   → emerald-50 bg / emerald-700 text (soft, readable)
// inactive → bg-muted / text-muted from @theme tokens
const STYLES: Record<BadgeVariant, string> = {
  active: [
    "bg-[rgb(240_253_244)]", // emerald-50
    "text-[rgb(21_128_61)]", // emerald-700
    "border border-[rgb(187_247_208)]", // emerald-200
  ].join(" "),
  inactive: [
    "bg-[rgb(var(--color-bg-muted))]",
    "text-[rgb(var(--color-text-muted))]",
    "border border-[rgb(var(--color-border))]",
  ].join(" "),
};

export function Badge({ variant, label }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2 py-0.5",
        "text-xs font-medium",
        STYLES[variant],
      ].join(" ")}
    >
      {label ?? LABELS[variant]}
    </span>
  );
}
