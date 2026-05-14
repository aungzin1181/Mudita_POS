import type { Metadata } from "next";
import "./globals.css";
import SidebarWrapper from "@/components/SidebarWrapper";
import { IdleProvider } from "./IdleProvider";

export const metadata: Metadata = {
  title: "Medical Clinic POS",
  description: "Advanced Medical Clinic Point of Sale System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏥</text></svg>"
        />
      </head>
      <body>
        <div className="app-layout">
          <SidebarWrapper />
          <IdleProvider />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
