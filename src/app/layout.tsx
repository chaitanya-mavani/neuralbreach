import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeuralBreach — AI Vulnerability Fuzzer",
  description:
    "Professional-grade AI/LLM security testing platform. Automated red teaming for prompt injection, jailbreak, and data exfiltration vulnerabilities.",
  keywords: ["AI security", "LLM fuzzer", "prompt injection", "red team", "cybersecurity"],
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
