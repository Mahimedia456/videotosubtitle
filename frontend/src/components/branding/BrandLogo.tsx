import { Link } from "react-router-dom";

import { cn } from "../../lib/cn";


interface BrandLogoProps {
  compact?: boolean;
  light?: boolean;
  className?: string;
}


export function BrandLogo({
  compact = false,
  light = false,
  className,
}: BrandLogoProps) {
  return (
    <Link
      to="/"
      className={cn(
        "inline-flex min-w-0 items-center gap-3",
        className,
      )}
      aria-label="Liquidity by Murshid home"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-ink-950 shadow-lg ring-1 ring-brand-400/20">
        <img
          src="/branding/liquidity-by-murshid-logo.webp"
          alt="Liquidity by Murshid"
          className="h-full w-full object-contain p-1"
        />
      </div>

      {!compact && (
        <div className="min-w-0">
          <p
            className={cn(
              "truncate font-display text-[15px] font-black uppercase tracking-[-0.025em]",
              light
                ? "text-white"
                : "text-ink-950",
            )}
          >
            Liquidity
            <span className="text-brand-500">
              {" "}by Murshid
            </span>
          </p>

          <p
            className={cn(
              "truncate text-[9px] font-extrabold uppercase tracking-[0.2em]",
              light
                ? "text-white/40"
                : "text-ink-400",
            )}
          >
            AI Roman Urdu Studio
          </p>
        </div>
      )}
    </Link>
  );
}