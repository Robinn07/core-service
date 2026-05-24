import { ArrowRight, Loader2, Megaphone } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreateCampaignModal } from "../../components/CreateCampaignModal";
import { api } from "../../lib/api";

export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const data = await api.get("/campaigns"); 
        setCampaigns(data);
      } catch (error) {
        console.error("Failed to fetch campaigns:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">All Campaigns</h2>
        <button onClick={() => setIsModalOpen(true)} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition">
          + Create Campaign
        </button>
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-500">
          <div>Campaign Name</div>
          <div>Status</div>
          <div>Type</div>
          <div>Performance</div>
        </div>
        
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : campaigns.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {campaigns.map((c) => (
              <div 
                key={c.id} 
                onClick={() => navigate(`/dashboard/campaigns/${c.id}`)}
                className="grid grid-cols-4 p-4 text-sm items-center hover:bg-slate-50 transition cursor-pointer"
              >
                <div className="font-medium text-slate-900">{c.name}</div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    c.status === 'SENT' ? 'bg-emerald-100 text-emerald-700' : 
                    c.status === 'DRAFT' ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {c.status}
                  </span>
                </div>
                <div className="text-slate-500">{c.type}</div>
                <div className="text-indigo-600 font-semibold flex items-center gap-1">
                  Manage <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <Megaphone className="text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-slate-900">No campaigns found</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6">You haven't created any outreach campaigns yet.</p>
            <button onClick={() => setIsModalOpen(true)} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition">
              Create Your First Campaign
            </button>
          </div>
        )}
      </div>

      <CreateCampaignModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={(data) => {
          setCampaigns([...campaigns, data]);
          navigate(`/dashboard/campaigns/${data.id}`);
        }}
      />
    </div>
  );
}
