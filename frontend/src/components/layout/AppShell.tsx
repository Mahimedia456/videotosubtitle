import {
  Outlet,
} from "react-router-dom";

import { AppFooter } from "./AppFooter";
import { AppHeader } from "./AppHeader";


export function AppShell() {
  return (
    <div className="min-h-screen bg-cream-100">
      <AppHeader />

      <main className="min-h-[calc(100vh-82px)]">
        <Outlet />
      </main>

      <AppFooter />
    </div>
  );
}