import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Serif_4 } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/site-chrome.tsx";
import { siteUrl } from "@/lib/env.ts";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Write a letter today. We seal it, keep it encrypted, and post it on paper on the date you choose, up to five years from now.";

export const metadata: Metadata = {
  // Without this, Next resolves Open Graph URLs against localhost in
  // production and warns at build time.
  metadataBase: new URL(siteUrl()),
  title: {
    default: "The Envelope | A letter to your first anniversary",
    template: "%s | The Envelope",
  },
  description: DESCRIPTION,
  applicationName: "The Envelope",
  openGraph: {
    title: "The Envelope",
    description: DESCRIPTION,
    type: "website",
    siteName: "The Envelope",
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf7f0" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1815" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg text-ink">
        <a
          href="#content"
          className="sr-only z-50 rounded-sm bg-seal px-4 py-2 text-seal-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <SiteHeader />
        <div id="content" className="flex flex-1 flex-col">
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
