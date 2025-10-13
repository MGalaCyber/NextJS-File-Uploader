import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'File Uploader',
  description: 'A simple and fast file uploader for temporary sharing. Upload your files securely and get a direct link to share — all files are automatically deleted after 7 days.'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={"dark royutz idc0_350"} style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
