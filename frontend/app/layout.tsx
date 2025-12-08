import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { ToastProvider } from "@/lib/providers/ToastProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Quiz Platform - Real-time Interactive Quiz",
  description: "Real-time interactive quiz platform for teachers and students",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <QueryProvider>
          <ToastProvider>
            <Navbar />
            <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
              {children}
            </main>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
