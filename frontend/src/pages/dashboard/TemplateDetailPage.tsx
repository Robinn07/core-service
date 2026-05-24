import { ArrowLeft, Loader2, Save, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { TemplatePreview } from "../../components/TemplatePreview";

export function TemplateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [spamResult, setSpamResult] = useState<any>(null);

  useEffect(() => {
    async function fetchTemplate() {
      try {
        const data = await api.get(`/templates/${id}`);
        setTemplate(data);
      } catch (error) {
        console.error("Failed to fetch template:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTemplate();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/templates/${id}`, template);
    } catch (error) {
      alert("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleAiAnalysis = async () => {
    setAnalyzing(true);
    try {
      const data = await api.post("/ai/intelligence/analyze-spam", { 
        htmlBody: template.htmlContent,
        subject: template.subject
      });
      setSpamResult(data);
    } catch (error) {
      console.error(error);
      alert("AI analysis failed. Please ensure the AI service is running.");
    } finally {
      setAnalyzing(false);
    }
  };

  const insertVariable = (variable: string) => {
    setTemplate({ ...template, htmlContent: (template.htmlContent || "") + ` {{${variable}}}` });
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border border-slate-200 rounded-2xl mb-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/dashboard/templates")} className="p-2 hover:bg-slate-100 rounded-xl transition">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">{template.name}</h2>
            <p className="text-xs text-slate-400">Editing Creative Template</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleAiAnalysis}
            disabled={analyzing}
            className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition disabled:opacity-50"
          >
            {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            AI Spam Analysis
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden gap-4">
        {/* Editor Side */}
        <div className="w-1/2 flex flex-col border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Subject Line</label>
              <input 
                type="text" 
                value={template.subject}
                onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition outline-none"
                placeholder="Enter subject line..."
              />
            </div>

            <div className="flex-1 flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Email Body (HTML/Text)</label>
                <div className="flex gap-2">
                  {["firstName", "leadScore", "company"].map(v => (
                    <button 
                      key={v}
                      onClick={() => insertVariable(v)}
                      className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md hover:bg-slate-200 transition"
                    >
                      +{v}
                    </button>
                  ))}
                </div>
              </div>
              <textarea 
                value={template.htmlContent || ""}
                onChange={(e) => setTemplate({ ...template, htmlContent: e.target.value })}
                className="flex-1 w-full rounded-xl border border-slate-200 p-4 text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition outline-none resize-none bg-slate-50"
                placeholder="Write your email content here..."
              />
            </div>
            
            {spamResult && (
              <div className="p-4 rounded-xl border border-amber-100 bg-amber-50">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2">
                  <Wand2 size={16} /> AI Analysis Results
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">
                  {spamResult.recommendation || "Spam score looks healthy. Consider personalizing the first paragraph further."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Preview Side */}
        <div className="w-1/2 overflow-hidden">
          <TemplatePreview html={template.htmlContent || ""} />
        </div>
      </div>
    </div>
  );
}
