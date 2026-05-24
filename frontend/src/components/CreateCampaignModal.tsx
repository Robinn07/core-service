import { useState } from "react";
import { Modal } from "./Modal";
import { Loader2 } from "lucide-react";
import { api } from "../lib/api";

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (campaign: any) => void;
}

export function CreateCampaignModal({ isOpen, onClose, onSuccess }: CreateCampaignModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");
    
    try {
      const data = await api.post("/campaigns", { name: name.trim() });
      onSuccess(data);
      setName("");
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to create campaign. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Campaign">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-100">
            {error}
          </div>
        )}
        
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Campaign Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Q3 Launch Outreach"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
            autoFocus
            required
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Create Campaign
          </button>
        </div>
      </form>
    </Modal>
  );
}
