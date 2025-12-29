import type { Metadata } from "next";
import { Work_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/src/components/layout/AppShell";
import { CareerContextProvider } from "@/src/domains/career/CareerContextProvider";

// Neo-Brutalist Fonts - Bold, Geometric, High Impact
const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${workSans.variable} ${spaceGrotesk.variable} antialiased`}
        suppressHydrationWarning
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
