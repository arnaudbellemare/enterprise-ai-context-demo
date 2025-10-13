import type { Metadata } from 'next'
import { Inter, Quicksand } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const quicksand = Quicksand({ 
  subsets: ['latin'],
  variable: '--font-quicksand',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Enterprise AI Context Engineering',
  description: 'Advanced AI context engineering platform with GEPA-DSPy optimization',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.cdnfonts.com/css/armitage" rel="stylesheet" />
        <link href="https://fonts.cdnfonts.com/css/press-start-2p" rel="stylesheet" />
      </head>
      <body className={`${inter.className} ${quicksand.variable}`}>{children}</body>
    </html>
  )
}
