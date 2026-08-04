import {
  ArrowLeft,
  Home,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import { Button } from "../components/ui/Button";


export default function NotFoundPage() {
  return (
    <section className="page-container flex min-h-[650px] items-center justify-center py-16">
      <div className="max-w-xl text-center">
        <p className="font-display text-8xl font-black text-brand-500">
          404
        </p>

        <h1 className="brand-heading mt-4 text-3xl sm:text-4xl">
          Page not found
        </h1>

        <p className="mt-4 text-sm leading-7 text-ink-500">
          Requested page available nahi hai ya route change ho chuka hai.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/">
            <Button>
              <Home size={18} />
              Go to home
            </Button>
          </Link>

          <Link to="/projects">
            <Button variant="secondary">
              <ArrowLeft size={18} />
              View projects
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}