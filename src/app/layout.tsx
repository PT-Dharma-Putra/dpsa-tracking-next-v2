import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tracking Order DPSA",
  description: "Tracking Order Service By DPSA",
  icons: {
    icon: "/Logo.png", // nama file yang ada di folder public/
  },
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
