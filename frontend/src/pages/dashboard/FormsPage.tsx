import { ArrowRight, Loader2, MessageSquareMore } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { ActionModal } from "../../components/ActionModal";
import { FormSetupModal } from "../../components/FormSetupModal";

export function FormsPage() {
  const [forms, setForms] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<any | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [formsData, listsData] = await Promise.all([
          api.get("/forms"),
          api.get("/lists")
        ]);
        setForms(formsData);
        setLists(listsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCreateForm = async (data: { name: string }) => {
    try {
      let targetListId = lists[0]?.id;
      
      if (!targetListId) {
        console.log("No lists found, creating default 'Website Leads' list...");
        const newList = await api.post("/lists", { 
          name: "Website Leads", 
          description: "Default list for web forms" 
        });
        if (!newList || !newList.id) throw new Error("Failed to create default audience list");
        targetListId = newList.id;
        setLists([newList]);
      }

      const res = await api.post("/forms", { 
        name: data.name, 
        listId: targetListId,
        fieldsConfig: { 
          title: data.name, 
          fields: [{ name: "email", label: "Email Address", type: "email", required: true }] 
        } 
      });
      setForms([...forms, res]);
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Form creation error:", error);
      alert(`Failed to create form: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Lead Capture Forms</h2>
        <button onClick={() => setIsModalOpen(true)} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition">
          + Create New Form
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-500">
          <div>Form Name</div>
          <div>Status</div>
          <div>Submissions</div>
          <div>Actions</div>
        </div>
        
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : forms.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {forms.map((f) => (
              <div key={f.id} className="grid grid-cols-4 p-4 text-sm items-center hover:bg-slate-50 transition cursor-pointer">
                <div className="font-medium text-slate-900">{f.name}</div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700`}>
                    ACTIVE
                  </span>
                </div>
                <div className="text-slate-500">0 submissions</div>
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedForm(f);
                  }}
                  className="text-indigo-600 font-semibold flex items-center gap-1 hover:text-indigo-700 transition"
                >
                  View Setup <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <MessageSquareMore className="text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-slate-900">No forms yet</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6">Create a form to start capturing leads from your website.</p>
            <button onClick={() => setIsModalOpen(true)} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition">
              Create Your First Form
            </button>
          </div>
        )}
      </div>

      <ActionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Form"
        description="Lead capture forms allow you to automatically grow your audience from your website."
        fields={[
          { label: "Form Name", name: "name", type: "text", placeholder: "e.g. Early Access List", required: true }
        ]}
        onSubmit={handleCreateForm}
        submitLabel="Create Form"
      />

      <FormSetupModal 
        isOpen={!!selectedForm}
        onClose={() => setSelectedForm(null)}
        form={selectedForm}
      />
    </div>
  );
}
