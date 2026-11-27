import type { Metadata } from "next";
import "./globals.css";

// System fonts until hi-fi picks a typeface (also keeps the PWA working offline).
export const metadata: Metadata = {
  title: "Cake Builder",
  description: "Plan ambitious cakes: flavors, layers, scaled recipes and a bake timeline.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
