import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Cairo, Nunito } from "next/font/google";
import { ToastProvider } from "@/components/shared/toast-provider";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#6324C5",
};

export const metadata: Metadata = {
  title: "لوحة تحكم الإدارة | رقيم Raqeem Admin",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/admin-icon-192.png",
    apple: "/icons/admin-icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "رقيم إدارة",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${cairo.variable} ${nunito.variable}`}
    >
        <body
          suppressHydrationWarning
          className="min-h-dvh bg-background text-foreground antialiased"
        >
          <ToastProvider>{children}</ToastProvider>
        </body>
    </html>
  );
}
