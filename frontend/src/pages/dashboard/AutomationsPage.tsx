import { Bot, Clock, GitBranch, Loader2, Play, Plus, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { ActionModal } from "../../components/ActionModal";

export function AutomationsPage() {
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAutomations = async () => {
    try {
      const data = await api.get("/automations");
      setAutomations(data);
    } catch (error) {
      console.error("Failed to fetch automations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  const handleCreateWorkflow = async (data: { name: string; description: string }) => {
    try {
      await api.post("/automations", { 
        ...data, 
        triggerType: 'subscriber_created',
        triggerConfig: {} 
      });
      setIsModalOpen(false);
      fetchAutomations();
    } catch (error) {
      console.error("Failed to create automation:", error);
      throw error;
    }
  };

  return (
    <div className="mt-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Workflow Automations</h2>
          <p className="text-sm text-slate-500 mt-1">Design triggers and actions to automate your marketing funnel.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition"
        >
          <Plus size={18} />
          Create Workflow
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : automations && automations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {automations.map((a) => (
            <div key={a.id} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-lg transition group cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Zap size={24} />
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${a.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                  {a.isActive ? 'Active' : 'Paused'}
                </div>
              </div>
              <h3 className="font-bold text-slate-900 mb-1">{a.name}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 mb-4">{a.description || 'No description provided.'}</p>
              
              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-4 border-t border-slate-50">
                <div className="flex items-center gap-1">
                  <Users size={12} />
                  {a.executedCount || 0} Runs
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  {a.avgResponseTime || 'Instant'}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          {/* Empty State / Templates */}
          <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 bg-white">
            <Bot size={48} className="text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">Build Your First Automation</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">Trigger emails based on user behavior, form submissions, or specific events from your integrations.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
               {[
                 { name: "Welcome Sequence", icon: Sparkles, desc: "Triggered by Form Submission" },
                 { name: "Abandonment Recovery", icon: Clock, desc: "Triggered by inactivity" },
                 { name: "Tag-based Routing", icon: GitBranch, desc: "Complex logic flow" }
               ].map((t) => (
                 <button key={t.name} className="flex flex-col items-center p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition w-48 text-center group">
                   <t.icon className="text-slate-400 group-hover:text-indigo-600 mb-3" size={24} />
                   <div className="text-xs font-bold text-slate-900 mb-1">{t.name}</div>
                   <div className="text-[10px] text-slate-400 leading-tight">{t.desc}</div>
                 </button>
               ))}
            </div>
          </div>

          {/* Educational Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-900 rounded-3xl p-8 lg:p-12 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full" />
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-4">Master the Funnel</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">Automations allow you to scale your business by talking to the right person at the right time. Use LoopX's AI to predict when a lead is most likely to convert.</p>
              <ul className="space-y-4">
                {[
                  "No-code flow builder for complex logic",
                  "A/B test different paths automatically",
                  "Native integration with all lead sources",
                  "Real-time event tracking and debugging"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs font-medium text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <Play size={10} className="text-indigo-400 fill-current" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative z-10 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <div className="space-y-4">
                <div className="h-4 w-3/4 bg-white/10 rounded-full animate-pulse" />
                <div className="h-4 w-1/2 bg-white/10 rounded-full animate-pulse delay-75" />
                <div className="h-20 w-full bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                   <Zap className="text-indigo-400 animate-bounce" size={20} />
                </div>
                <div className="h-4 w-5/6 bg-white/10 rounded-full animate-pulse delay-150" />
              </div>
            </div>
          </div>
        </div>
      )}

      <ActionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Workflow"
        description="Define a trigger and the actions that follow."
        fields={[
          { label: "Workflow Name", name: "name", type: "text", placeholder: "e.g. Welcome Sequence", required: true },
          { label: "Description", name: "description", type: "text", placeholder: "e.g. Sends a series of emails to new subscribers", required: false }
        ]}
        onSubmit={handleCreateWorkflow}
        submitLabel="Create Workflow"
      />
    </div>
  );
}

// Missing icon imports
const Users = ({ size, className }: { size?: number, className?: string }) => <UsersIcon size={size} className={className} />;
import { Users as UsersIcon } from "lucide-react";
