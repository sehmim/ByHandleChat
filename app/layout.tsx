import type { Metadata } from 'next'
import { Lato } from 'next/font/google'
import '../src/index.css'

const lato = Lato({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lato',
})

export const metadata: Metadata = {
  title: 'Handle Revenue OS',
  description: 'Chat and booking widget for Handle',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={lato.variable}>
      <body>{children}</body>
    </html>
  )
}
