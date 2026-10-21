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

// Intertitle serif for the loading screen's silent-film title card.
export const fontIntertitle = FontDisplay({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["600"],
  variable: "--font-intertitle",
  display: "swap",
});
