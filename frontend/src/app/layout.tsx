import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Docket",
  description: "Your team's documents, thoughtfully organized.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
