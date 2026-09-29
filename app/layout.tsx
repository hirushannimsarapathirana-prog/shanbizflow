import type { Metadata } from "next";
import "./globals.css";
import SessionGuard from "@/components/SessionGuard";
import Navbar from "@/components/Navbar";

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
        <Navbar />
        {children}
      </body>
    </html>
  );
}