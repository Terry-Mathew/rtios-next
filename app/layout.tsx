import type { Metadata } from "next";
import { Inter, Crimson_Text } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/src/components/layout/AppShell";
import { CareerContextProvider } from "@/src/domains/career/CareerContextProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const crimsonText = Crimson_Text({
  variable: "--font-crimson",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rtios - Career Intelligence",
  description: "AI-powered career acceleration platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${crimsonText.variable} antialiased`}
      >
        <CareerContextProvider>
          <AppShell>
            {children}
          </AppShell>
        </CareerContextProvider>
      </body>
    </html>
  );
}
