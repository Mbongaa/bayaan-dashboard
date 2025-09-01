import type { Metadata } from "next";
import "./globals.css";
import "./lib/envSetup";

export const metadata: Metadata = {
  title: "Realtime API Agents",
  description: "A demo app from OpenAI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var d = document.documentElement;
                  var e = localStorage.getItem('theme');
                  if (e === 'dark' || (!e && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    d.classList.add('dark');
                    d.style.colorScheme = 'dark';
                  } else {
                    d.classList.add('light');  
                    d.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-gray-100 text-gray-800 dark:bg-black dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}
