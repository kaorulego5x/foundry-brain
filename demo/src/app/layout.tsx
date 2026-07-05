import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Foundry Brain",
  description: "AI Yield Engineer — Company Brain, built for the fab",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex h-screen flex-col">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                FB
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                Foundry Brain
              </span>
            </Link>
            <span className="ml-1 text-xs text-slate-400">
              built for the semiconductor fab
            </span>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
            Fab #2 · Etch Bay
          </div>
        </header>
        <div className="min-h-0 flex-1">{children}</div>
      </body>
    </html>
  );
}
