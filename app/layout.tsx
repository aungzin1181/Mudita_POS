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
