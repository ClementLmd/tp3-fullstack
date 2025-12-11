import type { Metadata } from 'next'
import './globals.css'
import ReactQueryProvider from '../lib/providers/ReactQueryProvider'

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
    <html lang="en">
      <body className="font-sans">
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
