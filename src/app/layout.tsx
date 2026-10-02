import type { Metadata, Viewport } from "next";
import { Cinzel, IM_Fell_English } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700", "900"],
});

const imFell = IM_Fell_English({
  variable: "--font-im-fell",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "The Realm of Tasks",
  description: "A household quest board: daily deeds, weekly quests and lifelong dreams. Works in your browser, no account needed.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Realm of Tasks",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d0b08",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${cinzel.variable} ${imFell.variable} antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded focus:font-semibold"
          style={{ background: "var(--gold)", color: "var(--color-bg)" }}
        >
          Skip to main content
        </a>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
