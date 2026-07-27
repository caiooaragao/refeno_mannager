interface TableRowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleting?: boolean;
  disableEdit?: boolean;
  disableDelete?: boolean;
  editAriaLabel?: string;
  deleteAriaLabel?: string;
  editTitle?: string;
  deleteTitle?: string;
}

export function TableRowActions({
  onEdit,
  onDelete,
  editLabel = "Editar",
  deleting = false,
  disableEdit = false,
  disableDelete = false,
  editAriaLabel,
  deleteAriaLabel,
  editTitle,
  deleteTitle,
}: TableRowActionsProps) {
  return (
    <>
      <button
        type="button"
        onClick={onEdit}
        disabled={disableEdit}
        aria-label={editAriaLabel}
        title={editTitle}
        className="forest-btn-ghost inline-flex cursor-pointer items-center gap-1.5 disabled:hover:bg-transparent"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
        <span>{editLabel}</span>
      </button>

      <button
        type="button"
        onClick={onDelete}
        disabled={disableDelete || deleting}
        aria-label={deleteAriaLabel}
        title={deleteTitle}
        className="forest-btn-danger-ghost inline-flex cursor-pointer items-center gap-1.5 disabled:hover:bg-transparent"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
        <span>{deleting ? "Excluindo..." : "Excluir"}</span>
      </button>
    </>
  );
}
