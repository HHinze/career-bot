import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Harald Hinze – KI-Assistent',
  description: 'Persönlicher KI-Karriere-Assistent von Harald Hinze',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
