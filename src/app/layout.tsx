import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "DevFlow — AI Advertising Studio",
  description: "Choose your presenter. Upload your brand. Let AI create the advertisement.",
  applicationName: "DevFlow Studio",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "DevFlow", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#07070b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} antialiased`}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
