import type { Metadata } from "next";
import {
  Cinzel,
  Cormorant_Garamond,
  Libre_Baskerville,
} from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const libre = Libre_Baskerville({
  variable: "--font-libre",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "The Librarian — AI Book Discovery",
  description:
    "A gothic literary AI book recommendation experience powered by conversational RAG.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cormorant.variable} ${libre.variable} ${cinzel.variable}`}
      >
        {children}
      </body>
    </html>
  );
}