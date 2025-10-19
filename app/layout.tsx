import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import React from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "@/components/theme-provider";
import { RootLayoutWrapper } from "@/components/layout/root-layout-wrapper";
import { SidebarProvider } from "@/providers/Sidebar";
import { StudioProvider } from "@/providers/studio-provider";

const inter = Inter({
  subsets: ["latin"],
  preload: true,
  display: "swap",
});

export const metadata: Metadata = {
  title: "Reoutfit",
  description: "Buy and Style with AI",
  icons: {
    icon: "/logo.png",
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
      suppressHydrationWarning
    >
      <body className={inter.className}>
        <ThemeProvider>
          <NuqsAdapter>
            <SidebarProvider>
              <StudioProvider>
                <RootLayoutWrapper>{children}</RootLayoutWrapper>
              </StudioProvider>
            </SidebarProvider>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
