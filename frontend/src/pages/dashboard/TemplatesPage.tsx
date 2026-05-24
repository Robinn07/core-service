import { Loader2, MessageSquareText } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreateTemplateModal } from "../../components/CreateTemplateModal";
import { api } from "../../lib/api";

export function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const data = await api.get("/templates");
        setTemplates(data);
      } catch (error) {
        console.error("Failed to fetch templates:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Message Templates</h2>
        <button onClick={() => setIsModalOpen(true)} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition">
          + New Template
        </button>
      </div>
      
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.length > 0 ? templates.map((t, i) => (
            <div 
              key={i} 
              onClick={() => navigate(`/dashboard/templates/${t.id}`)}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300 transition cursor-pointer"
            >
              <p className="font-semibold text-slate-900">{t.name}</p>
              <p className="mt-2 text-sm text-slate-500 line-clamp-2">{t.subject || 'No subject'}</p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Created {new Date(t.createdAt).toLocaleDateString()}</span>
                <span className="uppercase bg-slate-100 px-2 py-0.5 rounded-full">EMAIL</span>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200">
              <MessageSquareText className="text-slate-200 mx-auto mb-3" size={40} />
              <p className="text-slate-500">No templates found. Create one to get started.</p>
            </div>
          )}
        </div>
      )}

      <CreateTemplateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={(data) => {
          setTemplates([...templates, data]);
          navigate(`/dashboard/templates/${data.id}`);
        }}
      />
    </div>
  );
}
