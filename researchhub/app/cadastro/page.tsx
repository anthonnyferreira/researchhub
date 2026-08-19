"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function CadastroPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "professor" | "coordinator">("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = supabaseBrowser();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!signUpData.user) {
      setError("Não foi possível criar a conta. Tente novamente.");
      setLoading(false);
      return;
    }

    // Sem sessão ainda = Supabase está exigindo confirmação por e-mail.
    // O registro em `users`/`students` só é criado quando a pessoa
    // efetivamente tiver uma sessão — imediatamente aqui (se a
    // confirmação estiver desligada) ou na primeira página que ela
    // visitar depois de clicar no link do e-mail (veja getCurrentAppUser).
    if (!signUpData.session) {
      setNeedsConfirmation(true);
      setLoading(false);
      return;
    }

    router.push(
      role === "student"
        ? "/onboarding"
        : role === "professor"
        ? "/professores/vincular"
        : "/coordenador/departamento"
    );
    router.refresh();
  }

  if (needsConfirmation) {
    return (
      <div className="max-w-md">
        <h1 className="font-display text-2xl text-ink">Confirme seu e-mail</h1>
        <p className="text-ink-soft mt-4">
          Enviamos um link de confirmação para <strong>{email}</strong>. Clique
          nele para ativar sua conta — você será levado direto para o próximo passo.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <h1 className="font-display text-2xl text-ink">Criar conta</h1>
      <p className="text-ink-soft mt-2">Encontre orientadores, projetos e laboratórios.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="text-sm text-ink-soft">Nome completo</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 border border-line rounded-card px-3 py-2 outline-none focus:border-teal bg-white"
          />
        </div>

        <div>
          <label className="text-sm text-ink-soft">E-mail</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1 border border-line rounded-card px-3 py-2 outline-none focus:border-teal bg-white"
          />
        </div>

        <div>
          <label className="text-sm text-ink-soft">Senha</label>
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1 border border-line rounded-card px-3 py-2 outline-none focus:border-teal bg-white"
          />
        </div>

        <div>
          <label className="text-sm text-ink-soft">Eu sou</label>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`flex-1 border rounded-card px-2 py-2 text-sm font-medium transition-colors ${
                role === "student" ? "border-teal bg-teal-soft text-teal" : "border-line text-ink-soft"
              }`}
            >
              Aluno
            </button>
            <button
              type="button"
              onClick={() => setRole("professor")}
              className={`flex-1 border rounded-card px-2 py-2 text-sm font-medium transition-colors ${
                role === "professor" ? "border-teal bg-teal-soft text-teal" : "border-line text-ink-soft"
              }`}
            >
              Professor
            </button>
            <button
              type="button"
              onClick={() => setRole("coordinator")}
              className={`flex-1 border rounded-card px-2 py-2 text-sm font-medium transition-colors ${
                role === "coordinator" ? "border-teal bg-teal-soft text-teal" : "border-line text-ink-soft"
              }`}
            >
              Coordenador
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal text-white font-medium py-2.5 rounded-card hover:bg-teal/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="text-sm text-ink-soft mt-6">
        Já tem conta?{" "}
        <a href="/login" className="text-teal font-medium hover:underline">
          Entrar
        </a>
      </p>
    </div>
  );
}
