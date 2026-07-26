"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
import { isAuthenticated, login, logout } from "@/lib/auth";

const ADMIN_USER = process.env.NEXT_PUBLIC_ADMIN_USER ?? "dantenovas";
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "danterefeno";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isAuthenticated());
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const success = login(email, password, ADMIN_USER, ADMIN_PASSWORD);

    if (success) {
      setLoggedIn(true);
      setEmail("");
      setPassword("");
    } else {
      setError("Usuário ou senha inválidos");
    }

    setLoading(false);
  }

  function handleLogout() {
    logout();
    setLoggedIn(false);
    router.refresh();
  }

  if (loggedIn) {
    return (
      <div
        className="rounded-xl bg-white p-8 text-center shadow-sm"
        style={{ border: "1px solid #d1dce6", maxWidth: "28rem", margin: "0 auto" }}
      >
        <h2 className="text-xl font-bold text-blue-900">Painel Admin</h2>
        <p className="mt-2 text-sm text-slate-600">
          Você está autenticado como administrador.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: "#b91c1c" }}
        >
          Sair
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl bg-white p-8 shadow-sm"
      style={{ border: "1px solid #d1dce6", maxWidth: "28rem", margin: "0 auto" }}
    >
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-blue-900">Login Admin</h1>
        <p className="mt-1 text-sm text-slate-500">
          Acesse o painel administrativo
        </p>
      </div>

      {error && <Alert type="error" message={error} />}

      <form
        className="flex flex-col gap-5"
        onSubmit={handleSubmit}
        noValidate
        autoComplete="off"
      >
        <FormField
          id="email"
          label="Usuário"
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Digite seu usuário"
          disabled={loading}
        />

        <FormField
          id="password"
          label="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Digite sua senha"
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg px-6 py-3 font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: "#1e5a8a" }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
