import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "ExTrack",
  description: "Production ready expense tracker",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0", // Mobile optimization
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-background pb-20">
        <ToastProvider>
          <main className="container mx-auto max-w-md px-3 sm:p-4 pb-6">
            {children}
          </main>
          <Suspense fallback={null}>
            <BottomNav />
          </Suspense>
        </ToastProvider>
      </body>
    </html>
  );
}
