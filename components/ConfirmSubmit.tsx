"use client";

export function ConfirmSubmit({
  label,
  confirmText,
  className,
}: {
  label: React.ReactNode;
  confirmText: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {label}
    </button>
  );
}
