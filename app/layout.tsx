import type React from "react";
import type { Metadata } from "next";
import { Poppins, Nunito } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

/* ================= FONT ================= */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-nunito",
});

/* ================= METADATA ================= */
export const metadata: Metadata = {
  title: "FinProjek - Platform Monitoring Progres Pembangunan",
  description:
    "Platform transparansi pembangunan yang menghubungkan kontraktor dan pemilik bangunan. Monitor progres real-time dengan dokumentasi terstruktur.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

/* ================= ROOT LAYOUT ================= */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${nunito.variable} antialiased`}
      >
        {/* ================= MIDTRANS SNAP ================= */}
        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="afterInteractive"
        />

        {children}

        <Analytics />
      </body>
    </html>
  );
}
