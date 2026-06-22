import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinSight AI – Unified Financial Intelligence Platform",
  description: "AI-powered unified financial dashboard with cashback intelligence, offer simplifiers, and recommendation systems.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased min-h-screen bg-[#F1F3F6] text-slate-800 selection:bg-primary/10 selection:text-primary">
        {children}
      </body>
    </html>
  );
}
