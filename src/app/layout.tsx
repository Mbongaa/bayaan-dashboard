import type { Metadata } from "next";
import "./globals.css";
import "./shared/lib/envSetup";
import { Poppins } from "next/font/google";
import { Providers } from "./providers/Providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

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
        {/* Critical Viewport for iOS PWA */}
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover" />

        {/* PWA Meta Tags */}
        <meta name="application-name" content="Bayaan AI" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Bayaan AI" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#3b82f6" />

        {/* PWA Icons - iOS Specific Sizes */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-72x72.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-72x72.png" />
        <link rel="apple-touch-icon" href="/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-192x192.png" />
        <link rel="mask-icon" href="/icon-512x512.png" color="#3b82f6" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Apple Splash Screen Images for Various Device Sizes */}
        <link
          rel="apple-touch-startup-image"
          href="/icon-512x512.png"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icon-512x512.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icon-512x512.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icon-512x512.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icon-512x512.png"
          media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icon-512x512.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
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
      <body className={`${poppins.className} antialiased bg-gray-100 text-gray-800 dark:bg-black dark:text-gray-100`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
