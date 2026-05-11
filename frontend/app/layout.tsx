import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import { ThemeProvider } from '@/lib/theme'
import { AuthProvider } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'SomromScan v2 — MRV Platform',
  description: 'แพลตฟอร์ม MRV สำหรับโครงการ T-VER คาร์บอนเครดิตภาคป่าไม้ไทย',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body style={{ fontFamily: "'Sarabun','TH Sarabun New','Noto Sans Thai',-apple-system,sans-serif" }}>
        <ThemeProvider>
          <AuthProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
                {children}
              </main>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
