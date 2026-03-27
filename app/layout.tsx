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
      <body className="bg-slate-950 text-slate-100 min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
