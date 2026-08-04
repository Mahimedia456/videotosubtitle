import {
  Captions,
  Globe2,
  Mail,
  MessageCircle,
  PlayCircle,
} from "lucide-react";

import { Link } from "react-router-dom";

import { BrandLogo } from "../branding/BrandLogo";


const studioLinks = [
  {
    label: "Home",
    path: "/",
  },
  {
    label: "Create Subtitles",
    path: "/upload",
  },
  {
    label: "My Projects",
    path: "/projects",
  },
];

const resourceLinks = [
  {
    label: "How It Works",
    path: "/#how-it-works",
  },
  {
    label: "Upload Video",
    path: "/upload",
  },
  {
    label: "Roman Urdu SRT",
    path: "/projects",
  },
];

const socialLinks = [
  {
    label: "Website",
    href: "#",
    icon: Globe2,
  },
  {
    label: "Community",
    href: "#",
    icon: MessageCircle,
  },
  {
    label: "Video Channel",
    href: "#",
    icon: PlayCircle,
  },
];


export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 overflow-hidden bg-[#111014] text-white">
      <div className="border-b border-white/10">
        <div className="page-container py-12 lg:py-16">
          <div className="grid gap-12 lg:grid-cols-[1.25fr_0.65fr_0.65fr_1fr]">
            <div>
              <BrandLogo light />

              <p className="mt-6 max-w-md text-sm leading-7 text-white/45">
                Liquidity by Murshid AI Roman Urdu Studio
                Urdu aur mixed-English videos ko accurate,
                readable aur timestamped Roman Urdu subtitles
                mein convert karta hai.
              </p>

              <div className="mt-6 flex items-center gap-2">
                {socialLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      aria-label={item.label}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/55 transition hover:border-brand-400/40 hover:bg-brand-400/10 hover:text-brand-300"
                    >
                      <Icon size={18} />
                    </a>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-display text-sm font-black uppercase tracking-[0.14em] text-white">
                Studio
              </h3>

              <nav className="mt-6 space-y-3">
                {studioLinks.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="block text-sm font-semibold text-white/45 transition hover:text-brand-300"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div>
              <h3 className="font-display text-sm font-black uppercase tracking-[0.14em] text-white">
                Resources
              </h3>

              <nav className="mt-6 space-y-3">
                {resourceLinks.map((item) => (
                  <Link
                    key={`${item.label}-${item.path}`}
                    to={item.path}
                    className="block text-sm font-semibold text-white/45 transition hover:text-brand-300"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div>
              <h3 className="font-display text-sm font-black uppercase tracking-[0.14em] text-white">
                Subtitle Output
              </h3>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-300/10 text-brand-300">
                    <Captions size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-extrabold text-white/85">
                      Roman Urdu SRT
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/40">
                      Timestamped subtitle output, jaise
                      “Assalam o Alaikum, and good morning.”
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-300/10 text-brand-300">
                    <Mail size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-extrabold text-white/85">
                      Liquidity Workflow
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/40">
                      Trading terminology aur mixed Urdu-English
                      speech ke liye optimized.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container flex flex-col justify-between gap-3 py-6 text-xs font-semibold text-white/30 sm:flex-row sm:items-center">
        <p>
          © {currentYear} Liquidity by Murshid.
          All rights reserved.
        </p>

        <p>
          AI Roman Urdu Subtitle Studio
        </p>
      </div>
    </footer>
  );
}