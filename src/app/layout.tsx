import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hệ Thống Điểm Danh - Học Lái Xe AZ",
  description: "Hệ thống điểm danh trực tuyến cho học viên Học Lái Xe AZ",
  keywords: ["điểm danh", "attendance", "học lái xe", "AZ", "hệ thống"],
  authors: [{ name: "Học Lái Xe AZ" }],
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Điểm Danh AZ",
  },
  openGraph: {
    title: "Hệ Thống Điểm Danh - Học Lái Xe AZ",
    description: "Hệ thống điểm danh trực tuyến cho học viên Học Lái Xe AZ",
    url: "https://chat.z.ai",
    siteName: "Học Lái Xe AZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hệ Thống Điểm Danh - Học Lái Xe AZ",
    description: "Hệ thống điểm danh trực tuyến cho học viên Học Lái Xe AZ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  );
}
