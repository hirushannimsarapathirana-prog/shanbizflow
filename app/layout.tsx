import type { Metadata } from "next";
import "./globals.css";
import SessionGuard from "@/components/SessionGuard";

export const metadata: Metadata = {
  title: "ShanBizFlow",
  description: "Business Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionGuard />
        {children}
      </body>
    </html>
  );
}