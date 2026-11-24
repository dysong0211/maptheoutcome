import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import "./assurance.css";
import "./assurance-vivid.css";
import "./program-intelligence.css";
import "./overview-visuals.css";
import "./clarifications.css";
import "./assurance-simple.css";
import "./assurance-page.css";
import "./program-setup.css";
import "./insights-simplified.css";
import "./assurance-unified.css";
import "./ux-refresh.css";
import "./mobile-simple.css";

export const metadata: Metadata = {
  title: "MapToc — Program Intelligence and Assurance",
  description: "Connect program activity, decisions, spending, results, and original evidence in a living program record.",
  appleWebApp: { capable: true, title: "MapToc", statusBarStyle: "default" },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
