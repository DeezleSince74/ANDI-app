import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { BodyWithExtensionSupport } from "@/components/BodyWithExtensionSupport";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "ANDI",
  description: "Empowering educators with AI-driven instructional coaching and data analytics for enhanced teaching effectiveness",
  keywords: [
    "AI coaching",
    "education technology", 
    "teacher professional development",
    "instructional design",
    "educational analytics",
    "ANDI Labs"
  ],
  authors: [{ name: "ANDI Labs" }],
  creator: "ANDI Labs",
  publisher: "ANDI Labs",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "ANDI",
    description: "Empowering educators with AI-driven instructional coaching and data analytics",
    url: "/",
    siteName: "ANDI Labs",
    images: [
      {
        url: "/andi-logo-192.png",
        width: 192,
        height: 192,
        alt: "ANDI Labs Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ANDI", 
    description: "Empowering educators with AI-driven instructional coaching",
    images: ["/andi-logo-192.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <BodyWithExtensionSupport className="font-sans antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
      </BodyWithExtensionSupport>
    </html>
  );
}
