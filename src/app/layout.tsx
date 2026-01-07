import type { Metadata } from "next";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "FitGo - Your Ultimate Fitness Destination",
  description: "Transform your body, transform your life. Join FitGo for premium gym facilities, expert trainers, and top-quality fitness equipment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
