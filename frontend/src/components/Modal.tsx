import { X } from "lucide-react";
import React, { useEffect, useState } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const [show, setShow] = useState(false);
  const [render, setRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRender(true);
      document.body.style.overflow = "hidden";
      // Slight delay to allow DOM to render before adding opacity for transition
      setTimeout(() => setShow(true), 10);
    } else {
      setShow(false);
      document.body.style.overflow = "unset";
      // Wait for transition to finish before removing from DOM
      const timer = setTimeout(() => setRender(false), 200);
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!render) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200 ${
          show ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl pointer-events-auto transition-all duration-300 transform ${
            show ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </>
  );
}
