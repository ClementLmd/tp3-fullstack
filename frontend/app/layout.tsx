import type { Metadata } from 'next'
import './globals.css'
import ReactQueryProvider from '../lib/providers/ReactQueryProvider'
import AppHeader from '../components/layout/AppHeader'

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
        <ReactQueryProvider>
          <AppHeader />
          {children}
        </ReactQueryProvider>
      </body>
    </html>
  );
}
