import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { HeartbeatProvider } from "@/components/layout/HeartbeatProvider";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const interEmail = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Tsunagu | Premium AI-Powered Email And Calendar Workspace",
  description:
    "Seamlessly manage your Gmail messages, generate AI drafts, and organize calendar schedules in a high-end minimalist productivity workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${outfit.variable} ${interEmail.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200 font-sans">
        <ThemeProvider defaultTheme="dark" storageKey="tsunagu-theme">
          <HeartbeatProvider>
            {children}
          </HeartbeatProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
