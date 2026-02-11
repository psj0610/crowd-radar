import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Information Architecture App",
  description: "High-end minimalist information architecture workspace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}

