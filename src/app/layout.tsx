import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Elroy - Personal AI Assistant",
  description: "Upload documents, analyze content, and get intelligent assistance with your assignments. Created by mtk, alias Elroy.",
  keywords: ["AI assistant", "document analysis", "chat", "PDF", "OCR", "table extraction"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}