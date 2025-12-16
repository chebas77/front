import { useEffect, useRef } from "react";

export function Dialog({ open, onClose, title, children, footer }) {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);

  // Cerrar con ESC
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Enfoque inicial
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      aria-hidden="true"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose?.(); // click fuera
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={panelRef}
        className="w-full max-w-[720px] max-h-[90vh] overflow-y-auto outline-none"
      >
        <div className="rounded-xl border border-border bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border">
            <h2 className="text-base sm:text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 space-y-4 text-sm text-muted-foreground">
            {children}
          </div>

          {/* Footer (opcional) */}
          {footer && (
            <div className="px-4 sm:px-5 py-3 border-t border-border bg-muted/30">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
