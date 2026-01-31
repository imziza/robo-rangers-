import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Atmosphere } from "@/components/ui/Atmosphere";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aletheon | AI-Powered Archaeological Analysis",
  description: "High-fidelity platform for artifact digitization, AI-driven spectrographic analysis, and global GIS mapping.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F0E6' },
    { media: '(prefers-color-scheme: dark)', color: '#0D0D0D' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <ThemeProvider>
          <Atmosphere />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
