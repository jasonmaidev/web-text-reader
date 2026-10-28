import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/open-sans";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Readspace — Room for your words",
  description: "A quiet space to paste and read. Adjust text size, reading width, and appearance. No account or database needed.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
