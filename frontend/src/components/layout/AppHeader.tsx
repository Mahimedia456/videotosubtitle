import {
  Menu,
  Sparkles,
  UploadCloud,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  Link,
  NavLink,
} from "react-router-dom";

import { cn } from "../../lib/cn";
import { BrandLogo } from "../branding/BrandLogo";
import { Button } from "../ui/Button";
import { MobileMenu } from "./MobileMenu";


const navigation = [
  {
    label: "Home",
    path: "/",
  },
 
  {
    label: "Projects",
    path: "/projects",
  },
];


export function AppHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-cream-300/80 bg-cream-50/90 backdrop-blur-xl">
        <div className="page-container flex min-h-[82px] items-center justify-between gap-6">
          <BrandLogo />

          <nav className="hidden items-center gap-1 lg:flex">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  cn(
                    "rounded-xl px-4 py-3 text-sm font-extrabold transition",
                    isActive
                      ? "bg-ink-950 text-white"
                      : "text-ink-600 hover:bg-brand-50 hover:text-brand-700",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}

            <a
              href="/#how-it-works"
              className="rounded-xl px-4 py-3 text-sm font-extrabold text-ink-600 transition hover:bg-brand-50 hover:text-brand-700"
            >
              How It Works
            </a>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <div className="hidden items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-2 xl:flex">
              <Sparkles
                size={15}
                className="text-brand-600"
              />

            
            </div>

            <Link to="/upload">
              <Button>
                <UploadCloud size={18} />
                Upload Video
              </Button>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(true);
            }}
            className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-xl border border-cream-300 bg-white text-ink-700 lg:hidden"
            aria-label="Open mobile navigation"
          >
            <Menu size={21} />
          </button>
        </div>
      </header>

      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => {
          setMobileMenuOpen(false);
        }}
      />
    </>
  );
}