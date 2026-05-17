import { Loader2, Megaphone } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

export function DashboardHome() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await api.get("/analytics/overall");
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const getStatValue = (type: string) => {
    const stat = stats.find(s => s.type === type);
    return stat ? stat.count : "0";
  };

  return (
    <>
      <section className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5">
        <p className="font-semibold text-indigo-800">Your account is approved</p>
        <p className="mt-1 text-sm text-indigo-700">You can now send up to 100 emails per month. Need more? Upgrade your plan for higher limits.</p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { title: "Email Opens", value: getStatValue("OPEN"), growth: stats.length > 0 ? "Last 30 days" : "No data yet" },
          { title: "Link Clicks", value: getStatValue("CLICK"), growth: stats.length > 0 ? "Last 30 days" : "No data yet" },
          { title: "Meetings Booked", value: "0", growth: "Coming soon" },
        ].map((card) => (
          <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{card.title}</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight">{loading ? <Loader2 className="animate-spin text-indigo-500" /> : card.value}</p>
            <span className="mt-3 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {card.growth}
            </span>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <p className="text-lg font-semibold">Success Gap ROI</p>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Live Attribution</span>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-slate-500">Attributed Revenue</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">$0.00</p>
              <div className="mt-2 flex items-center gap-1 text-xs text-slate-400 font-medium">
                <span>0.0%</span>
                <span>vs last month</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500">Conversion Rate</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">0.0%</p>
              <div className="mt-2 flex items-center gap-1 text-xs text-slate-400 font-medium">
                <span>Pending Data</span>
                <span>Target: 4.0%</span>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-4">Engagement Funnel</p>
            <div className="space-y-4">
              {[
                { label: 'Delivered', value: '0%', color: 'bg-indigo-500' },
                { label: 'Opened', value: '0%', color: 'bg-indigo-400' },
                { label: 'Clicked', value: '0%', color: 'bg-indigo-300' },
                { label: 'Converted', value: '0%', color: 'bg-indigo-200' },
              ].map((step) => (
                <div key={step.label}>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-slate-600 font-medium">{step.label}</span>
                    <span className="text-slate-900 font-bold">{step.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${step.color}`} style={{ width: step.value }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-lg font-semibold">Your campaigns</p>
          <div className="mt-4 flex flex-col items-center justify-center rounded-xl bg-slate-50 py-8 text-center border border-dashed border-slate-200">
            <Megaphone className="text-slate-300 mb-3" size={32} />
            <p className="text-sm font-semibold text-slate-900">Get Started</p>
            <p className="mt-1 text-xs text-slate-500 max-w-[200px]">Create your first outreach campaign to start seeing metrics here.</p>
            <button 
              onClick={() => navigate('/dashboard/campaigns')} 
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
            >
              Go to Campaigns
            </button>
          </div>
        </article>
      </section>
    </>
  );
}
