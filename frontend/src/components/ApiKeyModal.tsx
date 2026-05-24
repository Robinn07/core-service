import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Modal } from "./Modal";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) fetchKeys();
  }, [isOpen]);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const data = await api.get("/api-keys");
      setKeys(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const name = window.prompt("Enter a name for this API key (e.g., 'Server 1'):");
      if (!name) return;
      const data = await api.post("/api-keys", { name });
      setKeys([...keys, data]);
      alert(`Key generated! Please copy it now, it won't be shown again:\n\n${data.key}`);
    } catch (error) {
      alert("Failed to generate key");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API key?")) return;
    try {
      await api.delete(`/api-keys/${id}`);
      setKeys(keys.filter(k => k.id !== id));
    } catch (error) {
      alert("Failed to revoke key");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="API Keys">
      <div className="space-y-6">
        <p className="text-sm text-slate-500">
          Use API keys to authenticate your server-to-server requests to the LoopX Ingestion API.
        </p>

        <div className="space-y-3">
          {loading ? (
            <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>
          ) : keys.length > 0 ? (
            keys.map(k => (
              <div key={k.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{k.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Created {new Date(k.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleDelete(k.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-sm text-slate-400">No API keys generated yet.</div>
          )}
        </div>

        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Generate New API Key
        </button>
      </div>
    </Modal>
  );
}
