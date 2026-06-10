import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LearnLess",
  description: "\u8f7b\u91cf\u5b66\u4e60\u8d44\u6e90\u51b3\u7b56\u5de5\u5177"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
