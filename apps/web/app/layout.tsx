import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/lib/providers";

export const metadata: Metadata = {
  title: "Vouch",
  description: "Vouch dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
