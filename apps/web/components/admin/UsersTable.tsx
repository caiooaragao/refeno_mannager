"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminUser, deleteUser, getUsers } from "@/lib/api";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { hasReadWritePermission } from "@/lib/permissions";
import { UserFormModal } from "@/components/admin/UserFormModal";
import { SuccessDialog } from "@/components/ui/SuccessDialog";
import { TableRowActions } from "@/components/ui/TableRowActions";

interface UsersTableProps {
  userPermission?: string | null;
  currentUserId?: string | null;
}

function formatPermission(permission: string): string {
  if (permission === "readwrite") {
    return "Ler e editar dados";
  }

  return "Ler dados";
}

export function UsersTable({
  userPermission = null,
  currentUserId = null,
}: UsersTableProps) {
  const confirm = useConfirm();
  const canManage = hasReadWritePermission(userPermission);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [savedUserLogin, setSavedUserLogin] = useState<string | null>(null);
  const [savedAction, setSavedAction] = useState<"created" | "updated" | null>(
    null
  );

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) =>
        a.login.localeCompare(b.login, "pt-BR", { sensitivity: "base" })
      ),
    [users]
  );

  async function loadUsers() {
    setLoading(true);
    setError(null);

    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleDelete(user: AdminUser) {
    if (!canManage || user.id === currentUserId) {
      return;
    }

    if (
      !(await confirm(`Tem certeza que deseja excluir o usuário ${user.login}?`))
    ) {
      return;
    }

    setDeletingId(user.id);
    setError(null);

    try {
      await deleteUser(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir usuário");
    } finally {
      setDeletingId(null);
    }
  }

  function handleSaved(login: string, action: "created" | "updated") {
    setShowCreateModal(false);
    setEditingUser(null);
    setSavedUserLogin(login);
    setSavedAction(action);
    loadUsers();
  }

  return (
    <>
      {(showCreateModal || editingUser) && canManage && (
        <UserFormModal
          user={editingUser}
          onClose={() => {
            setShowCreateModal(false);
            setEditingUser(null);
          }}
          onSaved={(login) =>
            handleSaved(login, editingUser ? "updated" : "created")
          }
        />
      )}

      {savedUserLogin && savedAction && (
        <SuccessDialog
          title={
            savedAction === "created"
              ? "Usuário cadastrado"
              : "Usuário atualizado"
          }
          ariaLabelledBy="user-saved-title"
          onClose={() => {
            setSavedUserLogin(null);
            setSavedAction(null);
          }}
        >
          O usuário <span className="font-semibold">{savedUserLogin}</span> foi{" "}
          {savedAction === "created" ? "cadastrado" : "atualizado"} com sucesso.
        </SuccessDialog>
      )}

      <div className="forest-table-panel">
        <div className="forest-table-header">
          <div>
            <h2 className="text-sm font-semibold text-on-surface">Usuários</h2>
            <p className="text-xs text-on-surface-variant">
              {sortedUsers.length} usuário
              {sortedUsers.length === 1 ? "" : "s"} cadastrado
              {sortedUsers.length === 1 ? "" : "s"}
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="forest-btn-primary w-full sm:w-auto"
            >
              Novo usuário
            </button>
          )}
        </div>

        {error && (
          <div className="border-b border-outline-variant/50 bg-error-container/20 px-4 py-3 text-body-sm text-error">
            {error}
          </div>
        )}

        <div className="md:hidden">
          {loading ? (
            <p className="px-4 py-10 text-center text-body-sm text-on-surface-variant">
              Carregando usuários...
            </p>
          ) : sortedUsers.length === 0 ? (
            <p className="px-4 py-10 text-center text-body-sm text-on-surface-variant">
              Nenhum usuário cadastrado.
            </p>
          ) : (
            <div className="forest-divider divide-y">
              {sortedUsers.map((user) => (
                <div key={user.id} className="px-3 py-4 sm:px-4">
                  <p className="font-medium text-on-surface">
                    {user.login}
                    {user.id === currentUserId && (
                      <span className="ml-1 text-xs text-on-surface-variant">(você)</span>
                    )}
                  </p>

                  <dl className="mt-2 space-y-1 text-sm text-on-surface-variant">
                    <div className="flex gap-2">
                      <dt className="shrink-0 text-on-surface-variant">Permissão:</dt>
                      <dd>{formatPermission(user.permission)}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="shrink-0 text-on-surface-variant">Cadastrado em:</dt>
                      <dd>{user.createdAt}</dd>
                    </div>
                  </dl>

                  {canManage && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <TableRowActions
                        onEdit={() => setEditingUser(user)}
                        onDelete={() => handleDelete(user)}
                        disableEdit={false}
                        disableDelete={user.id === currentUserId || deletingId === user.id}
                        deleting={deletingId === user.id}
                        editAriaLabel={`Editar usuário ${user.login}`}
                        deleteAriaLabel={`Excluir usuário ${user.login}`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="forest-table-thead">
              <tr>
                <th className="border-b border-outline-variant/50 px-4 py-3 font-medium">
                  Usuário
                </th>
                <th className="border-b border-outline-variant/50 px-4 py-3 font-medium">
                  Permissão
                </th>
                <th className="border-b border-outline-variant/50 px-4 py-3 font-medium">
                  Cadastrado em
                </th>
                {canManage && (
                  <th className="border-b border-outline-variant/50 px-4 py-3 font-medium">
                    Ações
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={canManage ? 4 : 3}
                    className="px-4 py-10 text-center text-body-sm text-on-surface-variant"
                  >
                    Carregando usuários...
                  </td>
                </tr>
              ) : sortedUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 4 : 3}
                    className="px-4 py-10 text-center text-body-sm text-on-surface-variant"
                  >
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              ) : (
                sortedUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`border-b border-outline-variant/50 transition-colors duration-150 hover:bg-primary/10 ${
                      index % 2 === 0 ? "forest-table-row-even" : "forest-table-row-odd"
                    }`}
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 text-on-surface">
                      {user.login}
                      {user.id === currentUserId && (
                        <span className="ml-2 text-xs text-on-surface-variant">(você)</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-on-surface-variant">
                      {formatPermission(user.permission)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-on-surface-variant">
                      {user.createdAt}
                    </td>
                    {canManage && (
                      <td className="whitespace-nowrap px-4 py-3.5 text-on-surface-variant">
                        <div className="flex items-center gap-2">
                          <TableRowActions
                            onEdit={() => setEditingUser(user)}
                            onDelete={() => handleDelete(user)}
                            disableDelete={user.id === currentUserId || deletingId === user.id}
                            deleting={deletingId === user.id}
                            editAriaLabel={`Editar usuário ${user.login}`}
                            deleteAriaLabel={`Excluir usuário ${user.login}`}
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
