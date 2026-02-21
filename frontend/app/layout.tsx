import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Space_Grotesk, Mochiy_Pop_One } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import InstallPrompt from "@/components/InstallPrompt";
import ConnectivityStatus from "@/components/ConnectivityStatus";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
});

const mochiy = Mochiy_Pop_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-mochiy",
});

const helvetica = localFont({
  src: [
    {
      path: "../public/font/helvetica-neue-5/HelveticaNeueRoman.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/font/helvetica-neue-5/HelveticaNeueMedium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/font/helvetica-neue-5/HelveticaNeueBold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-helvetica",
});

export const metadata: Metadata = {
  title: "DabDub",
  description: "Offline-first PWA for DabDub.",
  manifest: "/manifest.json",
  // themeColor: "#0f172a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DabDub",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.className} ${helvetica.variable} ${mochiy.variable}`}>
      <body>
        {/* <ConnectivityStatus />
        <InstallPrompt /> */}
        {children}
      </body>
    </html>
  );
}
