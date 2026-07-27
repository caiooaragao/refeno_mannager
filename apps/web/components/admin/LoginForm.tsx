"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
import { loginAdmin } from "@/lib/api";
import { isAuthenticated, setAuthenticated } from "@/lib/auth";
import { useConfirm } from "@/components/ui/ConfirmProvider";

export function LoginForm() {
  const router = useRouter();
  const confirm = useConfirm();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/admin/dashboard");
    }
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!(await confirm("Tem certeza que deseja entrar?"))) {
      return;
    }

    setLoading(true);

    try {
      await loginAdmin(login.trim(), password);
      setAuthenticated(true);
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Usuário ou senha inválidos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="forest-card mx-auto max-w-md p-8">
      <div className="mb-6 text-center">
        <h1 className="text-headline-sm text-on-surface">Login Admin</h1>
        <p className="mt-1 text-body-sm text-on-surface-variant">
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
          id="login"
          label="Usuário"
          type="text"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
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

        <button type="submit" disabled={loading} className="forest-btn-primary">
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
