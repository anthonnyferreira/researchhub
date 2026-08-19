import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentAppUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "ResearchHub — Encontre a pesquisa certa",
  description: "A infraestrutura de descoberta científica da sua universidade.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const appUser = await getCurrentAppUser();

  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <header className="border-b border-line">
          <div className="mx-auto max-w-5xl px-6 py-5 flex items-center justify-between">
            <Link href="/" className="font-display text-xl tracking-tight text-ink">
              Research<span className="text-teal">Hub</span>
            </Link>
            <nav className="text-sm text-ink-soft flex items-center gap-6">
              <Link href="/buscar" className="hover:text-teal">Buscar</Link>
              {appUser && (
                <Link href="/dashboard" className="hover:text-teal">Painel</Link>
              )}
              {appUser ? (
                <>
                  <span className="text-ink-soft/70">{appUser.name}</span>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:text-teal">Entrar</Link>
                  <Link
                    href="/cadastro"
                    className="text-white bg-teal px-3 py-1.5 rounded-card hover:bg-teal/90 transition-colors"
                  >
                    Criar conta
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
        <footer className="mx-auto max-w-5xl px-6 py-10 text-xs text-ink-soft/70 border-t border-line mt-16">
          ResearchHub — organiza relações, não documentos.
        </footer>
      </body>
    </html>
  );
}
