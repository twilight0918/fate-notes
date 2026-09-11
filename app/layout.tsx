import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "命運手記 Fate Notes",
  description: "紫微斗數 × 八字 × 人類圖 × 星座 — AI 多系統交叉命理分析",
  openGraph: {
    title: "命運手記 Fate Notes",
    description: "輸入生日，AI 同時解讀紫微斗數、八字、人類圖、星座，交叉比對產出你的人生使用說明書",
    type: "website",
    locale: "zh_TW",
  },
  twitter: {
    card: "summary",
    title: "命運手記 Fate Notes",
    description: "輸入生日，AI 同時解讀紫微斗數、八字、人類圖、星座，交叉比對產出你的人生使用說明書",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <head>
        {/* 標題用明體；載不到時退回系統明體（globals.css／tailwind.config.ts 的 font-serif） */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@600;700&display=swap" />
      </head>
      <body className="min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
