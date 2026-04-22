import { MantineProvider } from "@mantine/core";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://d-agung.com"),
  title: "D.Agung Sungkono",
  description: "Software Engineer building systems that scale.",
  openGraph: {
    title: "D.Agung Sungkono",
    description: "Software Engineer building systems that scale.",
    url: "/",
    siteName: "D.Agung Sungkono",
    type: "website",
    images: [
      {
        url: "/agung-portrait.jpg",
        width: 1200,
        height: 630,
        alt: "D.Agung Sungkono",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "D.Agung Sungkono",
    description: "Software Engineer building systems that scale.",
    images: ["/agung-portrait.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <MantineProvider>
          {children}
          <Analytics />
        </MantineProvider>
      </body>
    </html>
  );
}
