import {
  Fira_Code as FontMono,
  Montserrat as FontSans,
  Playfair_Display as FontDisplay,
} from "next/font/google";

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
});

// Display serif for the landing wordmark's italic cut-out letters.
export const fontDisplay = FontDisplay({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["900"],
  variable: "--font-display",
});
