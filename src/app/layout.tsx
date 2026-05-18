import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tracking Order",
  description: "Tracking Order Service By DPSA",
};

import { Toaster } from "@/components/ui/sonner";
import ReactQueryProvider from "@/components/providers/query-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <ReactQueryProvider>
          {children}
        </ReactQueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
