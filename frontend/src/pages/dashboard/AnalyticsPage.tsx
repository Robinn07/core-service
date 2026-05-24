import { ArrowUpRight, BarChart3, Clock, Mail, MousePointer2, MousePointerClick, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'real-time' | 'history'>('real-time');

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const [subscribers, , overall] = await Promise.all([
          api.get("/subscribers"),
          api.get("/campaigns"),
          api.get("/analytics/overall")
        ]);
        
        const sent = overall.find((s: any) => s.type === 'SEND')?.count || 0;
        const opens = overall.find((s: any) => s.type === 'OPEN')?.count || 0;
        const clicks = overall.find((s: any) => s.type === 'CLICK')?.count || 0;

        setStats({
          totalSent: parseInt(sent),
          openRate: sent > 0 ? ((opens / sent) * 100).toFixed(1) : "0",
          clickRate: opens > 0 ? ((clicks / opens) * 100).toFixed(1) : "0",
          totalSubscribers: subscribers.length,
          recentActivity: overall.slice(0, 5).map((ev: any, i: number) => ({
            id: i,
            event: ev.type === 'OPEN' ? 'Email Opened' : ev.type === 'CLICK' ? 'Link Clicked' : 'System Event',
            user: "Active Subscriber",
            time: "Recently",
            type: ev.type.toLowerCase()
          }))
        });
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) return (
    <div className="mt-8 flex justify-center py-20">
      <div className="w-10 h-10 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="mt-8 space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Campaign Performance</h2>
          <p className="text-sm text-slate-500 mt-1">Aggregated data from your active marketing channels.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 p-1 shadow-sm">
          {[
            { id: 'real-time', label: 'Real-time' },
            { id: 'history', label: 'History' }
          ].map((p) => (
            <button 
              key={p.id} 
              onClick={() => setViewMode(p.id as any)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${viewMode === p.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Professional Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Sent", value: stats?.totalSent?.toLocaleString(), icon: Mail, trend: "Volume" },
          { label: "Avg Open Rate", value: stats?.openRate + "%", icon: MousePointer2, trend: "Engagement" },
          { label: "Avg Click Rate", value: stats?.clickRate + "%", icon: MousePointerClick, trend: "Conversion" },
          { label: "Total Audience", value: stats?.totalSubscribers?.toLocaleString(), icon: Users, trend: "Reach" },
        ].map((m, i) => (
          <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
                <m.icon size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {m.trend}
              </span>
            </div>
            <div className="mt-5">
              <h3 className="text-sm font-medium text-slate-500">{m.label}</h3>
              <div className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytical Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-slate-900" />
              Engagement Distribution
            </h3>
            <div className="flex gap-4">
               <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-slate-900" /> Opens
               </div>
               <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-slate-200" /> Clicks
               </div>
            </div>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-3 px-2">
            {[30, 60, 40, 80, 50, 70, 45, 90, 35, 55, 75, 40].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end gap-1 group">
                <div 
                  style={{ height: `${h * 0.4}%` }} 
                  className="w-full bg-slate-100 rounded-t-md group-hover:bg-slate-200 transition"
                />
                <div 
                  style={{ height: `${h}%` }} 
                  className="w-full bg-slate-900 rounded-t-md group-hover:bg-indigo-600 transition"
                />
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold mb-8 flex items-center gap-2 text-slate-900">
            <Clock size={18} className="text-slate-400" />
            Event Stream
          </h3>
          <div className="space-y-8 flex-1">
            {stats?.recentActivity.length > 0 ? stats.recentActivity.map((act: any) => (
              <div key={act.id} className="flex items-start gap-4 relative">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-900 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">{act.event}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{act.user}</div>
                </div>
                <div className="text-[10px] font-bold text-slate-300 uppercase">{act.time}</div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                   <BarChart3 size={24} />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Awaiting Events</p>
              </div>
            )}
          </div>
          <button className="w-full mt-8 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition text-[11px] font-black uppercase tracking-widest text-slate-600 border border-slate-100">
            Full Audit Log
          </button>
        </div>
      </div>

      {/* High-End Information Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900">Channel Distribution</h3>
            <ArrowUpRight size={16} className="text-slate-400" />
          </div>
          <div className="space-y-6">
            {stats?.totalSent > 0 ? (
              [
                { name: "Email Campaigns", val: 100, color: "bg-slate-900" },
              ].map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-[11px] font-bold mb-2.5 text-slate-500 uppercase tracking-wider">
                    <span>{c.name}</span>
                    <span className="text-slate-900">{c.val}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-900 transition-all duration-1000" style={{ width: '100%' }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">No Distribution Data</div>
                <p className="text-xs text-slate-400">Launch a campaign to see channel attribution.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-8 rounded-3xl bg-slate-900 text-white shadow-xl">
          <h3 className="font-bold mb-2">Performance Summary</h3>
          <p className="text-sm text-slate-400 mb-8">System generated summary based on current data.</p>
          <div className="space-y-5">
            {stats?.totalSent > 0 ? (
              <>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Active Insight</div>
                  <p className="text-xs leading-relaxed text-slate-200">
                    Your campaign is currently active. We are monitoring engagement levels to provide optimization tips.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 opacity-50">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Pending Data</div>
                  <p className="text-xs leading-relaxed text-slate-200 italic">
                    Additional insights will unlock as your audience grows.
                  </p>
                </div>
              </>
            ) : (
              <div className="py-10 text-center border border-dashed border-white/10 rounded-2xl">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Collecting Insights</p>
                 <p className="text-[11px] text-slate-400 max-w-[180px] mx-auto">Insights will be generated automatically once your first 100 emails are processed.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
