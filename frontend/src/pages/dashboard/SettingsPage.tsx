import { Globe, Lock, Mail, Save, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { DomainSettings } from "../../components/DomainSettings";

export function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "General", icon: Globe },
    { id: "domains", label: "Domains", icon: Mail },
    { id: "security", label: "Security", icon: ShieldCheck },
    { id: "billing", label: "Billing", icon: Lock },
  ];

  return (
    <div className="mt-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === tab.id 
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6 pb-12">
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Organization Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Organization Name</label>
                    <input 
                      type="text" 
                      defaultValue="LoopX Studio" 
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:border-indigo-500 outline-none transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Support Email</label>
                    <input 
                      type="email" 
                      defaultValue={user?.email || "support@loopx.io"} 
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:border-indigo-500 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Company Branding</h3>
                <p className="text-sm text-slate-500 mb-6">This will be used for your landing pages and system emails.</p>
                <div className="flex items-center gap-8">
                  <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-100">
                    LX
                  </div>
                  <button className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                    Change Logo
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "domains" && (
            <DomainSettings />
          )}

          {activeTab === "security" && (
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-center py-20">
              <ShieldCheck size={48} className="text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900">Security & Authentication</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">Manage two-factor authentication, session history, and API access keys.</p>
              <button className="mt-8 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition">
                Enable 2FA
              </button>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition">
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
