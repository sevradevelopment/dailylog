import { useEffect } from "react";

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, type = "danger" }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="dialog-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dialog-card">
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{
            width: 44, height: 44, borderRadius: "12px", flexShrink: 0,
            background: type === "danger" ? "var(--danger-light)" : "var(--accent-light)",
            color: type === "danger" ? "var(--danger)" : "var(--warning)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {type === "danger" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            )}
          </div>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.375rem" }}>{title}</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.5" }}>{message}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn btn-secondary">Tühista</button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="btn"
            style={{
              background: type === "danger" ? "var(--danger)" : "var(--warning)",
              color: "#fff",
            }}
          >
            Kinnita
          </button>
        </div>
      </div>
    </div>
  );
}