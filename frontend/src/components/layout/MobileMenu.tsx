import {
  FileVideo2,
  FolderKanban,
  Home,
  Info,
  UploadCloud,
  X,
} from "lucide-react";

import {
  Link,
  NavLink,
} from "react-router-dom";

import { cn } from "../../lib/cn";
import { BrandLogo } from "../branding/BrandLogo";
import { Button } from "../ui/Button";


interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}


const navigation = [
  {
    label: "Home",
    path: "/",
    icon: Home,
  },
  {
    label: "Create Subtitles",
    path: "/upload",
    icon: UploadCloud,
  },
  {
    label: "Projects",
    path: "/projects",
    icon: FolderKanban,
  },
];


export function MobileMenu({
  open,
  onClose,
}: MobileMenuProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Close mobile menu overlay"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm transition lg:hidden",
          open
            ? "visible opacity-100"
            : "invisible opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-[80] flex w-[min(88vw,380px)] flex-col bg-cream-50 shadow-2xl transition-transform duration-300 lg:hidden",
          open
            ? "translate-x-0"
            : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-cream-300 px-5 py-5">
          <BrandLogo />

          <button
            type="button"
            onClick={onClose}
            className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-xl border border-cream-300 bg-white text-ink-700"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-ink-400">
            Navigation
          </p>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "flex min-h-14 items-center gap-3 rounded-2xl px-4 text-sm font-extrabold transition",
                      isActive
                        ? "bg-ink-950 text-white shadow-dark"
                        : "bg-white text-ink-700 hover:bg-brand-50 hover:text-brand-700",
                    )
                  }
                >
                  <Icon size={19} />

                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-8 rounded-[26px] bg-dark-gradient p-5 text-white">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient text-ink-950">
              <FileVideo2 size={21} />
            </div>

            <h3 className="mt-5 font-display text-lg font-black">
              Roman Urdu subtitles
            </h3>

            <p className="mt-2 text-sm leading-6 text-white/50">
              Urdu aur English mixed videos ko natural Roman Urdu subtitles mein convert karein.
            </p>

            <Link
              to="/upload"
              onClick={onClose}
              className="mt-5 block"
            >
              <Button fullWidth>
                <UploadCloud size={18} />
                Upload video
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-cream-300 bg-white p-4">
            <Info
              size={19}
              className="mt-0.5 shrink-0 text-brand-600"
            />

            <p className="text-xs leading-5 text-ink-500">
              Generated SRT file Roman Urdu mein hogi, jaise:
              <strong className="ml-1 text-ink-800">
                Assalam o Alaikum, and good morning.
              </strong>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}