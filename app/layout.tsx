import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { RotatePrompt } from "@/components/rotate-prompt";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mileage Tracker",
  description: "Running mileage dashboard",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${outfit.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <body className="min-h-[100dvh] bg-zinc-950 text-zinc-100">
        <RotatePrompt />
        {children}
      </body>
    </html>
  );
}
