import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

import { cn } from "../../lib/cn";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "dark"
  | "ghost";

type ButtonSize =
  | "sm"
  | "md"
  | "lg";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-gradient text-ink-950 shadow-gold hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(233,154,8,0.3)]",

  secondary:
    "border border-cream-300 bg-white text-ink-900 shadow-sm hover:border-brand-300 hover:bg-brand-50",

  dark:
    "bg-ink-950 text-white shadow-dark hover:-translate-y-0.5 hover:bg-black",

  ghost:
    "bg-transparent text-ink-700 hover:bg-cream-200 hover:text-ink-950",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-10 px-4 text-sm",
  md: "min-h-12 px-5 text-sm",
  lg: "min-h-14 px-7 text-base",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-2xl font-extrabold transition-all duration-200 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}