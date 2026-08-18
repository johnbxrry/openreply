import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// NaN Drum Narrow ships a single cut (ExtraBold 800), declared exactly so the
// browser never synthesizes other weights from it.
const drum = localFont({
  src: "./fonts/NaNDrumNarrow-ExtraBold.ttf",
  weight: "800",
  style: "normal",
  variable: "--font-drum",
  display: "swap",
});

export const viewport: Viewport = {
  // Dark is the default theme; the toggle rewrites this meta at runtime.
  themeColor: "#0F1218",
};

export const metadata: Metadata = {
  title: "Aire Company Social Analytics",
  description:
    "A free, self-hosted ManyChat alternative. Send an Instagram DM automatically when someone comments a keyword on your post or reel, using the official Meta API.",
  keywords: [
    "instagram automation",
    "comment to DM",
    "instagram private replies",
    "social commerce",
    "manychat alternative",
  ],
};

// Runs before anything below it paints, so a stored light preference never
// flashes dark. Dark needs no attribute — it's the :root default.
const themeInit =
  "try{if(localStorage.getItem('theme')==='light')document.documentElement.dataset.theme='light'}catch(e){}";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`h-full ${inter.variable} ${drum.variable}`}
    >
      <body className="min-h-full bg-background text-foreground font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
