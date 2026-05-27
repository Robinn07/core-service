import { AlertCircle, Copy, KeyRound, Loader2, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function SecuritySettings() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const data = await api.get("/api-keys");
      setKeys(data);
    } catch (err) {
      console.error("Failed to load keys", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setGenerating(true);
    try {
      const data = await api.post("/api-keys", { name: newKeyName.trim(), scopes: ['full_access'] });
      setNewlyGeneratedKey(data.apiKey);
      setShowAddForm(false);
      setNewKeyName("");
      fetchKeys();
    } catch (err) {
      alert("Failed to generate key");
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this key? Any integrations using it will instantly fail.")) return;
    try {
      await api.delete(`/api-keys/${id}`);
      fetchKeys();
    } catch (err) {
      alert("Failed to revoke key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">API Keys</h3>
            <p className="text-sm text-slate-500 mt-1">Manage API keys to authenticate external systems with GetLoopX.</p>
          </div>
          <button 
            onClick={() => { setShowAddForm(!showAddForm); setNewlyGeneratedKey(null); }}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
              showAddForm ? "bg-slate-100 text-slate-600" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100"
            }`}
          >
            {showAddForm ? <X size={14} /> : <Plus size={14} />}
            {showAddForm ? "Cancel" : "Generate Key"}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleGenerateKey} className="mb-8 p-6 rounded-2xl bg-slate-50 border border-slate-100 animate-in slide-in-from-top-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Key Name</label>
                <input
                  type="text"
                  placeholder="e.g. Zapier Integration"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 shadow-sm"
                  autoFocus
                  required
                />
              </div>
              <div className="flex items-end">
                <button 
                  type="submit"
                  disabled={generating}
                  className="w-full md:w-auto h-[46px] rounded-xl bg-slate-900 px-8 text-sm font-bold text-white hover:bg-slate-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  Generate
                </button>
              </div>
            </div>
          </form>
        )}

        {newlyGeneratedKey && (
          <div className="mb-8 p-6 rounded-2xl bg-emerald-50 border border-emerald-100 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-emerald-800 mb-4">
              <AlertCircle size={18} />
              <p className="text-sm font-bold">Please copy your API key now.</p>
            </div>
            <p className="text-xs text-emerald-700 mb-4">For your security, it will never be shown again.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 rounded-xl bg-white border border-emerald-200 text-sm font-mono text-slate-800 break-all shadow-sm">
                {newlyGeneratedKey}
              </code>
              <button 
                onClick={() => copyToClipboard(newlyGeneratedKey)}
                className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-sm"
                title="Copy to clipboard"
              >
                <Copy size={18} />
              </button>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {keys.filter(k => k.isActive).length > 0 ? (
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <div className="col-span-5">Name / Prefix</div>
                <div className="col-span-3">Created</div>
                <div className="col-span-3">Last Used</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>
              {keys.filter(k => k.isActive).map((key) => (
                <div key={key.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                  <div className="col-span-5">
                    <div className="text-sm font-bold text-slate-900">{key.name}</div>
                    <div className="text-xs font-mono text-slate-500 mt-1">{key.keyPrefix}••••••••</div>
                  </div>
                  <div className="col-span-3 text-xs font-medium text-slate-600">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </div>
                  <div className="col-span-3 text-xs font-medium text-slate-600">
                    {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                  </div>
                  <div className="col-span-1 text-right">
                    <button 
                      onClick={() => handleRevoke(key.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Revoke Key"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl">
              <KeyRound size={40} className="text-slate-300 mx-auto mb-4" />
              <div className="text-sm font-bold text-slate-900">No Active API Keys</div>
              <p className="text-xs text-slate-500 mt-1">Generate a key to connect external applications.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
