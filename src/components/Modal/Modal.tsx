import { useEffect, type ReactNode } from "react";
import "./modal.css";

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  children: ReactNode;
  ancho?: string;
}

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" className="modal-close-icon" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export default function Modal({ abierto, onCerrar, children, ancho = "680px" }: ModalProps) {
  useEffect(() => {
    if (!abierto) return;

    const manejarEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };

    document.addEventListener("keydown", manejarEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", manejarEscape);
      document.body.style.overflow = "";
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div className="modal-panel" style={{ maxWidth: ancho }}>
        <button type="button" className="modal-close" onClick={onCerrar} aria-label="Cerrar">
          <CloseIcon />
        </button>
        {children}
      </div>
    </div>
  );
}