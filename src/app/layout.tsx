import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'نظام المجمع الطبي',
  description: 'نظام إدارة حالات المجمع الطبي',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
