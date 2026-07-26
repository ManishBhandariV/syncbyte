"use client";

/**
 * A small delete button that submits a server action after a confirm() prompt.
 * Usable from server components — the server action is passed in as a prop.
 */
export function ConfirmDeleteButton({
  action,
  id,
  confirmText,
  label,
  title,
  color = "#ef4444",
}: {
  action: (formData: FormData) => void | Promise<void>;
  id?: number | string;
  confirmText: string;
  label?: string;
  title?: string;
  color?: string;
}) {
  return (
    <form action={action} style={{ display: "inline" }}>
      {id !== undefined && <input type="hidden" name="id" value={id} />}
      <button
        type="submit"
        title={title}
        onClick={(e) => {
          if (!confirm(confirmText)) e.preventDefault();
        }}
        style={{
          background: label ? color : "none",
          color: label ? "#fff" : color,
          border: "none",
          borderRadius: 6,
          padding: label ? "5px 12px" : "2px 6px",
          fontSize: label ? "0.78rem" : "0.95rem",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        <i className="fas fa-trash" />
        {label ? ` ${label}` : ""}
      </button>
    </form>
  );
}
