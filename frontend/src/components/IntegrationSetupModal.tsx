import { Check, Copy, ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Modal } from "./Modal";

interface IntegrationSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: {
    name: string;
    icon: LucideIcon;
    description: string;
    webhookSuffix: string;
    docsUrl: string;
  } | null;
}

export function IntegrationSetupModal({ isOpen, onClose, app }: IntegrationSetupModalProps) {
  const [copied, setCopied] = useState(false);
  
  if (!app) return null;

  const webhookUrl = `https://ingestion.getloopx.com/integrations/${app.webhookSuffix}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Connect ${app.name}`}>
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-indigo-600">
            <app.icon size={32} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{app.name}</h3>
            <p className="text-xs text-slate-500">{app.description}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Step 1: Copy your Webhook URL</h4>
            <div className="relative group">
              <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs overflow-x-auto font-mono">
                {webhookUrl}
              </pre>
              <button 
                onClick={handleCopy}
                className="absolute top-3 right-3 p-1.5 bg-slate-800 text-slate-300 rounded-lg opacity-0 group-hover:opacity-100 transition hover:bg-slate-700 hover:text-white"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Step 2: Configure in {app.name}</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Navigate to your {app.name} Dashboard, find the Webhook settings, and paste the URL above. 
              Ensure you subscribe to events like <strong>Lead Created</strong> or <strong>Payment Succeeded</strong>.
            </p>
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <a 
            href={app.docsUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Read Documentation <ExternalLink size={14} />
          </a>
          <button 
            onClick={onClose}
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition"
          >
            I've Set It Up
          </button>
        </div>
      </div>
    </Modal>
  );
}
