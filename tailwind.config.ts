import type { Config } from "tailwindcss";

// 紙本手帳配色：顏色全走 app/globals.css 的 CSS 變數（RGB 三元組），
// 淺色／深色由 prefers-color-scheme 切換，元件只寫 bg-paper、text-ink 這類語意名。
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: token("paper"),         // 頁面底色
        card: token("card"),           // 卡片、輸入框
        ink: token("ink"),             // 主要文字
        muted: token("muted"),         // 次要文字、說明
        line: token("line"),           // 框線、分隔線
        accent: token("accent"),       // 朱砂：標題、選中、重點
        "accent-soft": token("accent-soft"),
        gold: token("gold"),
        wood: token("wood"),
        fire: token("fire"),
        earth: token("earth"),
        metal: token("metal"),
        water: token("water"),
      },
      fontFamily: {
        serif: ['"Noto Serif TC"', '"Songti TC"', '"PMingLiU"', "serif"],
        sans: ["-apple-system", "BlinkMacSystemFont", '"PingFang TC"', '"Noto Sans TC"', '"Microsoft JhengHei"', "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
