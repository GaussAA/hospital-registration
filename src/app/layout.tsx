import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { UserProvider } from "@/components/auth/UserProvider";

export const metadata: Metadata = {
  title: "健康挂号 - 在线预约挂号平台",
  description: "在线预约挂号平台，便捷就医第一步",
};

/**
 * Inline script to prevent flash of wrong theme.
 * Runs before React hydration — reads localStorage and applies .dark class.
 */
const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('hospital-theme');
      if (!theme) {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    } catch(e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans transition-colors duration-200">
        <ThemeProvider>
          <UserProvider>{children}</UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
