import type { Metadata } from "next";
import "./globals.css";
import "./lib/envSetup";
import { Toaster } from "sonner";

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1d4ed8" },
  ],
};

export const metadata: Metadata = {
  title: "Bayaan AI - Realtime Translation Agent",
  description: "A sophisticated realtime translation agent powered by OpenAI's Realtime API with voice interaction capabilities.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bayaan AI",
    startupImage: [
      "/icon-192x192.png",
    ],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Bayaan AI",
    title: {
      default: "Bayaan AI - Realtime Translation Agent",
      template: "%s | Bayaan AI",
    },
    description: "A sophisticated realtime translation agent powered by OpenAI's Realtime API with voice interaction capabilities.",
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: "Bayaan AI - Realtime Translation Agent",
      template: "%s | Bayaan AI",
    },
    description: "A sophisticated realtime translation agent powered by OpenAI's Realtime API with voice interaction capabilities.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Bayaan AI" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="theme-color" content="#3b82f6" />
        
        {/* PWA Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png" />
        <link rel="mask-icon" href="/icon-192x192.png" color="#3b82f6" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
          rel="stylesheet"
        />
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
        <Toaster />
      </body>
    </html>
  );
}
