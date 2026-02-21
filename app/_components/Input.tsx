/**
 * Input — labelled text field with built-in error state.
 *
 * Always renders a <label> paired with the <input> via htmlFor/id.
 * Error string triggers red border + small message below the field.
 *
 * Uses forwardRef so parent components (e.g. focus management) can hold a ref.
 *
 * Accessibility:
 *   - aria-describedby links the input to its error message.
 *   - aria-invalid signals invalid state to screen readers.
 *   - role="alert" on error paragraph triggers live announcement.
 */

import { forwardRef, type InputHTMLAttributes } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Visible label rendered above the field */
  label: string;
  /** Error string. When defined: red border + error message appear */
  error?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    // Derive a stable id from the label when not supplied
    const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
    const errorId = `${inputId}-error`;

    return (
      <div className="flex flex-col gap-1.5">
        {/* Label */}
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-foreground"
        >
          {label}
        </label>

        {/* Field */}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={[
            // Layout / sizing
            "h-10 w-full rounded-md px-3 text-sm",
            // Background / border
            "bg-surface",
            "border",
            // Border color: red when error, otherwise normal
            error ? "border-danger" : "border-line-strong",
            // Subtle shadow for depth
            "shadow-xs",
            // Placeholder color
            "placeholder:text-foreground-muted/60",
            // Transitions
            "transition-colors duration-150",
            // Focus ring — same token as Button
            "ring-focus",
            // Disabled
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          ].join(" ")}
          {...props}
        />

        {/* Error message */}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="flex items-center gap-1.5 text-xs text-danger"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
