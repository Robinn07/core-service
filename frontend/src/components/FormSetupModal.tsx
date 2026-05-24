import { Check, Copy, ExternalLink, Terminal } from "lucide-react";
import { useState } from "react";
import { Modal } from "./Modal";

interface FormSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: any | null;
}

export function FormSetupModal({ isOpen, onClose, form }: FormSetupModalProps) {
  const [copied, setCopied] = useState(false);
  
  if (!form) return null;

  const embedCode = `<script \n  src="${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000'}/api/public/lx.js" \n  data-form-id="${form.id}"\n></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Form Setup & Embedding">
      <div className="space-y-6">
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-4">
          <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm">
            <Terminal size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-indigo-900">Universal Embed Script</h3>
            <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
              Copy and paste this code into your website's <code>&lt;head&gt;</code> or before the closing <code>&lt;/body&gt;</code> tag.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative group">
            <pre className="bg-slate-900 text-slate-300 p-5 rounded-2xl text-xs overflow-x-auto font-mono leading-relaxed border border-slate-800 shadow-xl">
              {embedCode}
            </pre>
            <button 
              onClick={handleCopy}
              className="absolute top-4 right-4 p-2 bg-slate-800 text-slate-300 rounded-xl opacity-0 group-hover:opacity-100 transition hover:bg-slate-700 hover:text-white border border-slate-700 shadow-lg"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</h4>
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active & Receiving
              </div>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target List</h4>
              <div className="text-sm font-semibold text-slate-700 truncate">
                {form.listId ? 'Main Audience' : 'General'}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-sm font-semibold text-slate-900 mb-2">How it works</h4>
            <ul className="space-y-2">
              {[
                "The script automatically renders the form on your site.",
                "Captured leads are instantly synced to your audience.",
                "Double opt-in is automatically handled by LoopX."
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-3 text-xs text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <button 
            onClick={() => {
              console.log("Closing FormSetupModal...");
              onClose();
            }}
            className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition active:scale-[0.98]"
          >
            Complete Setup
          </button>
          <a 
            href="#" 
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Live Preview <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </Modal>
  );
}
