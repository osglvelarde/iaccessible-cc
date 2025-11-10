import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Lora, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/cc/AuthProvider";
import Header from "@/components/cc/Header";
import NavigationBar from "@/components/cc/NavigationBar";
import TimeoutModal from "@/components/cc/TimeoutModal";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "iAccessible Command Center",
  description: "Central hub for accessibility testing and compliance management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Suppress React DevTools message in development */}
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if (typeof window !== 'undefined') {
                  const originalConsoleLog = console.log;
                  console.log = function(...args) {
                    if (args[0] && typeof args[0] === 'string' && args[0].includes('Download the React DevTools')) {
                      return; // Suppress React DevTools message
                    }
                    originalConsoleLog.apply(console, args);
                  };
                }
              `,
            }}
          />
        )}
      </head>
      <body
        className={`${plusJakartaSans.variable} ${lora.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Header />
            <NavigationBar />
            <TimeoutModal />
            <div className="container mx-auto px-4 py-6">{children}</div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
