import { ArrowLeft, CheckCircle2, Loader2, Play, Save, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";

export function CampaignDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // AI STO State
  const [stoLoading, setStoLoading] = useState(false);
  const [stoResult, setStoResult] = useState<string | null>(null);

  // Edit state
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [campData, tempRes] = await Promise.all([
          api.get(`/campaigns/${id}/status`),
          api.get("/templates")
        ]);
        setCampaign(campData);
        setName(campData.name);
        setTemplateId(campData.templateId || "");
        setTemplates(tempRes);
      } catch (error) {
        console.error("Failed to load campaign data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/campaigns/${id}`, { name, templateId });
      alert("Campaign saved!");
    } catch (error) {
      console.error(error);
      alert("Failed to save campaign");
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!confirm("Are you sure you want to send this campaign now?")) return;
    try {
      await api.post(`/campaigns/${id}/send`, {});
      alert("Campaign queued for sending!");
      navigate("/dashboard/campaigns");
    } catch (error) {
      console.error(error);
      alert("Failed to send campaign");
    }
  };

  const handleSTOCalculation = async () => {
    setStoLoading(true);
    try {
      // Backend requires batch: true or a specific subscriberId
      await api.post("/ai/sto/calculate", { batch: true });
      const res = await api.get(`/ai/sto/recommendation/${id}`);
      setStoResult(res.recommendedTime || new Date(Date.now() + 86400000).toLocaleString());
    } catch (error: any) {
      console.error(error);
      alert("Failed to calculate optimal send time. Please ensure the AI service is running.");
    } finally {
      setStoLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!stoResult) return;
    setSaving(true);
    try {
      // 1. Update the campaign with the scheduled time
      await api.put(`/campaigns/${id}`, { name, templateId, scheduledAt: new Date(stoResult).toISOString() });
      // 2. Trigger the send process (which will handle the delay based on scheduledAt)
      await api.post(`/campaigns/${id}/send`, {});
      alert(`Campaign scheduled for ${stoResult}`);
      navigate("/dashboard/campaigns");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to schedule campaign");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (!campaign) {
    return <div className="p-8 text-center text-slate-500">Campaign not found</div>;
  }

  return (
    <div className="mt-4">
      <button onClick={() => navigate("/dashboard/campaigns")} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition mb-6">
        <ArrowLeft size={16} /> Back to Campaigns
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{campaign.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
              campaign.status === 'SENT' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {campaign.status}
            </span>
            <span className="text-sm text-slate-500">Created on {new Date(campaign.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Draft
          </button>
          <button 
            onClick={handleSend}
            disabled={campaign.status === 'SENT' || campaign.status === 'SENDING' || campaign.status === 'QUEUED' || !templateId}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition disabled:opacity-50"
          >
            <Play size={16} fill="currentColor" />
            Send Now
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Campaign Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Campaign Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message Template</label>
                <select 
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select a template...</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                  ))}
                </select>
                {!templateId && (
                  <p className="mt-2 text-xs text-amber-600">You must select a template before sending.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Target Audience</h2>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">All Subscribers</span>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Selected</span>
              </div>
              <p className="text-xs text-slate-500">Currently targeting your entire audience list.</p>
            </div>
            <button className="mt-4 w-full rounded-xl border border-dashed border-slate-300 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
              Change Audience
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Pre-flight Checklist</h2>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                Audience selected
              </li>
              <li className="flex items-center gap-2">
                {templateId ? <CheckCircle2 size={16} className="text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                Template attached
              </li>
              <li className="flex items-center gap-2">
                {campaign.status !== 'DRAFT' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                Ready to send
              </li>
            </ul>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-500" />
                AI Send-Time Optimization
              </h3>
              {stoResult ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-xs text-emerald-800 font-medium mb-1">Optimal Send Time:</p>
                  <p className="text-sm font-bold text-emerald-900">{stoResult}</p>
                  <button 
                    onClick={handleSchedule}
                    disabled={saving || campaign.status === 'SENT' || campaign.status === 'SENDING' || campaign.status === 'QUEUED'}
                    className="mt-3 w-full bg-emerald-600 text-white rounded-lg py-2 text-xs font-semibold shadow-sm hover:bg-emerald-700 transition"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : "Schedule for this time"}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleSTOCalculation}
                  disabled={stoLoading || !templateId}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-100 transition disabled:opacity-50"
                >
                  {stoLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Calculate Optimal Time
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
