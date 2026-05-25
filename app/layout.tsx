import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VidMeme — Video Meme Creator",
  description: "Create video memes instantly. Upload a video, add meme-style text overlays, and export in seconds. No signup required.",
  keywords: ["video meme", "meme creator", "meme generator", "video editor", "meme maker"],
  openGraph: {
    title: "VidMeme — Video Meme Creator",
    description: "Create hilarious video memes in seconds",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Bebas+Neue&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
