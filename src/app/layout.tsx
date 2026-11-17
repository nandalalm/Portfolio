import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import GLCanvas from "@/components/GLCanvas";
import Cursor from "@/components/Cursor";
import PageTransition from "@/components/PageTransition";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const code = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nandalal M · Full-stack developer",
  description:
    "Full-stack developer building web and mobile products, from the database to the Play Store.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${code.variable} antialiased`}>
      <body>
        <SmoothScroll />
        <GLCanvas />
        <div className="relative z-10">{children}</div>
        <div className="grain" aria-hidden="true" />
        <PageTransition />
        <Cursor />
      </body>
    </html>
  );
}
