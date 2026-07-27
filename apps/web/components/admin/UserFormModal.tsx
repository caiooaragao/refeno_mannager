"use client";

import { FormEvent, useState } from "react";
import { AdminUser, createUser, updateUser } from "@/lib/api";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";

interface UserFormModalProps {
  user?: AdminUser | null;
  onClose: () => void;
  onSaved: (login: string) => void;
}

function validateForm(
  login: string,
  password: string,
  isEditing: boolean
): string | null {
  if (!login.trim()) {
    return "Usuário é obrigatório";
  }

  if (login.trim().length < 2) {
    return "Usuário deve ter pelo menos 2 caracteres";
  }

  if (!isEditing && !password) {
    return "Senha é obrigatória";
  }

  if (password && password.length < 6) {
    return "Senha deve ter pelo menos 6 caracteres";
  }

  return null;
}

export function UserFormModal({ user, onClose, onSaved }: UserFormModalProps) {
  const confirm = useConfirm();
  const isEditing = Boolean(user);

  const [login, setLogin] = useState(user?.login ?? "");
  const [password, setPassword] = useState("");
  const [permission, setPermission] = useState<"read" | "readwrite">(
    user?.permission === "readwrite" ? "readwrite" : "read"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validateForm(login, password, isEditing);
    if (validationError) {
      setError(validationError);
      return;
    }

    const confirmMessage = isEditing
      ? "Tem certeza que deseja confirmar a atualização do usuário?"
      : "Tem certeza que deseja confirmar o cadastro do usuário?";

    if (!(await confirm(confirmMessage))) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        login: login.trim(),
        permission,
        ...(password ? { password } : {}),
      };

      if (isEditing && user) {
        await updateUser(user.id, payload);
      } else {
        await createUser({
          ...payload,
          password,
        });
      }

      onSaved(login.trim());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEditing
            ? "Erro ao atualizar usuário"
            : "Erro ao cadastrar usuário"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="forest-modal-overlay py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-form-title"
    >
      <div className="forest-modal max-h-[90vh] max-w-md overflow-y-auto">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="user-form-title" className="text-headline-sm text-on-surface">
              {isEditing ? "Editar usuário" : "Novo usuário"}
            </h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              {isEditing
                ? "Atualize login, senha e permissão de acesso"
                : "Cadastre um usuário com login, senha e permissão de acesso"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Fechar modal"
            className="rounded px-2 py-1 text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {error && <Alert type="error" message={error} />}

        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <FormField
            id="user-login"
            label="Usuário"
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="Digite o usuário"
            disabled={loading}
          />

          <FormField
            id="user-password"
            label={isEditing ? "Nova senha" : "Senha"}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={
              isEditing
                ? "Deixe em branco para manter a senha atual"
                : "Digite a senha"
            }
            disabled={loading}
          />

          <fieldset className="rounded-lg border border-outline-variant/50 bg-surface-container-low px-4 py-3">
            <legend className="px-1 text-sm font-semibold text-on-surface">
              Permissão
            </legend>

            <div className="mt-2 flex flex-col gap-3">
              <label className="flex cursor-pointer items-center gap-3 text-sm text-on-surface-variant">
                <input
                  type="radio"
                  name="user-permission"
                  value="read"
                  checked={permission === "read"}
                  onChange={() => setPermission("read")}
                  disabled={loading}
                  className="h-4 w-4 accent-primary"
                />
                Ler dados
              </label>

              <label className="flex cursor-pointer items-center gap-3 text-sm text-on-surface-variant">
                <input
                  type="radio"
                  name="user-permission"
                  value="readwrite"
                  checked={permission === "readwrite"}
                  onChange={() => setPermission("readwrite")}
                  disabled={loading}
                  className="h-4 w-4 accent-primary"
                />
                Ler e editar dados
              </label>
            </div>
          </fieldset>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="forest-btn-secondary px-5 py-2.5"
            >
              Cancelar
            </button>

            <button type="submit" disabled={loading} className="forest-btn-primary px-5 py-2.5">
              {loading
                ? "Salvando..."
                : isEditing
                  ? "Atualizar usuário"
                  : "Cadastrar usuário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
