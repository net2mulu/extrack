import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "ExTrack",
  description: "Production ready expense tracker",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0", // Mobile optimization
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "manifest", url: "/site.webmanifest" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
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
