import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Modal } from "./Modal";

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  fields: { label: string; name: string; type: string; placeholder?: string; required?: boolean }[];
  onSubmit: (data: any) => Promise<void>;
  submitLabel: string;
}

export function ActionModal({ isOpen, onClose, title, description, fields, onSubmit, submitLabel }: ActionModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({});
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-sm text-slate-500">{description}</p>
        
        <div className="space-y-4">
          {(fields || []).map((f) => (
            <div key={f.name}>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                {f.label}
              </label>
              <input 
                type={f.type}
                required={f.required}
                placeholder={f.placeholder}
                value={formData[f.name] || ""}
                onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
