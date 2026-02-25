import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import { AppProviders } from "../components/providers/app-providers";
import { PageFrame } from "../components/ui/page-frame";

export const metadata: Metadata = {
  title: "Goal Tracker",
  description: "Mobile-first goal tracker with progress insights",
  applicationName: "Goal Tracker",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Goal Tracker"
  },
  icons: {
    apple: "/icons/apple-touch-icon.svg",
    icon: [
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" }
    ]
  }
};

export const viewport: Viewport = {
  themeColor: "#E6F0EE",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppProviders>
          <PageFrame>{children}</PageFrame>
        </AppProviders>
      </body>
    </html>
  );
}
