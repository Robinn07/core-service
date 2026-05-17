import { Loader2, Sparkles, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { ActionModal } from "../../components/ActionModal";

export function AudiencePage() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  async function fetchSubscribers() {
    setLoading(true);
    try {
      const data = await api.get("/subscribers");
      setSubscribers(data);
    } catch (error) {
      console.error("Failed to fetch subscribers:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddSubscriber = async (data: { email: string, firstName: string, lastName: string }) => {
    try {
      const res = await api.post("/subscribers", data);
      setSubscribers([...subscribers, res.subscriber || res]);
    } catch (error) {
      alert("Failed to add subscriber: " + error);
    }
  };

  const handleScoreAudience = async () => {
    setLoading(true);
    try {
      // Trigger backend AI segmentation/scoring
      await api.post("/ai/segmentation/cluster", {});
      alert("AI Audience Intelligence complete! Scores updated.");
      await fetchSubscribers();
    } catch (error) {
      console.error(error);
      alert("Failed to run AI Intelligence. Please ensure the AI service is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Audience Contacts</h2>
        <div className="flex gap-3">
          <button onClick={handleScoreAudience} className="flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 text-sm font-semibold hover:bg-indigo-100 transition">
            <Sparkles size={16} /> Run AI Intelligence
          </button>
          <button onClick={() => setIsModalOpen(true)} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition">
            + Add Contact
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-500">
          <div className="col-span-2">Subscriber</div>
          <div>Status</div>
          <div>Lead Score</div>
          <div>Churn Risk</div>
          <div>Added</div>
        </div>
        
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : subscribers.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {subscribers.map((sub) => (
              <div key={sub.id} className="grid grid-cols-6 p-4 text-sm items-center hover:bg-slate-50 transition cursor-pointer">
                <div className="col-span-2">
                  <div className="font-medium text-slate-900">{sub.email}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{sub.attributes?.name || 'No name provided'}</div>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    sub.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                    sub.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {sub.status || 'pending'}
                  </span>
                </div>
                <div>
                  {sub.leadScore !== undefined ? (
                    <span className="font-bold text-slate-700">{sub.leadScore} <span className="text-xs text-slate-400 font-normal">/ 100</span></span>
                  ) : <span className="text-slate-300">-</span>}
                </div>
                <div>
                  {sub.churnRisk ? (
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                      sub.churnRisk === 'HIGH' ? 'bg-red-100 text-red-700' : 
                      sub.churnRisk === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {sub.churnRisk}
                    </span>
                  ) : <span className="text-slate-300">-</span>}
                </div>
                <div className="text-slate-500">{new Date(sub.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <Users className="text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-slate-900">Your audience is empty</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6">Add contacts to start sending campaigns.</p>
            <button onClick={() => setIsModalOpen(true)} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition">
              Add Your First Contact
            </button>
          </div>
        )}
      </div>

      <ActionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Contact"
        description="Add a subscriber to your core CRM. They will receive a confirmation email to verify their intent."
        fields={[
          { label: "Email Address", name: "email", type: "email", placeholder: "alex@example.com", required: true },
          { label: "First Name", name: "firstName", type: "text", placeholder: "Alex" },
          { label: "Last Name", name: "lastName", type: "text", placeholder: "Smith" }
        ]}
        onSubmit={handleAddSubscriber}
        submitLabel="Add Contact"
      />
    </div>
  );
}
