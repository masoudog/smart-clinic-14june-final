import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "کلینیک آرامش — مدیریت مراجعین",
  description: "سیستم مدیریت مراجعین و رزرو جلسات کلینیک آرامش",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
